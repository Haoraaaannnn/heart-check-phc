'use client';

/**
 * @fileoverview Main Patient Transfer dashboard page (`app/transfer/page.tsx`).
 *
 * Coordinates real-time queue streaming, pointer-based drag-and-drop operations,
 * room and counter allocations, SMS alerts, text-to-speech audio announcements,
 * and multi-stage workflow transitions.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sidebar } from './components/Sidebar';
import { BreadcrumbNav } from './components/BreadcrumbNav';
import { ConsultationFlow } from './components/ConsultationFlow';
import { OPScreeningFlow } from './components/OPScreeningFlow';
import { OtherServicesFlow } from './components/OtherServicesFlow';
import { DragGhost } from './components/DragGhost';
import { DoctorsModal } from './components/DoctorsModal';
import { usePatientData } from './hooks/usePatientData';
import { useCubicleData } from './hooks/useCubicleData';
import { useAutoAssign } from './hooks/useAutoAssign';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useRealtimeSubscription } from './hooks/useRealtimeSubscription';
import { sendSMS } from '@/app/actions/sendSMS';
import { useMaxRotations } from './hooks/useMaxRotations';
import { useMyAccess } from './hooks/useMyAccess';
import { useRegistrationDragAndDrop } from './hooks/useRegistrationDragAndDrop';
import { Patient, Cubicle } from '@/types/Types';
import { useAutoRotate } from './hooks/useAutoRotate';
import { useRotateTimeout } from './hooks/useRotateTimeout';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { useRequireAuth } from './hooks/useRequireAuth';
import { MAX_PATIENTS_PER_CUBICLE } from './lib/constants';
import { useIdlePatients } from './hooks/useIdlePatients';
import { useRegistrationRotate } from './hooks/useRegistrationRotate';
import { transferTexts } from './constants/transferTexts';
import { NotificationBadge } from '@/components/reusables/NotificationBadge';

/**
 * Primary Patient Transfer dashboard view component.
 *
 * @returns The rendered transfer dashboard interface.
 */
export default function TransferPage() {
  const checking = useRequireAuth();
  useIdleTimeout();
  const router = useRouter();

  // Selected Service and Room State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedOPSubcategory, setSelectedOPSubcategory] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);

  // Audio and Modal State
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [showDoctorsModal, setShowDoctorsModal] = useState<boolean>(false);
  const [showUnassignedMenu, setShowUnassignedMenu] = useState<boolean>(false);

  // Registration and Pending Update State
  const [registrationPatients, setRegistrationPatients] = useState<Patient[]>([]);
  const pendingUpdatesRef = useRef<Patient[]>([]);
  const dragInProgressRef = useRef<boolean>(false);

  const { myServices, myRooms, myCounters, accessStatus, fetchMyAccess } = useMyAccess();

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
  } = usePatientData();

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
    fetchData
  );

  useEffect(() => {
    dragInProgressRef.current = Boolean(draggedPatient || regDraggedPatient);
  }, [draggedPatient, regDraggedPatient]);

  useEffect(() => {
    if (!draggedPatient) return;
    const timer = setTimeout(() => {
      console.warn('[drag] stuck for 30s — force resetting');
      resetDrag();
    }, 30000);
    return () => clearTimeout(timer);
  }, [draggedPatient, resetDrag]);

  const savingPendingUpdates = useRef<boolean>(false);

  // Fetch registration window patients
  const fetchRegistrationPatients = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .in('service', ['Consultation', 'OPD Screening'])
      .not('counter', 'is', null)
      .is('reg_end', null)
      .neq('status', 'Assigned')
      .neq('status', 'Idle')
      .neq('status', 'Removed')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('counter', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (!error && data) {
      const sortKey = (p: Patient) =>
        new Date(p.counter_rejoin_at || p.created_at || 0).getTime();

      const byCounter = new Map<number, Patient[]>();
      for (const p of data as Patient[]) {
        if (!p.counter) continue;
        if (!byCounter.has(p.counter)) byCounter.set(p.counter, []);
        byCounter.get(p.counter)!.push(p);
      }

      const startUpdates: { id: number; counter_top_started_at: string }[] = [];
      const clearUpdates: { id: number; counter_top_started_at: null }[] = [];
      const now = new Date().toISOString();

      for (const [, patients] of byCounter) {
        const sorted = [...patients].sort((a, b) => sortKey(a) - sortKey(b));
        const [top, ...rest] = sorted;
        if (top && !top.counter_top_started_at) {
          startUpdates.push({ id: top.id, counter_top_started_at: now });
          top.counter_top_started_at = now;
        }
        for (const p of rest) {
          if (p.counter_top_started_at) {
            clearUpdates.push({ id: p.id, counter_top_started_at: null });
            p.counter_top_started_at = null;
          }
        }
      }

      if (startUpdates.length > 0) {
        await supabase.from('patients').upsert(startUpdates, { onConflict: 'id' });
      }
      if (clearUpdates.length > 0) {
        await supabase.from('patients').upsert(clearUpdates, { onConflict: 'id' });
      }

      setRegistrationPatients(data as Patient[]);
    }
  }, []);

  const reapplyPendingUpdates = useCallback((pending: Patient[]) => {
    if (pending.length === 0) return;
    const pendingMap = new Map(pending.map(p => [p.id, p]));

    setOnProgressPatients(prev =>
      prev.filter(p => {
        const u = pendingMap.get(p.id);
        return !u || u.status !== 'Assigned';
      })
    );

    setAssignedPatients(prev => {
      const next = { ...prev };
      for (const p of pending) {
        if (p.status === 'Assigned' && p.cubicleNum) {
          const list = next[p.cubicleNum] || [];
          if (!list.some(x => x.id === p.id)) {
            next[p.cubicleNum] = [...list, p];
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

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleRealtimeUpdate = useCallback(() => {
    if (dragInProgressRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      void syncNow();
    }, 400);
  }, [syncNow]);

  useRealtimeSubscription(handleRealtimeUpdate);

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
    autoAssignBusy
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
    fetchRegistrationPatients,
    registrationRotateBusy,
    rotateTimeoutMs,
    maxRotations
  );

  useEffect(() => {
    pendingUpdatesRef.current = pendingUpdates;
    pendingAutoRotateIdsRef.current = new Set(pendingUpdates.map(p => p.id));
  }, [pendingUpdates]);

  const isConsultation = selectedCategory === 'Consultation';
  const isOPScreening = selectedCategory === 'OPD Screening';
  const isDragEnabled = isConsultation || isOPScreening;

  useEffect(() => {
    const cleanup = setupGlobalDragHandlers(isDragEnabled);
    return cleanup;
  }, [draggedPatient, dragOverCubicle, assignedPatients, isDragEnabled, setupGlobalDragHandlers]);

  // Audio speech announcements via Deepgram
  const speak = async (text: string, patientId: number, times: number = 3) => {
    setSpeaking(patientId);
    try {
      const response = await fetch(
        'https://api.deepgram.com/v1/speak?model=aura-2-amalthea-en',
        {
          method: 'POST',
          headers: {
            Authorization: `Token ${process.env.NEXT_PUBLIC_DEEPGRAM_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        }
      );
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
          },
        ],
      };
    });

    setPendingUpdates(prev => [
      ...prev.filter(p => p.id !== patient.id),
      {
        ...patient,
        cubicleNum: bestCubicle.cubicleNum,
        status: 'Assigned',
        called_at: now,
      },
    ]);
  };

  /**
   * Releases a patient from the registration window into the queue.
   */
  const handleReleaseFromCounter = async (patient: Patient) => {
    const now = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('patients')
        .update({ reg_end: now })
        .eq('id', patient.id);

      if (error) {
        console.error('Failed to release patient from counter:', error);
        return;
      }

      setRegistrationPatients(prev => prev.filter(p => p.id !== patient.id));
      setOnProgressPatients(prev =>
        prev.map(p => (p.id === patient.id ? { ...p, reg_end: now } : p))
      );
    } catch (err: unknown) {
      console.error('Network error releasing patient from counter:', err);
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
   * Commits all pending manual assignments to Supabase and sends SMS alerts.
   */
  const handleConfirm = useCallback(async () => {
    if (pendingUpdates.length === 0 || savingPendingUpdates.current) return;

    const snapshot = [...pendingUpdates];
    savingPendingUpdates.current = true;
    confirmingRef.current = true;
    setIsConfirming(true);

    try {
      const now = new Date().toISOString();

      const patientUpdates = snapshot.map(patient => ({
        id: patient.id,
        cubicleNum: patient.cubicleNum,
        status: patient.status,
        reg_end: patient.reg_end,
        called_at:
          patient.called_at ??
          (patient.status === 'Assigned' ? now : null),
        queue_position: 9999,
        cooldown_until: patient.cooldown_until ?? null,
        progress_started_at: patient.progress_started_at ?? null,
      }));

      await supabase.from('patients').upsert(patientUpdates, { onConflict: 'id' });

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

      setPendingUpdates([]);
      pendingUpdatesRef.current = [];
      pendingAutoRotateIdsRef.current = new Set();

      await syncNow();
    } catch (err) {
      console.error('Failed to confirm assignments:', err);
    } finally {
      savingPendingUpdates.current = false;
      confirmingRef.current = false;
      setIsConfirming(false);
    }
  }, [pendingUpdates, setPendingUpdates, syncNow]);

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

    if (isConsultation && selectedSubcategory)
      return [...new Set(roomsFor(selectedSubcategory))].sort((a, b) => a - b);
    if (isOPScreening && selectedOPSubcategory)
      return [...new Set(roomsFor(selectedOPSubcategory))].sort((a, b) => a - b);
    if (!isConsultation && !isOPScreening && selectedCategory)
      return [...new Set(roomsFor(null))].sort((a, b) => a - b);
    return [];
  };

  const getAllowedSubcategories = (service: string) => {
    const fromMyRooms = myRooms
      .filter(r => r.service === service && r.subcategory)
      .map(r => r.subcategory as string);

    const fromCubicles = cubicles
      .filter(c => c.category === service && c.subcategory)
      .map(c => c.subcategory as string);

    return [...new Set([...fromMyRooms, ...fromCubicles, 'Adult', 'Pedia'])];
  };

  const getVisibleCubicles = () => {
    if (isConsultation && selectedSubcategory && selectedRoom) {
      return cubicles.filter(
        c =>
          c.category === selectedCategory &&
          c.subcategory === selectedSubcategory &&
          c.room === selectedRoom
      );
    } else if (isOPScreening && selectedOPSubcategory && selectedRoom) {
      return cubicles.filter(
        c =>
          c.category === selectedCategory &&
          c.subcategory === selectedOPSubcategory &&
          c.room === selectedRoom
      );
    } else if (!isConsultation && !isOPScreening && selectedCategory) {
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
    if (isConsultation) {
      if (p.service !== 'Consultation') return false;
      if (requireSubcategory && selectedSubcategory)
        return p.subcategory === selectedSubcategory;
      return true;
    }
    if (isOPScreening) {
      if (p.service !== 'OPD Screening') return false;
      if (requireSubcategory && selectedOPSubcategory)
        return p.subcategory === selectedOPSubcategory;
      return true;
    }
    return p.service === selectedCategory;
  };

  const visibleOnProgress = onProgressPatients.filter(p => matchesSelectedService(p, true));
  const visibleIdlePatients = idlePatients.filter(p => matchesSelectedService(p, true));

  const visibleRegistrationPatients = registrationPatients.filter(p => {
    if (isConsultation) {
      if (p.service !== 'Consultation') return false;
      if (selectedSubcategory) return p.subcategory === selectedSubcategory;
      return true;
    }
    if (isOPScreening) {
      if (p.service !== 'OPD Screening') return false;
      if (selectedOPSubcategory) return p.subcategory === selectedOPSubcategory;
      return true;
    }
    return true;
  });

  const queueCounts: Record<string, number> = {
    Consultation: onProgressPatients.filter(p => p.service === 'Consultation').length,
    'OPD Screening': onProgressPatients.filter(p => p.service === 'OPD Screening').length,
    'OPD Card': onProgressPatients.filter(p => p.service === 'OPD Card').length,
    'Refill Prescription': onProgressPatients.filter(p => p.service === 'Refill Prescription').length,
    ECG: onProgressPatients.filter(p => p.service === 'ECG').length,
    Warfarin: onProgressPatients.filter(p => p.service === 'Warfarin').length,
    'OPD Reschedule': onProgressPatients.filter(p => p.service === 'OPD Reschedule').length,
    Benzathine: onProgressPatients.filter(p => p.service === 'Benzathine').length,
  };

  const idleCounts: Record<string, number> = {
    Consultation: idlePatients.filter(p => p.service === 'Consultation').length,
    'OPD Screening': idlePatients.filter(p => p.service === 'OPD Screening').length,
    'OPD Card': idlePatients.filter(p => p.service === 'OPD Card').length,
    'Refill Prescription': idlePatients.filter(p => p.service === 'Refill Prescription').length,
    ECG: idlePatients.filter(p => p.service === 'ECG').length,
    Warfarin: idlePatients.filter(p => p.service === 'Warfarin').length,
    'OPD Reschedule': idlePatients.filter(p => p.service === 'OPD Reschedule').length,
    Benzathine: idlePatients.filter(p => p.service === 'Benzathine').length,
  };

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

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#cc3535] rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-[#cc3535] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-700 font-bold text-sm">Loading dashboard...</p>
          <p className="text-slate-400 text-xs mt-1">Synchronizing patients and cubicles</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!selectedCategory) {
      return (
        <div className="flex items-center justify-center h-[65vh]">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-red-50 text-[#cc3535] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
              <i className="bx bx-folder-open text-3xl" aria-hidden="true" />
            </div>
            <h2 className="text-base font-bold text-slate-800">No Service Selected</h2>
            <p className="text-slate-500 text-xs mt-1">
              Select a service from the sidebar navigation to view and manage patient queues.
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
          allowedSubcategories={getAllowedSubcategories('Consultation')}
        />
      );
    }

    if (isOPScreening) {
      return (
        <OPScreeningFlow
          selectedSubcategory={selectedOPSubcategory}
          onSelectSubcategory={setSelectedOPSubcategory}
          selectedRoom={selectedRoom}
          rooms={rooms}
          visibleCubicles={visibleCubicles}
          visibleOnProgress={visibleOnProgress}
          assignedPatients={assignedPatients}
          draggedPatient={draggedPatient}
          dragOverCubicle={dragOverCubicle}
          speaking={speaking}
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
          allowedSubcategories={getAllowedSubcategories('OPD Screening')}
        />
      );
    }

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
      />
    );
  };

  const showConfirmButton = (isConsultation || isOPScreening) && pendingUpdates.length > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* Fixed Sidebar */}
      <Sidebar
        selectedCategory={selectedCategory}
        queueCounts={queueCounts}
        idleCounts={idleCounts}
        allowedServices={myServices}
        onSelectCategory={cat => {
          setSelectedCategory(cat);
          setSelectedSubcategory(null);
          setSelectedOPSubcategory(null);
          setSelectedRoom(null);
        }}
      />

      {/* Main Content Area: Offset for icon rail (< 2xl) and full sidebar (>= 2xl) */}
      <div className="flex-1 ml-18 2xl:ml-64 flex flex-col h-screen overflow-hidden min-w-0 transition-all duration-200">
        {/* Top Header Bar (Fixed) */}
        <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-4 shrink-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
              PHC Transfer
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Needs Attention / Unassigned Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUnassignedMenu(v => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  totalUnassigned > 0
                    ? 'bg-red-50 border-red-200 text-[#cc3535] hover:bg-red-100'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
                title="Patients waiting to be assigned"
              >
                <i className="bx bx-user-voice text-base" aria-hidden="true" />
                <span>{totalUnassigned} Unassigned</span>
                <i
                  className={`bx bx-chevron-down text-sm transition-transform ${
                    showUnassignedMenu ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {showUnassignedMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowUnassignedMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50">
                      Needs Attention
                    </div>
                    <div className="max-h-72 overflow-y-auto phc-scroll">
                      {Object.entries(queueCounts)
                        .filter(([cat]) => myServices.includes(cat))
                        .filter(([, n]) => n > 0).length === 0 ? (
                        <p className="px-4 py-6 text-xs text-slate-400 text-center">
                          All caught up — nobody waiting.
                        </p>
                      ) : (
                        Object.entries(queueCounts)
                          .filter(([cat]) => myServices.includes(cat))
                          .filter(([, n]) => n > 0)
                          .sort((a, b) => b[1] - a[1])
                          .map(([cat, n]) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => jumpToCategory(cat)}
                              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold hover:bg-red-50 transition-colors text-left border-b border-slate-50"
                            >
                              <span className="text-slate-700">{cat}</span>
                              <NotificationBadge count={n} color="brand" />
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Manual Assignment Confirm Button */}
            {showConfirmButton && (
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={isConfirming}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#cc3535] text-white text-xs font-bold shadow-xs hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isConfirming ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <i className="bx bx-check-circle text-sm" aria-hidden="true" />
                    <span>
                      Confirm {pendingUpdates.length} Assignment
                      {pendingUpdates.length > 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Syncing Indicator */}
            {isSyncing && !isConfirming && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold">
                <div className="w-2.5 h-2.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Syncing...</span>
              </div>
            )}

            {/* Manage Doctors Action */}
            <button
              type="button"
              onClick={() => setShowDoctorsModal(true)}
              className="w-9 h-9 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl flex items-center justify-center transition-colors text-slate-600 cursor-pointer shadow-2xs"
              title="Manage Doctors"
            >
              <i className="bx bx-plus-medical text-base" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Sticky Sub-Header: Back Button & Breadcrumb Navigation (Permanently Pinned) */}
        <div className="shrink-0 px-6 py-2.5 bg-white/95 backdrop-blur-md border-b border-slate-200/90 z-20 flex items-center min-h-[52px]">
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

        {/* Scrollable Dashboard Content */}
        <main className="flex-1 p-6 overflow-y-auto phc-scroll min-h-0">

          {accessStatus === 'loading' ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-8 h-8 border-3 border-slate-200 border-t-[#cc3535] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500 text-xs font-medium">Verifying account access...</p>
              </div>
            </div>
          ) : accessStatus === 'error' ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center max-w-md mx-auto my-12">
              <h2 className="text-sm font-bold text-red-800">Unable to load access</h2>
              <p className="mt-1 text-xs text-red-600">
                Please refresh the page or contact a Super Admin.
              </p>
            </div>
          ) : accessStatus === 'unassigned' ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center max-w-md mx-auto my-12 shadow-xs">
              <h2 className="text-sm font-bold text-slate-800">No services assigned</h2>
              <p className="mt-1 text-xs text-slate-600">
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

      {/* Doctors Assignment Modal */}
      {showDoctorsModal && (
        <DoctorsModal onClose={() => setShowDoctorsModal(false)} />
      )}
    </div>
  );
}