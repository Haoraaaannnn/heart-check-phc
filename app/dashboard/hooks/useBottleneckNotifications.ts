/**
 * @fileoverview System-wide real-time notification controller hook for Heart Check PHC.
 *
 * Continuously evaluates live clinic operations against clinical and operational safety thresholds:
 * 1. Extended physician consultation bottlenecks (>15 minutes)
 * 2. Prolonged queue waiting times (>30 minutes critical, >15 minutes warning)
 * 3. High department queue volume surges and congestion (>=5 warning, >=10 congestion alert)
 * 4. Unattended idle / skipped patient tickets awaiting triage action
 * 5. Examination cubicle availability with on-duty physician while patients wait
 * 6. Daily operational intake and completion milestones
 * 7. Network offline and synchronization recovery notifications
 *
 * Adheres strictly to AGENTS.md:
 * - Security-first: filters `is_historical = false` to preserve historical data boundaries
 * - Zero emojis standard across all messages and logs
 * - Separates copy into `notificationTexts.ts`
 * - No text truncation or unhandled null states
 * - Fully documented with JSDoc
 *
 * @module app/dashboard/hooks/useBottleneckNotifications
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { NOTIFICATION_TEXTS } from '@/app/dashboard/constants/notificationTexts';

/**
 * Severity classification for operational notifications.
 */
export type NotificationType = 'bottleneck' | 'warning' | 'info' | 'notice';

/**
 * Enterprise operational notification record.
 */
export interface Notification {
  /** Deterministic identifier preventing duplicate notification generation */
  id: string;
  /** Operational severity category */
  type: NotificationType;
  /** High-contrast bold notification title */
  title: string;
  /** Detailed clinical or operational guidance text (no emojis, no truncation) */
  message: string;
  /** Occurrence or creation timestamp */
  timestamp: Date;
  /** Whether the notification has been marked as read */
  read: boolean;
}

/**
 * Configuration options for `useBottleneckNotifications`.
 */
export interface UseSystemNotificationsOptions {
  /** Optional service filter to scope notifications (e.g., 'Consultation') */
  service?: string | null;
  /** Optional cubicle filter to scope notifications (e.g., '1') */
  cubicleNum?: string | null;
  /** Background polling interval in milliseconds. Defaults to 25000 (25s). */
  pollIntervalMs?: number;
}

const CONSULTING_STATUSES = new Set(['with doctor', 'consulting', 'on progress', 'serving']);
const WAITING_STATUSES = new Set(['waiting', 'pending', 'queued']);
const IDLE_STATUSES = new Set(['idle', 'skipped', 'no show', 'no-show']);
const COMPLETED_STATUSES = new Set(['done', 'finished', 'completed', 'released']);
const CANCELLED_STATUSES = new Set(['cancelled', 'canceled']);

const CONSULTATION_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes
const WAIT_CRITICAL_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
const WAIT_WARNING_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

const INTAKE_MILESTONES = [500, 250, 200, 150, 100, 50, 25, 10];
const COMPLETED_MILESTONES = [200, 100, 50, 25, 10];

/**
 * Real-time enterprise notification hook tracking clinic bottlenecks and operational events.
 *
 * @param options - Optional configuration parameters.
 * @returns State and action handlers for the notifications dropdown.
 */
export function useBottleneckNotifications(options: UseSystemNotificationsOptions = {}) {
  const { service = null, cubicleNum = null, pollIntervalMs = 25000 } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Persistent reference sets to track read and user-dismissed notifications across polling ticks
  const dismissedIdsRef = useRef<Set<string>>(new Set());
  const readIdsRef = useRef<Set<string>>(new Set());
  const activeIdsRef = useRef<Set<string>>(new Set());
  const wasOfflineRef = useRef<boolean>(false);

  /**
   * Evaluates active database state and computes all active system notifications.
   */
  const evaluateSystemState = useCallback(async () => {
    try {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      ).toISOString();
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      ).toISOString();

      // Query active live patients registered today (strictly excluding historical research data)
      const { data: patientRows, error: patientError } = await supabase
        .from('patients')
        .select(
          'id, patientNum, status, created_at, consult_start, consult_end, cubicleNum, service, subcategory, idle_at'
        )
        .eq('is_historical', false)
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay);

      if (patientError) {
        console.warn('[NOTIFICATIONS] Error querying patients:', patientError.message);
        return;
      }

      // Query cubicles and on-duty doctors
      const [{ data: cubicleRows }, { data: doctorRows }] = await Promise.all([
        supabase.from('cubicle').select('id, cubicleNum, category, room, doctorId'),
        supabase.from('doctors').select('id, full_name, active'),
      ]);

      const activeDoctorMap = new Map<string, string>();
      (doctorRows || []).forEach((doc) => {
        if (doc.active && doc.full_name) {
          activeDoctorMap.set(doc.id, doc.full_name);
        }
      });

      const candidateNotifications: Notification[] = [];
      const currentActiveIds = new Set<string>();

      const patients = patientRows || [];
      const T = NOTIFICATION_TEXTS.templates;

      // Track active cubicles with consultations
      const activeConsultingCubicles = new Set<string>();
      const waitingCountByService: Record<string, number> = {};
      let totalIdleCount = 0;
      let totalCompletedCount = 0;
      const totalIntakeCount = patients.length;

      // 1. Process Patient Records
      patients.forEach((patient) => {
        const rawStatus = (patient.status || '').toLowerCase().trim();
        const ticketCode = patient.patientNum || `Ticket #${patient.id}`;
        const serviceName = patient.service || 'General Clinic';
        const cubicleLabel = patient.cubicleNum
          ? `Cubicle ${patient.cubicleNum}`
          : 'Assigned Station';

        // Check if filtered by service or cubicle
        if (service && patient.service && patient.service.toLowerCase() !== service.toLowerCase()) {
          return;
        }
        if (cubicleNum && patient.cubicleNum && patient.cubicleNum !== cubicleNum) {
          return;
        }

        const isConsulting = CONSULTING_STATUSES.has(rawStatus) && Boolean(patient.consult_start);
        const isCompleted = COMPLETED_STATUSES.has(rawStatus) || Boolean(patient.consult_end);
        const isCancelled = CANCELLED_STATUSES.has(rawStatus);
        const isIdle =
          IDLE_STATUSES.has(rawStatus) || (Boolean(patient.idle_at) && !isCompleted && !isCancelled);
        const isWaiting =
          WAITING_STATUSES.has(rawStatus) ||
          (!isConsulting && !isCompleted && !isCancelled && !isIdle);

        if (isCompleted) {
          totalCompletedCount += 1;
        }

        if (isIdle) {
          totalIdleCount += 1;
        }

        // --- CHECK A: Extended Consultation Duration (>15 minutes) ---
        if (isConsulting && patient.consult_start) {
          if (patient.cubicleNum) {
            activeConsultingCubicles.add(patient.cubicleNum.toString().trim());
          }

          const consultStartTime = new Date(patient.consult_start).getTime();
          const consultDurationMs = now.getTime() - consultStartTime;

          if (consultDurationMs > CONSULTATION_THRESHOLD_MS) {
            const mins = Math.max(15, Math.floor(consultDurationMs / 60000));
            const id = `consult-${patient.id}`;
            currentActiveIds.add(id);

            if (!dismissedIdsRef.current.has(id)) {
              candidateNotifications.push({
                id,
                type: 'bottleneck',
                title: T.consultationBottleneck.title,
                message: T.consultationBottleneck.buildMessage(ticketCode, cubicleLabel, mins),
                timestamp: new Date(patient.consult_start),
                read: readIdsRef.current.has(id),
              });
            }
          }
        }

        // --- CHECK B: Prolonged Queue Waiting Times (>30m critical, >15m warning) ---
        if (isWaiting && patient.created_at) {
          waitingCountByService[serviceName] = (waitingCountByService[serviceName] || 0) + 1;

          const queueStartTime = new Date(patient.created_at).getTime();
          const waitDurationMs = now.getTime() - queueStartTime;

          if (waitDurationMs > WAIT_CRITICAL_THRESHOLD_MS) {
            const mins = Math.max(30, Math.floor(waitDurationMs / 60000));
            const id = `wait-crit-${patient.id}`;
            currentActiveIds.add(id);

            if (!dismissedIdsRef.current.has(id)) {
              candidateNotifications.push({
                id,
                type: 'bottleneck',
                title: T.longWaitBottleneck.title,
                message: T.longWaitBottleneck.buildMessage(ticketCode, serviceName, mins),
                timestamp: new Date(patient.created_at),
                read: readIdsRef.current.has(id),
              });
            }
          } else if (waitDurationMs > WAIT_WARNING_THRESHOLD_MS) {
            const mins = Math.max(15, Math.floor(waitDurationMs / 60000));
            const id = `wait-warn-${patient.id}`;
            currentActiveIds.add(id);

            if (!dismissedIdsRef.current.has(id)) {
              candidateNotifications.push({
                id,
                type: 'warning',
                title: T.longWaitWarning.title,
                message: T.longWaitWarning.buildMessage(ticketCode, serviceName, mins),
                timestamp: new Date(patient.created_at),
                read: readIdsRef.current.has(id),
              });
            }
          }
        }
      });

      // --- CHECK C: Department Queue Volume Surges & Congestion ---
      Object.entries(waitingCountByService).forEach(([svc, count]) => {
        const safeKey = svc.replace(/\s+/g, '-').toLowerCase();
        if (count >= 10) {
          const id = `surge-${safeKey}`;
          currentActiveIds.add(id);

          if (!dismissedIdsRef.current.has(id)) {
            candidateNotifications.push({
              id,
              type: 'bottleneck',
              title: T.highCongestion.title,
              message: T.highCongestion.buildMessage(svc, count),
              timestamp: now,
              read: readIdsRef.current.has(id),
            });
          }
        } else if (count >= 5) {
          const id = `surge-${safeKey}`;
          currentActiveIds.add(id);

          if (!dismissedIdsRef.current.has(id)) {
            candidateNotifications.push({
              id,
              type: 'warning',
              title: T.queueSurge.title,
              message: T.queueSurge.buildMessage(svc, count),
              timestamp: now,
              read: readIdsRef.current.has(id),
            });
          }
        }
      });

      // --- CHECK D: Unattended Idle / Skipped Tickets ---
      if (totalIdleCount > 0) {
        const id = 'idle-tickets';
        currentActiveIds.add(id);

        if (!dismissedIdsRef.current.has(id)) {
          candidateNotifications.push({
            id,
            type: 'warning',
            title: T.idleTickets.title,
            message: T.idleTickets.buildMessage(totalIdleCount),
            timestamp: now,
            read: readIdsRef.current.has(id),
          });
        }
      }

      // --- CHECK E: Available Cubicles with Doctor On Duty While Patients Wait ---
      if (cubicleRows && cubicleRows.length > 0) {
        cubicleRows.forEach((cube) => {
          if (!cube.doctorId || !cube.cubicleNum) return;

          const docName = activeDoctorMap.get(cube.doctorId);
          if (!docName) return;

          const numStr = cube.cubicleNum.toString().trim();
          const isOccupied = activeConsultingCubicles.has(numStr);
          const cubeService = cube.category || 'General';
          const waitingInService = waitingCountByService[cubeService] || 0;

          if (!isOccupied && waitingInService > 0) {
            const id = `station-avail-${cube.id}`;
            currentActiveIds.add(id);

            if (!dismissedIdsRef.current.has(id)) {
              candidateNotifications.push({
                id,
                type: 'info',
                title: T.stationAvailable.title,
                message: T.stationAvailable.buildMessage(
                  `Cubicle ${cube.cubicleNum}`,
                  cubeService,
                  docName
                ),
                timestamp: now,
                read: readIdsRef.current.has(id),
              });
            }
          }
        });
      }

      // --- CHECK F: Daily Operations Intake Milestones ---
      const highestIntakeMilestone = INTAKE_MILESTONES.find((m) => totalIntakeCount >= m);
      if (highestIntakeMilestone) {
        const id = `milestone-intake-${highestIntakeMilestone}`;
        currentActiveIds.add(id);

        if (!dismissedIdsRef.current.has(id)) {
          candidateNotifications.push({
            id,
            type: 'notice',
            title: T.intakeMilestone.title,
            message: T.intakeMilestone.buildMessage(totalIntakeCount),
            timestamp: now,
            read: readIdsRef.current.has(id),
          });
        }
      }

      // --- CHECK G: Daily Completed Patients Milestone ---
      const highestCompletedMilestone = COMPLETED_MILESTONES.find((m) => totalCompletedCount >= m);
      if (highestCompletedMilestone) {
        const id = `milestone-completed-${highestCompletedMilestone}`;
        currentActiveIds.add(id);

        if (!dismissedIdsRef.current.has(id)) {
          candidateNotifications.push({
            id,
            type: 'notice',
            title: T.completedMilestone.title,
            message: T.completedMilestone.buildMessage(totalCompletedCount),
            timestamp: now,
            read: readIdsRef.current.has(id),
          });
        }
      }

      // --- CHECK H: Offline / Online Connection Notices ---
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        wasOfflineRef.current = true;
        const id = 'system-offline';
        currentActiveIds.add(id);

        if (!dismissedIdsRef.current.has(id)) {
          candidateNotifications.push({
            id,
            type: 'warning',
            title: T.networkOffline.title,
            message: T.networkOffline.message,
            timestamp: now,
            read: readIdsRef.current.has(id),
          });
        }
      } else if (wasOfflineRef.current) {
        const id = 'system-online';
        currentActiveIds.add(id);

        if (!dismissedIdsRef.current.has(id)) {
          candidateNotifications.push({
            id,
            type: 'info',
            title: T.networkOnline.title,
            message: T.networkOnline.message,
            timestamp: now,
            read: readIdsRef.current.has(id),
          });
        }
      }

      // Purge stale dismissed and read tracking for conditions that no longer exist
      activeIdsRef.current.forEach((prevId) => {
        if (!currentActiveIds.has(prevId)) {
          dismissedIdsRef.current.delete(prevId);
          readIdsRef.current.delete(prevId);
        }
      });
      activeIdsRef.current = currentActiveIds;

      // Sort notifications: unread first, then severity (bottleneck > warning > info > notice), then latest timestamp
      const severityWeight: Record<NotificationType, number> = {
        bottleneck: 4,
        warning: 3,
        info: 2,
        notice: 1,
      };

      candidateNotifications.sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        const diffWeight = (severityWeight[b.type] || 0) - (severityWeight[a.type] || 0);
        if (diffWeight !== 0) return diffWeight;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      setNotifications(candidateNotifications);
    } catch (err) {
      console.warn('[NOTIFICATIONS] Unexpected evaluation error:', err);
    }
  }, [service, cubicleNum]);

  // Initial evaluation and periodic polling
  useEffect(() => {
    evaluateSystemState();
    const timer = setInterval(evaluateSystemState, pollIntervalMs);
    return () => clearInterval(timer);
  }, [evaluateSystemState, pollIntervalMs]);

  // Real-time Supabase subscription on 'patients' with 500ms debounce
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const channel = supabase
      .channel('realtime:system-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            evaluateSystemState();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [evaluateSystemState]);

  // Browser network status listeners
  useEffect(() => {
    const handleOnline = () => {
      evaluateSystemState();
    };
    const handleOffline = () => {
      wasOfflineRef.current = true;
      evaluateSystemState();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [evaluateSystemState]);

  /** Marks an individual notification as read */
  const markAsRead = useCallback((id: string) => {
    readIdsRef.current.add(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  /** Marks all active notifications as read */
  const markAllAsRead = useCallback(() => {
    notifications.forEach((n) => readIdsRef.current.add(n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [notifications]);

  /** Dismisses an individual notification from the display panel */
  const dismissNotification = useCallback((id: string) => {
    dismissedIdsRef.current.add(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /** Clears and dismisses all active notifications */
  const clearAll = useCallback(() => {
    notifications.forEach((n) => dismissedIdsRef.current.add(n.id));
    setNotifications([]);
  }, [notifications]);

  // Synchronize unread badge counter
  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    refreshNotifications: evaluateSystemState,
  };
}

// Named alias for architectural flexibility
export { useBottleneckNotifications as useSystemNotifications };
export default useBottleneckNotifications;
