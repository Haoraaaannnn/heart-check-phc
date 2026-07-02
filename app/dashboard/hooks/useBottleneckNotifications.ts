import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  type: 'bottleneck' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function useBottleneckNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifiedPatientsRef = useRef<Set<number>>(new Set());

  const checkBottleneck = useCallback(async () => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      // Query patients currently in consultation (with doctor)
      const { data, error } = await supabase
        .from('patients')
        .select('id, patientNum, status, created_at, consult_start, cubicleNum, service')
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay);

      if (error || !data) return;

      const CONSULTING_STATUSES = ['with doctor', 'consulting', 'on progress', 'serving'];
      const consultationThresholdMs = 15 * 60 * 1000; // 15 minutes
      const currentConsultingIds = new Set<number>();

      data.forEach((patient) => {
        const status = patient.status?.toLowerCase().trim() || '';
        const isConsulting = CONSULTING_STATUSES.includes(status);
        const hasConsultationStart = patient.consult_start;

        if (isConsulting && hasConsultationStart) {
          currentConsultingIds.add(patient.id);
          const consultStartTime = new Date(patient.consult_start).getTime();
          const consultationDurationMs = now.getTime() - consultStartTime;

          // Check if consultation exceeds 15 minutes
          if (consultationDurationMs > consultationThresholdMs) {
            // Only notify once per patient
            if (!notifiedPatientsRef.current.has(patient.id)) {
              const consultationDurationMins = Math.floor(consultationDurationMs / 60000);
              const cubicleInfo = patient.cubicleNum ? ` in cubicle ${patient.cubicleNum}` : '';

              const newNotification: Notification = {
                id: `bottleneck-${patient.id}-${Date.now()}`,
                type: 'bottleneck',
                title: '⚠️ Extended Consultation Time',
                message: `Patient ${patient.patientNum}${cubicleInfo} has been with doctor for ${consultationDurationMins} minutes (exceeds 15 min threshold).`,
                timestamp: new Date(),
                read: false,
              };

              setNotifications((prev) => [newNotification, ...prev]);
              notifiedPatientsRef.current.add(patient.id);
            }
          }
        }
      });

      // Remove patients from notified set when they're no longer consulting
      const finishedPatients = Array.from(notifiedPatientsRef.current).filter(
        (id) => !currentConsultingIds.has(id)
      );
      finishedPatients.forEach((id) => notifiedPatientsRef.current.delete(id));
    } catch (error) {
      console.error('Error checking bottleneck:', error);
    }
  }, []);

  // Poll for consultation time checks every 30 seconds
  useEffect(() => {
    checkBottleneck();
    const interval = setInterval(checkBottleneck, 30000);
    return () => clearInterval(interval);
  }, [checkBottleneck]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Update unread count
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
  };
}
