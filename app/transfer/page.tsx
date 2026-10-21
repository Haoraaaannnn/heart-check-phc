'use client';

/**
 * @fileoverview Main Patient Transfer dashboard page (`app/transfer/page.tsx`).
 *
 * Coordinates real-time queue streaming, pointer-based drag-and-drop operations,
 * room and counter allocations, SMS alerts, text-to-speech audio announcements,
 * and multi-stage workflow transitions.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { toggleThemeWithRipple } from '@/lib/theme/themeTransition';
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/app/transfer/components/Sidebar';
import { BreadcrumbNav } from '@/app/transfer/components/BreadcrumbNav';
import { ConsultationFlow } from '@/app/transfer/components/ConsultationFlow';
import { OtherServicesFlow } from '@/app/transfer/components/OtherServicesFlow';
import { DragGhost } from '@/app/transfer/components/DragGhost';
import { DoctorsModal } from '@/app/transfer/components/DoctorsModal';
import { ConfirmAssignmentModal } from '@/app/transfer/components/ConfirmAssignmentModal';
import { usePatientData } from '@/app/transfer/hooks/usePatientData';
import { useCubicleData } from '@/app/transfer/hooks/useCubicleData';
import { useAutoAssign } from '@/app/transfer/hooks/useAutoAssign';
import { useDragAndDrop, useTransferSelection } from '@/app/transfer/hooks/useDragAndDrop';
import { useRealtimeSubscription } from '@/app/transfer/hooks/useRealtimeSubscription';
import { sendSMS } from '@/app/actions/sendSMS';
import { useMaxRotations } from '@/app/transfer/hooks/useMaxRotations';
import { useMyAccess } from '@/app/transfer/hooks/useMyAccess';
import { useRegistrationDragAndDrop } from '@/app/transfer/hooks/useRegistrationDragAndDrop';
import { Patient, Cubicle } from '@/types/Types';
import { useAutoRotate } from '@/app/transfer/hooks/useAutoRotate';
import { useRotateTimeout } from '@/app/transfer/hooks/useRotateTimeout';
import { useIdleTimeout } from '@/app/transfer/hooks/useIdleTimeout';
import { useRequireAuth } from '@/app/transfer/hooks/useRequireAuth';
import { MAX_PATIENTS_PER_CUBICLE } from '@/app/transfer/lib/constants';
import { useIdlePatients } from '@/app/transfer/hooks/useIdlePatients';
import { useRegistrationRotate } from '@/app/transfer/hooks/useRegistrationRotate';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { enqueueMutation, removeMutation } from '@/lib/offlineQueue';
import { ConnectionStatusBanner } from '@/components/reusables/ConnectionStatusBanner';
import { NotificationBadge } from '@/components/reusables/NotificationBadge';
import { useBottleneckNotifications } from '@/app/dashboard/hooks/useBottleneckNotifications';
import NotificationDropdown from '@/app/dashboard/components/NotificationDropdown';
import { transferTexts } from '@/constants/texts/transferTexts';
import { transferLayoutStyles } from '@/constants/designs/transferStyles';
import { resolveServiceIcon } from '@/constants/icons';


/**
 * Primary Patient Transfer dashboard view component.
 *
 * @returns The rendered transfer dashboard interface.
 */
export default function TransferPage() {
  const checking = useRequireAuth();
  useIdleTimeout();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    toggleThemeWithRipple(e, () => {
      setTheme(isDark ? 'light' : 'dark');
    });
  };

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll: clearAllNotifications,
  } = useBottleneckNotifications();

  // Selected Service and Room State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedOPSubcategory, setSelectedOPSubcategory] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);

  // Audio, Sidebar, and Modal State
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [showDoctorsModal, setShowDoctorsModal] = useState<boolean>(false);
  const [showUnassignedMenu, setShowUnassignedMenu] = useState<boolean>(false);

  // Registration and Pending Update State
  const [registrationPatients, setRegistrationPatients] = useState<Patient[]>([]);
  const registrationPatientsRef = useRef<Patient[]>([]);
  const pendingUpdatesRef = useRef<Patient[]>([]);
  const dragInProgressRef = useRef<boolean>(false);

  useEffect(() => {
    registrationPatientsRef.current = registrationPatients;
  }, [registrationPatients]);

  const { myServices, myRooms, myCounters, accessStatus, fetchMyAccess, allServices } = useMyAccess();
  const allServicesRef = useRef<Service[]>(allServices);
  useEffect(() => {
    allServicesRef.current = allServices;
  }, [allServices]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const confirmingRef = useRef<boolean>(false);

  const rotateTimeoutMs = useRotateTimeout();
  const maxRotations = useMaxRotations();

  const { idlePatients, fetchIdlePatients, activatePatient, removePatient } = useIdlePatients();
  const registrationRotateBusy = useRef<boolean>(false);
  const pendingAutoRotateIdsRef = useRef<Set<number>>(new Set());

  // Registration drag and drop hook (Pointer Events)
  const {
    regDraggedPatient,
    regDragPoint,
    dragOverCounter,
    handleRegPointerDown,
    handleRegDragStart,
  } = useRegistrationDragAndDrop(registrationPatients, setRegistrationPatients);

  // Core patient & cubicle data hooks
  const {
    onProgressPatients,
    assignedPatients,
    setOnProgressPatients,
    setAssignedPatients,
    fetchData,
    pinConfirmedPatient,
    unpinConfirmedPatient,
    getConfirmedPin,
  } = usePatientData(pendingUpdatesRef);

  const { cubicles, fetchCubicles, cubicleDoctorMap } = useCubicleData();

  // General drag and drop hook (Pointer Events)
  const {
    draggedPatient,
    dragPoint,
    dragOrigin,
    dragOverCubicle,
    handlePointerDownFromQueue,
    handlePointerDownFromCubicle,
    handleDragStartFromQueue,
    handleDragStartFromCubicle,
    handleMoveBackToProgress,
    setupGlobalDragHandlers,
    resetDrag,
    pendingUpdates,
    setPendingUpdates,
  } = useDragAndDrop(
    assignedPatients,
    setOnProgressPatients,
    setAssignedPatients,
    fetchData,
    pendingUpdatesRef,
    unpinConfirmedPatient
  );

  // Click-to-Select transfer hook (Tablet-friendly interaction)
  const {
    selectedPatient,
    selectPatient,
    clearSelection,
    assignSelectedToCubicle,
    moveSelectedToCounter,
  } = useTransferSelection({
    assignedPatients,
    setOnProgressPatients,
    setAssignedPatients,
    setPendingUpdates,
    setRegistrationPatients,
    pendingUpdatesRef,
    unpinConfirmedPatient,
  });

  const handleSelectQueuePatient = useCallback(
    (patient: Patient) => {
      selectPatient(patient, 'queue');
    },
    [selectPatient]
  );

  const handleSelectCubiclePatient = useCallback(
    (patient: Patient, cubicleNum: string) => {
      selectPatient(patient, 'cubicle', cubicleNum);
    },
    [selectPatient]
  );

  const handleSelectCounterPatient = useCallback(
    (patient: Patient, counterNum: number) => {
      selectPatient(patient, 'counter', counterNum);
    },
    [selectPatient]
  );

  const handleTargetCubicleClick = useCallback(
    (cubicleNum: string) => {
      assignSelectedToCubicle(cubicleNum);
    },
    [assignSelectedToCubicle]
  );

  const handleTargetCounterClick = useCallback(
    (counterNum: number) => {
      void moveSelectedToCounter(counterNum);
    },
    [moveSelectedToCounter]
  );

  useEffect(() => {
    dragInProgressRef.current = Boolean(draggedPatient || regDraggedPatient);
    if (draggedPatient || regDraggedPatient) {
      clearSelection();
    }
  }, [draggedPatient, regDraggedPatient, clearSelection]);

  useEffect(() => {
    if (!draggedPatient) return;
    const timer = setTimeout(() => {
      console.warn('[drag] stuck for 30s — force resetting');
      resetDrag();
    }, 30000);
    return () => clearTimeout(timer);
  }, [draggedPatient, resetDrag]);

  const savingPendingUpdates = useRef<boolean>(false);
  const regFetchSeqRef = useRef<number>(0);

  // Fetch registration window patients with sequence guard and derived timestamp persistence
  const fetchRegistrationPatients = useCallback(async () => {
    const requestId = ++regFetchSeqRef.current;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const currentServices = allServicesRef.current;
    const registrationServices = (currentServices ?? [])
      .filter((s) => s.requires_registration !== false)
      .map((s) => s.label_en);
    const serviceFilter =
      registrationServices.length > 0
        ? registrationServices
        : ['Consultation', 'OPD Screening'];

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .in('service', serviceFilter)
      .not('counter', 'is', null)
      .is('reg_end', null)
      .neq('status', 'Assigned')
      .neq('status', 'Idle')
      .neq('status', 'Removed')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('counter', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (requestId !== regFetchSeqRef.current) return;

    if (!error && data) {
      const sortKey = (p: Patient) =>
        new Date(p.counter_rejoin_at || p.created_at || 0).getTime();

      const byCounter = new Map<number, Patient[]>();
      for (const p of data as Patient[]) {
        if (!p.counter) continue;
        if (!byCounter.has(p.counter)) byCounter.set(p.counter, []);
        byCounter.get(p.counter)!.push(p);
      }

      const startIds: number[] = [];
      const clearIds: number[] = [];
      const now = new Date().toISOString();

      for (const [, patients] of byCounter) {
        const sorted = [...patients].sort((a, b) => sortKey(a) - sortKey(b));
        const [top, ...rest] = sorted;
        if (top) {
          if (!top.counter_top_started_at) {
            const existing = registrationPatientsRef.current.find(p => p.id === top.id);
            const wasRotated =
              existing &&
              ((top.rotation_count ?? 0) !== (existing.rotation_count ?? 0) ||
                top.counter_rejoin_at !== existing.counter_rejoin_at);
            const wasCounterChanged = existing && top.counter !== existing.counter;

            if (existing?.counter_top_started_at && !wasRotated && !wasCounterChanged) {
              top.counter_top_started_at = existing.counter_top_started_at;
            } else {
              top.counter_top_started_at = now;
              startIds.push(top.id);
            }
          }
        }
        for (const p of rest) {
          if (p.counter_top_started_at) {
            clearIds.push(p.id);
            p.counter_top_started_at = null;
          }
        }
      }

      if (startIds.length > 0 || clearIds.length > 0) {
        const jobs: PromiseLike<unknown>[] = [];
        if (startIds.length > 0) {
          jobs.push(
            supabase
              .from('patients')
              .update({ counter_top_started_at: now })
              .in('id', startIds)
              .eq('is_historical', false)
              .is('counter_top_started_at', null)
          );
        }
        if (clearIds.length > 0) {
          jobs.push(
            supabase
              .from('patients')
              .update({ counter_top_started_at: null })
              .in('id', clearIds)
              .eq('is_historical', false)
              .not('counter_top_started_at', 'is', null)
          );
        }
        void Promise.allSettled(jobs);
      }

      if (requestId === regFetchSeqRef.current) {
        registrationPatientsRef.current = data as Patient[];
        setRegistrationPatients(data as Patient[]);
      }
    }
  }, []);

  const reapplyPendingUpdates = useCallback((pending: Patient[]) => {
    if (pending.length === 0) return;
    const pendingMap = new Map(pending.map(p => [p.id, p]));

    setOnProgressPatients(prev => {
      let nextQueue = prev.filter(p => {
        const u = pendingMap.get(p.id);
        return !u || u.status !== 'Assigned';
      });
      for (const p of pending) {
        if (p.status !== 'Assigned' || !p.cubicleNum) {
          if (!nextQueue.some(x => x.id === p.id)) {
            nextQueue = [...nextQueue, p];
          } else {
            nextQueue = nextQueue.map(x => (x.id === p.id ? p : x));
          }
        }
      }
      return nextQueue;
    });

    setAssignedPatients(prev => {
      const next: Record<string, Patient[]> = {};
      for (const [k, list] of Object.entries(prev)) {
        next[k] = list.filter(p => {
          const u = pendingMap.get(p.id);
          if (!u) return true;
          return u.status === 'Assigned' && String(u.cubicleNum) === String(k);
        });
      }

      for (const p of pending) {
        if (p.status === 'Assigned' && p.cubicleNum) {
          const targetKey = String(p.cubicleNum);
          const list = next[targetKey] || [];
          if (!list.some(x => x.id === p.id)) {
            next[targetKey] = [...list, p];
          } else {
            next[targetKey] = list.map(x => (x.id === p.id ? p : x));
          }
        }
      }
      return next;
    });
  }, [setOnProgressPatients, setAssignedPatients]);

  const globalSyncRef = useRef<boolean>(false);
  const fetchQueuedRef = useRef<boolean>(false);

  const syncNow = useCallback(async () => {
    if (dragInProgressRef.current) return;

    if (globalSyncRef.current) {
      fetchQueuedRef.current = true;
      return;
    }

    globalSyncRef.current = true;
    setIsSyncing(true);
    try {
      do {
        fetchQueuedRef.current = false;
        await Promise.all([
          fetchData(),
          fetchRegistrationPatients(),
          fetchIdlePatients(),
        ]);
      } while (fetchQueuedRef.current && !dragInProgressRef.current);

      reapplyPendingUpdates(pendingUpdatesRef.current);
    } finally {
      setIsSyncing(false);
      globalSyncRef.current = false;
    }
  }, [fetchData, fetchRegistrationPatients, fetchIdlePatients, reapplyPendingUpdates]);

  const handleRealtimeUpdate = useCallback(() => {
    if (dragInProgressRef.current) return;
    void syncNow();
  }, [syncNow]);

  /**
   * Directly patches incoming Supabase Realtime payloads into local state in 0ms,
   * completely eliminating wait delays and preventing column jumpiness in Transfer.
   */
  const handleRealtimePayload = useCallback((payload: any) => {
    if (dragInProgressRef.current) return;
    const eventType = payload.eventType;
    const newRow = payload.new as Patient | undefined;
    const oldRow = payload.old as { id: number } | undefined;

    if (!newRow && !oldRow) return;

    if (eventType === 'DELETE' && oldRow?.id) {
      const deletedId = oldRow.id;
      unpinConfirmedPatient(deletedId);
      setOnProgressPatients(prev => prev.filter(p => p.id !== deletedId));
      setAssignedPatients(prev => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          next[key] = next[key].filter(p => p.id !== deletedId);
        }
        return next;
      });
      setRegistrationPatients(prev => prev.filter(p => p.id !== deletedId));
      return;
    }

    if (!newRow) return;
    const patient = newRow;

    // 1. If the patient is part of active unconfirmed drag/selection, do not overwrite
    if (pendingUpdatesRef.current.some(p => p.id === patient.id)) {
      return;
    }

    // 2. If the patient has an active confirmed pin, guard against stale lagging echoes
    const pin = getConfirmedPin(patient.id);
    if (pin) {
      const isMatchingPin =
        patient.status === pin.status && String(patient.cubicleNum) === String(pin.cubicleNum);
      if (!isMatchingPin) {
        // Discard stale or outdated echo packet (e.g. status was On Progress or cubicleNum was null/old)
        return;
      }
    }

    if (patient.status === 'Assigned' && patient.cubicleNum) {
      setOnProgressPatients(prev => prev.filter(p => p.id !== patient.id));
      setAssignedPatients(prev => {
        const cubicleKey = String(patient.cubicleNum);
        const cubicleList = prev[cubicleKey] || [];
        const exists = cubicleList.some(p => p.id === patient.id);
        const nextList = exists
          ? cubicleList.map(p => (p.id === patient.id ? patient : p))
          : [...cubicleList, patient];
        const next = { ...prev, [cubicleKey]: nextList };
        for (const [k, v] of Object.entries(next)) {
          if (String(k) !== cubicleKey) {
            next[k] = v.filter(p => p.id !== patient.id);
          }
        }
        return next;
      });
    } else if (
      patient.status === 'With Doctor' ||
      patient.status === 'Carryout' ||
      patient.status === 'Done' ||
      patient.status === 'Idle' ||
      patient.status === 'Removed'
    ) {
      unpinConfirmedPatient(patient.id);
      setOnProgressPatients(prev => prev.filter(p => p.id !== patient.id));
      setAssignedPatients(prev => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          next[key] = next[key].filter(p => p.id !== patient.id);
        }
        return next;
      });
    } else if (!patient.cubicleNum && patient.status !== 'Assigned') {
      setAssignedPatients(prev => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          next[key] = next[key].filter(p => p.id !== patient.id);
        }
        return next;
      });
      setOnProgressPatients(prev => {
        const exists = prev.some(p => p.id === patient.id);
        return exists ? prev.map(p => (p.id === patient.id ? patient : p)) : [...prev, patient];
      });
    }
  }, [setOnProgressPatients, setAssignedPatients, setRegistrationPatients, getConfirmedPin, unpinConfirmedPatient]);

  // Connection status tracking for weak-signal / offline resilience.
  const { isOnline, channelStatus, isFullyConnected, setChannelStatus } = useConnectionStatus();

  // Persistent offline mutation queue (handles sudden power loss & network drops)
  const { pendingCount, isSyncing: isSyncingQueue } = useOfflineQueue(syncNow);

  useRealtimeSubscription(handleRealtimeUpdate, setChannelStatus, handleRealtimePayload);


  const autoAssignBusy = useRef<boolean>(false);
  const autoRotateBusy = useRef<boolean>(false);

  useAutoAssign(
    selectedCategory,
    onProgressPatients,
    assignedPatients,
    cubicles,
    setPendingUpdates,
    setOnProgressPatients,
    setAssignedPatients,
    autoAssignBusy,
    allServices
  );

  useAutoRotate(
    onProgressPatients,
    assignedPatients,
    syncNow,
    autoRotateBusy,
    rotateTimeoutMs,
    maxRotations,
    pendingAutoRotateIdsRef,
    confirmingRef
  );

  useRegistrationRotate(
    registrationPatients,
    syncNow,
    registrationRotateBusy,
    rotateTimeoutMs,
    maxRotations,
    confirmingRef
  );

  useEffect(() => {
    pendingUpdatesRef.current = pendingUpdates;
    pendingAutoRotateIdsRef.current = new Set(pendingUpdates.map(p => p.id));
  }, [pendingUpdates]);

  const currentService = useMemo(
    () => allServices?.find(s => s.label_en === selectedCategory),
    [allServices, selectedCategory]
  );
  const serviceHasSubcategories = currentService?.has_subcategories ?? (selectedCategory === 'Consultation' || selectedCategory === 'OPD Screening');
  const serviceRequiresCubicle = currentService?.requires_cubicle ?? (selectedCategory === 'Consultation' || selectedCategory === 'OPD Screening');
  const isConsultation = serviceHasSubcategories;
  const isOPScreening = false;
  const isDragEnabled = serviceRequiresCubicle;

  useEffect(() => {
    const cleanup = setupGlobalDragHandlers(isDragEnabled);
    return cleanup;
  }, [draggedPatient, dragOverCubicle, assignedPatients, isDragEnabled, setupGlobalDragHandlers]);

  // Audio speech announcements via Deepgram
  const speak = async (text: string, patientId: number, times: number = 3) => {
    setSpeaking(patientId);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        setSpeaking(null);
        return;
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      let count = 0;
      const audio = new Audio(audioUrl);
      const playOnce = async () => {
        audio.currentTime = 0;
        await audio.play();
        count++;
      };
      audio.onended = () => {
        if (count < times) setTimeout(playOnce, 800);
        else {
          URL.revokeObjectURL(audioUrl);
          setSpeaking(null);
        }
      };
      await playOnce();
    } catch {
      setSpeaking(null);
    }
  };

  /**
   * Instantly assigns a patient to the least occupied available cubicle.
   */
  const handleAssignNow = (patient: Patient) => {
    if (!patient.service) return;

    const serviceCubicles = cubicles.filter(c => c.category === patient.service);

    const preferred = (patient.preferredCubicleNums ?? [])
      .map(num => serviceCubicles.find(c => c.cubicleNum === num))
      .filter((c): c is Cubicle => !!c)
      .filter(c => (assignedPatients[c.cubicleNum]?.length ?? 0) < MAX_PATIENTS_PER_CUBICLE);

    const candidates =
      preferred.length > 0
        ? preferred
        : serviceCubicles.filter(
          c => (assignedPatients[c.cubicleNum]?.length ?? 0) < MAX_PATIENTS_PER_CUBICLE
        );

    if (candidates.length === 0) {
      console.warn('No available cubicle to assign this patient right now.');
      return;
    }

    const bestCubicle = candidates.reduce((best, c) =>
      (assignedPatients[c.cubicleNum]?.length ?? 0) <
        (assignedPatients[best.cubicleNum]?.length ?? 0)
        ? c
        : best
    );

    const now = new Date().toISOString();

    setOnProgressPatients(prev => prev.filter(p => p.id !== patient.id));

    setAssignedPatients(prev => {
      const bucket = prev[bestCubicle.cubicleNum] || [];
      if (bucket.length >= MAX_PATIENTS_PER_CUBICLE) return prev;
      return {
        ...prev,
        [bestCubicle.cubicleNum]: [
          ...bucket,
          {
            ...patient,
            cubicleNum: bestCubicle.cubicleNum,
            status: 'Assigned',
            called_at: now,
            reg_end: patient.reg_end ?? now,
          },
        ],
      };
    });

    const nextPending = [
      ...pendingUpdatesRef.current.filter(p => p.id !== patient.id),
      {
        ...patient,
        cubicleNum: bestCubicle.cubicleNum,
        status: 'Assigned',
        called_at: now,
        reg_end: patient.reg_end ?? now,
      },
    ];
    pendingUpdatesRef.current = nextPending;
    setPendingUpdates(nextPending);
  };

  /**
   * Releases a patient from the registration window into the queue with offline outbox persistence.
   */
  const handleReleaseFromCounter = async (patient: Patient) => {
    const now = new Date().toISOString();
    let queuedId: string | null = null;

    try {
      const queued = await enqueueMutation({
        table: 'patients',
        type: 'update',
        payload: { reg_end: now },
        matchKey: 'id',
        matchValue: patient.id,
        clientTimestamp: now,
        description: `Release patient #${patient.id} from counter`,
      });
      queuedId = queued.id;
    } catch (e) {
      console.warn('Offline outbox enqueue warning:', e);
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const { error } = await supabase
          .from('patients')
          .update({ reg_end: now })
          .eq('id', patient.id)
          .eq('is_historical', false);

        if (!error && queuedId) {
          await removeMutation(queuedId);
        } else if (error) {
          console.error('Failed to release patient from counter:', error);
        }
      }

      setRegistrationPatients(prev => prev.filter(p => p.id !== patient.id));
      setOnProgressPatients(prev =>
        prev.map(p => (p.id === patient.id ? { ...p, reg_end: now } : p))
      );
    } catch (err: unknown) {
      console.warn('Network offline releasing patient from counter; saved to local outbox:', err);
      void syncNow();
    }
  };

  const handleActivateIdle = async (patient: Patient) => {
    await activatePatient(patient);
    await syncNow();
  };

  const handleRemoveIdle = async (patient: Patient) => {
    await removePatient(patient);
    await syncNow();
  };

  /**
   * Commits all pending manual assignments to Supabase with durable offline outbox persistence.
   */
  const handleConfirm = useCallback(async () => {
    if (pendingUpdates.length === 0 || savingPendingUpdates.current) return;

    const snapshot = [...pendingUpdates];
    savingPendingUpdates.current = true;
    confirmingRef.current = true;
    setIsConfirming(true);

    // Pin confirmed patients in local state so lagging fetches do not flicker them back to the queue
    for (const p of snapshot) {
      if (p.cubicleNum) {
        pinConfirmedPatient(p.id, p.cubicleNum, p.status || 'Assigned');
      }
    }

    try {
      const now = new Date().toISOString();

      const patientUpdates = snapshot.map(patient => ({
        id: patient.id,
        cubicleNum: patient.cubicleNum,
        status: patient.status,
        ...(patient.reg_end ? { reg_end: patient.reg_end } : {}),
        called_at: patient.called_at ?? (patient.status === 'Assigned' ? now : null),
        queue_position: 9999,
        cooldown_until: patient.cooldown_until ?? null,
        progress_started_at: patient.progress_started_at ?? null,
      }));

      // 1. Immediately log to non-volatile IndexedDB outbox
      let queuedId: string | null = null;
      try {
        const queued = await enqueueMutation({
          table: 'patients',
          type: 'upsert',
          payload: patientUpdates,
          matchKey: 'id',
          clientTimestamp: now,
          description: `Transfer confirm assignments for ${patientUpdates.length} patients`,
        });
        queuedId = queued.id;
      } catch (e) {
        console.warn('Offline outbox enqueue warning:', e);
      }

      // 2. If online, push directly to Supabase
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const { error: upsertErr } = await supabase.from('patients').upsert(patientUpdates, { onConflict: 'id' });
        if (!upsertErr && queuedId) {
          await removeMutation(queuedId);
        }

        // Execute outbound SMS alerts and queue renumbering as non-blocking background tasks
        void (async () => {
          try {
            await Promise.all(
              snapshot
                .filter(p => p.phoneNum && p.status === 'Assigned' && p.cubicleNum)
                .map(p => sendSMS(String(p.phoneNum), p.patientNum, p.cubicleNum!))
            );

            const { data: queue } = await supabase
              .from('patients')
              .select('id')
              .neq('status', 'Assigned')
              .order('queue_position');

            if (queue && queue.length > 0) {
              const reorder = queue.map((row, i) => ({ id: row.id, queue_position: i + 1 }));
              await supabase.from('patients').upsert(reorder, { onConflict: 'id' });
            }
          } catch (bgErr) {
            console.warn('Background SMS or queue reorder warning:', bgErr);
          }
        })();
      }

      setPendingUpdates([]);
      pendingUpdatesRef.current = [];
      pendingAutoRotateIdsRef.current = new Set();

      await syncNow();
    } catch (err) {
      console.warn('Offline outbox saved transfer assignments; network sync deferred:', err);
      for (const p of snapshot) {
        unpinConfirmedPatient(p.id);
      }
    } finally {
      savingPendingUpdates.current = false;
      confirmingRef.current = false;
      setIsConfirming(false);
    }
  }, [pendingUpdates, setPendingUpdates, syncNow, pinConfirmedPatient, unpinConfirmedPatient]);

  /**
   * Reverts all pending manual cubicle assignments and restores server queue state.
   */
  const handleCancelPending = useCallback(() => {
    for (const p of pendingUpdatesRef.current) {
      unpinConfirmedPatient(p.id);
    }
    setPendingUpdates([]);
    pendingUpdatesRef.current = [];
    pendingAutoRotateIdsRef.current = new Set();
    void fetchData();
  }, [fetchData, setPendingUpdates, unpinConfirmedPatient]);

  // Back navigation handler
  const handleBack = () => {
    if (selectedRoom) {
      setSelectedRoom(null);
    } else if (selectedSubcategory || selectedOPSubcategory) {
      setSelectedSubcategory(null);
      setSelectedOPSubcategory(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  const getAvailableRooms = () => {
    if (!selectedCategory) return [];

    const roomsFor = (subcategory: string | null) => {
      const fromAccess = myRooms
        .filter(r => r.service === selectedCategory && (r.subcategory ?? null) === subcategory)
        .map(r => r.room);

      if (fromAccess.length > 0) return fromAccess;

      // Fallback: If no restricted rooms found in user access, discover all rooms in cubicles table!
      return cubicles
        .filter(
          c =>
            c.category === selectedCategory &&
            (subcategory ? c.subcategory === subcategory : true)
        )
        .map(c => c.room);
    };

    if (serviceHasSubcategories && selectedSubcategory)
      return [...new Set(roomsFor(selectedSubcategory))].sort((a, b) => a - b);
    if (!serviceHasSubcategories && selectedCategory)
      return [...new Set(roomsFor(null))].sort((a, b) => a - b);
    return [];
  };

  const getAllowedSubcategories = (service: string | null) => {
    if (!service) return ['Adult', 'Pedia'];
    const fromMyRooms = myRooms
      .filter(r => r.service === service && r.subcategory)
      .map(r => r.subcategory as string);

    const fromCubicles = cubicles
      .filter(c => c.category === service && c.subcategory)
      .map(c => c.subcategory as string);

    return [...new Set([...fromMyRooms, ...fromCubicles, 'Adult', 'Pedia'])];
  };

  const getVisibleCubicles = () => {
    if (!selectedCategory) return [];
    if (serviceHasSubcategories && selectedSubcategory) {
      if (selectedRoom) {
        return cubicles.filter(
          c =>
            c.category === selectedCategory &&
            c.subcategory === selectedSubcategory &&
            c.room === selectedRoom
        );
      }
      return cubicles.filter(
        c => c.category === selectedCategory && c.subcategory === selectedSubcategory
      );
    } else if (!serviceHasSubcategories && selectedCategory) {
      const allowedRooms = myRooms
        .filter(r => r.service === selectedCategory && r.subcategory === null)
        .map(r => r.room);
      if (allowedRooms.length > 0) {
        return cubicles.filter(
          c => c.category === selectedCategory && allowedRooms.includes(c.room)
        );
      }
      return cubicles.filter(c => c.category === selectedCategory);
    }
    return [];
  };

  const visibleCubicles = getVisibleCubicles();
  const rooms = getAvailableRooms();

  const matchesSelectedService = (p: Patient, requireSubcategory: boolean) => {
    if (!selectedCategory) return true;
    if (p.service !== selectedCategory) return false;
    if (serviceHasSubcategories && requireSubcategory && selectedSubcategory)
      return p.subcategory === selectedSubcategory;
    return true;
  };

  /**
   * Returns true when the patient's counter is within the current user's allowed counter list.
   * Patients that have no counter value (walk-in or non-registered pathways) always pass through.
   * When the user has no counter restrictions (myCounters is empty), all patients pass through.
   *
   * @param p - Patient record to evaluate.
   * @returns Whether the patient belongs to one of the user's assigned counters.
   */
  const matchesMyCounters = (p: Patient): boolean => {
    if (myCounters.length === 0) return true;
    if (p.counter == null) return true;
    return myCounters.includes(p.counter);
  };

  const visibleOnProgress = onProgressPatients.filter(
    p => matchesSelectedService(p, true) && matchesMyCounters(p)
  );
  const visibleIdlePatients = idlePatients.filter(p => matchesSelectedService(p, true));

  const visibleRegistrationPatients = registrationPatients.filter(p => {
    if (!matchesMyCounters(p)) return false;
    if (selectedCategory && p.service !== selectedCategory) return false;
    if (serviceHasSubcategories && selectedSubcategory) return p.subcategory === selectedSubcategory;
    return true;
  });

  const queueCounts: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of onProgressPatients) {
      if (p.service) {
        counts[p.service] = (counts[p.service] || 0) + 1;
      }
    }
    return counts;
  }, [onProgressPatients]);

  const idleCounts: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of idlePatients) {
      if (p.service) {
        counts[p.service] = (counts[p.service] || 0) + 1;
      }
    }
    return counts;
  }, [idlePatients]);

  const totalUnassigned = Object.entries(queueCounts)
    .filter(([cat]) => myServices.includes(cat))
    .reduce((sum, [, n]) => sum + n, 0);

  const jumpToCategory = (category: string) => {
    if (!myServices.includes(category)) return;
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setSelectedOPSubcategory(null);
    setSelectedRoom(null);
    setShowUnassignedMenu(false);
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await Promise.all([
          fetchData(),
          fetchCubicles(),
          fetchRegistrationPatients(),
          fetchIdlePatients(),
          fetchMyAccess(),
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    const interval = setInterval(() => {
      void syncNow();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Synchronize registration counter list whenever dynamic services catalog updates
  useEffect(() => {
    if (allServices && allServices.length > 0) {
      void fetchRegistrationPatients();
    }
  }, [allServices, fetchRegistrationPatients]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0d0d0d]">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-[#2e2e2e] border-t-[#cc3535] rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0d0d0d]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 dark:border-[#2e2e2e] border-t-[#cc3535] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-700 dark:text-[#f5f5f5] font-bold text-sm">Loading dashboard...</p>
          <p className="text-slate-400 dark:text-[#737373] text-xs mt-1">Synchronizing patients and cubicles</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!selectedCategory) {
      return (
        <div className="flex items-center justify-center flex-1">
          <div className={transferLayoutStyles.emptyServiceCard}>
            <div className={transferLayoutStyles.emptyServiceIconBox}>
              <i className="bx bx-category" aria-hidden="true" />
            </div>
            <h2 className={transferLayoutStyles.emptyServiceTitle}>{transferTexts.noServiceSelectedTitle}</h2>
            <p className={transferLayoutStyles.emptyServiceDesc}>
              {transferTexts.noServiceSelectedDesc}
            </p>
          </div>
        </div>
      );
    }

    if (isConsultation) {
      return (
        <ConsultationFlow
          selectedSubcategory={selectedSubcategory}
          selectedRoom={selectedRoom}
          rooms={rooms}
          visibleCubicles={visibleCubicles}
          visibleOnProgress={visibleOnProgress}
          assignedPatients={assignedPatients}
          draggedPatient={draggedPatient}
          dragOverCubicle={dragOverCubicle}
          speaking={speaking}
          onSelectSubcategory={setSelectedSubcategory}
          onSelectRoom={setSelectedRoom}
          onPointerDownFromQueue={handlePointerDownFromQueue}
          onDragStartFromQueue={handleDragStartFromQueue}
          onPointerDownFromCubicle={handlePointerDownFromCubicle}
          onDragStartFromCubicle={handleDragStartFromCubicle}
          onSpeak={speak}
          onMoveBackToProgress={handleMoveBackToProgress}
          isDragEnabled={isDragEnabled}
          registrationPatients={visibleRegistrationPatients}
          regDraggedPatient={regDraggedPatient}
          dragOverCounter={dragOverCounter}
          onRegPointerDown={handleRegPointerDown}
          onRegDragStart={handleRegDragStart}
          cubicleDoctorMap={cubicleDoctorMap}
          onReleaseFromCounter={handleReleaseFromCounter}
          onAssignNow={handleAssignNow}
          idlePatients={visibleIdlePatients}
          onActivateIdle={handleActivateIdle}
          onRemoveIdle={handleRemoveIdle}
          allowedCounters={myCounters}
          allowedSubcategories={getAllowedSubcategories(selectedCategory)}
          selectedPatient={selectedPatient}
          onSelectQueuePatient={handleSelectQueuePatient}
          onSelectCubiclePatient={handleSelectCubiclePatient}
          onSelectCounterPatient={handleSelectCounterPatient}
          onTargetCubicleClick={handleTargetCubicleClick}
          onTargetCounterClick={handleTargetCounterClick}
          onCancelSelection={clearSelection}
        />
      );
    }

    const requiresReg = currentService?.requires_registration ?? (selectedCategory === 'Consultation' || selectedCategory === 'OPD Screening');

    return (
      <OtherServicesFlow
        visibleCubicles={visibleCubicles}
        visibleOnProgress={visibleOnProgress}
        assignedPatients={assignedPatients}
        draggedPatient={draggedPatient}
        dragOverCubicle={dragOverCubicle}
        speaking={speaking}
        selectedCategory={selectedCategory}
        onPointerDownFromQueue={handlePointerDownFromQueue}
        onDragStartFromQueue={handleDragStartFromQueue}
        onPointerDownFromCubicle={handlePointerDownFromCubicle}
        onDragStartFromCubicle={handleDragStartFromCubicle}
        onSpeak={speak}
        onMoveBackToProgress={handleMoveBackToProgress}
        isDragEnabled={isDragEnabled}
        rotateTimeoutMs={rotateTimeoutMs}
        idlePatients={visibleIdlePatients}
        onActivateIdle={handleActivateIdle}
        onRemoveIdle={handleRemoveIdle}
        onAssignNow={handleAssignNow}
        cubicleDoctorMap={cubicleDoctorMap}
        registrationPatients={requiresReg ? visibleRegistrationPatients : undefined}
        regDraggedPatient={requiresReg ? regDraggedPatient : undefined}
        dragOverCounter={requiresReg ? dragOverCounter : undefined}
        onRegPointerDown={requiresReg ? handleRegPointerDown : undefined}
        onRegDragStart={requiresReg ? handleRegDragStart : undefined}
        onReleaseFromCounter={requiresReg ? handleReleaseFromCounter : undefined}
        allowedCounters={myCounters}
        selectedPatient={selectedPatient}
        onSelectQueuePatient={handleSelectQueuePatient}
        onSelectCubiclePatient={handleSelectCubiclePatient}
        onSelectCounterPatient={handleSelectCounterPatient}
        onTargetCubicleClick={handleTargetCubicleClick}
        onTargetCounterClick={handleTargetCounterClick}
        onCancelSelection={clearSelection}
      />
    );
  };

  const showConfirmModal = (isConsultation || isOPScreening) && pendingUpdates.length > 0;

  return (
    <div className={transferLayoutStyles.page}>
      {/* Connection status banner — visible on weak signal, offline, or pending sync */}
      <ConnectionStatusBanner
        isOnline={isOnline}
        channelStatus={channelStatus}
        isFullyConnected={isFullyConnected}
        pendingCount={pendingCount}
        isSyncingQueue={isSyncingQueue}
        showIcon={false}
      />

      {/* Expandable/Collapsible Sidebar (Icon-only vs Expanded with text) */}
      <Sidebar
        isExpanded={isSidebarExpanded}
        selectedCategory={selectedCategory}
        queueCounts={queueCounts}
        idleCounts={idleCounts}
        allowedServices={myServices}
        services={allServices}
        onSelectCategory={cat => {
          setSelectedCategory(cat);
          setSelectedSubcategory(null);
          setSelectedOPSubcategory(null);
          setSelectedRoom(null);
        }}
      />

      {/* Main Content Area: Offset for icon rail (ml-18) or expanded panel (ml-64) */}
      <div className={transferLayoutStyles.mainArea(isSidebarExpanded)}>
        {/* Top Header Bar (Fixed) */}
        <header className={transferLayoutStyles.topHeader}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Sidebar Expand / Collapse Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSidebarExpanded(prev => !prev)}
              className={transferLayoutStyles.sidebarToggleBtn}
              title={isSidebarExpanded ? transferTexts.collapseSidebar : transferTexts.expandSidebar}
              aria-label={isSidebarExpanded ? transferTexts.collapseSidebar : transferTexts.expandSidebar}
            >
              <i
                className={`bx ${isSidebarExpanded ? 'bx-chevron-left' : 'bx-menu'} text-xl block`}
                aria-hidden="true"
              />
            </button>

            <span className={transferLayoutStyles.topHeaderTitle}>
              PHC Transfer
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Needs Attention / Unassigned Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUnassignedMenu(v => !v)}
                className={totalUnassigned > 0 ? transferLayoutStyles.unassignedBtnActive : transferLayoutStyles.unassignedBtnInactive}
                title="Patients waiting to be assigned"
              >
                <span>{totalUnassigned} Unassigned</span>
              </button>

              {showUnassignedMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowUnassignedMenu(false)}
                  />
                  <div className={transferLayoutStyles.unassignedDropdown}>
                    <div className={transferLayoutStyles.unassignedDropdownHeader}>
                      Needs Attention
                    </div>
                    <div className="flex-1 min-h-0 max-h-72 overflow-y-auto phc-scroll">
                      {Object.entries(queueCounts)
                        .filter(([cat]) => myServices.includes(cat))
                        .filter(([, n]) => n > 0).length === 0 ? (
                        <p className="px-4 py-6 text-xs text-slate-400 dark:text-[#737373] text-center">
                          {transferTexts.allCaughtUp}
                        </p>
                      ) : (
                        Object.entries(queueCounts)
                          .filter(([cat]) => myServices.includes(cat))
                          .filter(([, n]) => n > 0)
                          .sort((a, b) => b[1] - a[1])
                          .map(([cat, n]) => {
                            const serviceRecord = allServices.find(
                              s => s.label_en.trim().toLowerCase() === cat.trim().toLowerCase()
                            );
                            const icon = resolveServiceIcon(
                              serviceRecord ? { label_en: cat, icon_src: serviceRecord.icon_src } : cat
                            );
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => jumpToCategory(cat)}
                                className={transferLayoutStyles.unassignedDropdownItem}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <i className={`bx ${icon} text-sm text-slate-400 dark:text-[#a3a3a3] shrink-0`} aria-hidden="true" />
                                  <span className="text-slate-700 dark:text-[#f5f5f5] truncate">{cat}</span>
                                </div>
                                <NotificationBadge count={n} color="brand" />
                              </button>
                            );
                          })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Syncing Indicator */}
            {isSyncing && !isConfirming && (
              <div className={transferLayoutStyles.syncBadge}>
                <div className="w-2.5 h-2.5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span>Syncing...</span>
              </div>
            )}

            {/* Manage Doctors Action */}
            <button
              type="button"
              onClick={() => setShowDoctorsModal(true)}
              className={transferLayoutStyles.manageDoctorsBtn}
              title="Manage Doctors"
            >
              {transferTexts.doctorsBtn}
            </button>

            {/* System Notifications Dropdown */}
            {mounted && (
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDismiss={dismissNotification}
                onClearAll={clearAllNotifications}
              />
            )}

            {/* Dual Theme Toggle */}
            {mounted && (
              <button
                type="button"
                onClick={toggleTheme}
                className={transferLayoutStyles.themeToggleBtn}
                title={isDark ? transferTexts.themeToggleLight : transferTexts.themeToggleDark}
                aria-label={isDark ? transferTexts.themeToggleLight : transferTexts.themeToggleDark}
              >
                <i
                  className={`bx ${isDark ? 'bx-sun' : 'bx-moon'} text-xl block`}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        </header>

        {/* Sticky Sub-Header: Back Button & Breadcrumb Navigation (Permanently Pinned) */}
        <div className={transferLayoutStyles.subHeader}>
          <BreadcrumbNav
            selectedCategory={selectedCategory}
            selectedSubcategory={
              isConsultation ? selectedSubcategory : selectedOPSubcategory
            }
            selectedRoom={selectedRoom}
            isConsultation={isConsultation}
            onReset={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
              setSelectedOPSubcategory(null);
              setSelectedRoom(null);
            }}
            onResetToCategory={() => {
              setSelectedSubcategory(null);
              setSelectedOPSubcategory(null);
              setSelectedRoom(null);
            }}
            onResetToSubcategory={() => setSelectedRoom(null)}
            onBackStep={handleBack}
          />
        </div>

        {/* Main Dashboard Content (Non-scrollable, fit-to-screen) */}
        <main className={transferLayoutStyles.mainContent}>

          {accessStatus === 'loading' ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-8 h-8 border-3 border-slate-200 dark:border-[#2e2e2e] border-t-[#cc3535] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500 dark:text-[#a3a3a3] text-xs font-medium">Verifying account access...</p>
              </div>
            </div>
          ) : accessStatus === 'error' ? (
            <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-6 text-center max-w-md mx-auto my-12">
              <h2 className="text-sm font-bold text-red-800 dark:text-red-200">Unable to load access</h2>
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                Please refresh the page or contact a Super Admin.
              </p>
            </div>
          ) : accessStatus === 'unassigned' ? (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-6 text-center max-w-md mx-auto my-12 shadow-xs">
              <h2 className="text-sm font-bold text-slate-800 dark:text-amber-100">No services assigned</h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-amber-300">
                Ask a Super Admin to assign your services, rooms, and counters before managing patients.
              </p>
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>

      {/* Single DragGhost Portal Instance */}
      <DragGhost
        patient={draggedPatient ?? regDraggedPatient}
        point={dragPoint ?? regDragPoint}
        originDescription={
          draggedPatient
            ? dragOrigin
            : regDraggedPatient
              ? `Counter ${regDraggedPatient.counter}`
              : null
        }
        isValidDropTarget={Boolean(dragOverCubicle || dragOverCounter)}
      />

      {/* Confirm Assignment Modal */}
      <ConfirmAssignmentModal
        isOpen={Boolean(showConfirmModal)}
        pendingPatients={pendingUpdates}
        isConfirming={isConfirming}
        onConfirm={handleConfirm}
        onCancel={handleCancelPending}
      />

      {/* Doctors Assignment Modal */}
      {showDoctorsModal && (
        <DoctorsModal onClose={() => setShowDoctorsModal(false)} />
      )}
    </div>
  );
}