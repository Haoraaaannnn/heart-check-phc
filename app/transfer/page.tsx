'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sidebar } from './components/Sidebar';
import { BreadcrumbNav } from './components/BreadcrumbNav';
import { ConsultationFlow } from './components/ConsultationFlow';
import { OPScreeningFlow } from './components/OPScreeningFlow';
import { OtherServicesFlow } from './components/OtherServicesFlow';
import { usePatientData } from './hooks/usePatientData';
import { useCubicleData } from './hooks/useCubicleData';
import { useAutoAssign } from './hooks/useAutoAssign';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useRealtimeSubscription } from './hooks/useRealtimeSubscription';
import { sendSMS } from "@/app/actions/sendSMS";
import { useMaxRotations } from './hooks/useMaxRotations';
import { useMyAccess } from './hooks/useMyAccess';

import { useRegistrationDragAndDrop } from './hooks/useRegistrationDragAndDrop';
import { Patient, Cubicle } from '@/types/Types';
import { useAutoRotate } from './hooks/useAutoRotate';
import { useRotateTimeout } from './hooks/useRotateTimeout';
import { DoctorsModal } from './components/DoctorsModal';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { useRequireAuth } from './hooks/useRequireAuth';
import { MAX_PATIENTS_PER_CUBICLE } from './lib/constants';
import { useIdlePatients } from './hooks/useIdlePatients';
import { useRegistrationRotate } from './hooks/useRegistrationRotate';

export default function TransferPage() {
  const checking = useRequireAuth();
  useIdleTimeout();
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedOPSubcategory, setSelectedOPSubcategory] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [registrationPatients, setRegistrationPatients] = useState<Patient[]>([]);
  const pendingUpdatesRef = useRef<Patient[]>([]);
  const dragInProgressRef = useRef(false);
  const [showDoctorsModal, setShowDoctorsModal] = useState(false);
  const [showUnassignedMenu, setShowUnassignedMenu] = useState(false);
  const { myServices, myRooms, myCounters, accessStatus, fetchMyAccess } = useMyAccess();

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmingRef = useRef(false);

  const rotateTimeoutMs = useRotateTimeout();
  const maxRotations = useMaxRotations();

  const { idlePatients, fetchIdlePatients, activatePatient, removePatient } = useIdlePatients();
  const registrationRotateBusy = useRef(false);
  const pendingAutoRotateIdsRef = useRef<Set<number>>(new Set());

  const { regDraggedPatient, dragOverCounter, handleRegDragStart } = useRegistrationDragAndDrop(
    registrationPatients, setRegistrationPatients
  );
  const { onProgressPatients, assignedPatients, setOnProgressPatients, setAssignedPatients, fetchData } = usePatientData();
  const { cubicles, fetchCubicles, cubicleDoctorMap } = useCubicleData();
  const {
    draggedPatient,
    dragOverCubicle,
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
    dragInProgressRef.current = Boolean(draggedPatient);
  }, [draggedPatient]);

  useEffect(() => {
    if (!draggedPatient) return;
    const timer = setTimeout(() => {
      console.warn('[drag] stuck for 30s — force resetting');
      resetDrag();
    }, 30000);
    return () => clearTimeout(timer);
  }, [draggedPatient, resetDrag]);

  const savingPendingUpdates = useRef(false);

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

      setRegistrationPatients(data);
    }
  }, []);

  const reapplyPendingUpdates = useCallback((pending: Patient[]) => {
    if (pending.length === 0) return;
    const pendingIds = pending.map(p => p.id);

    setAssignedPatients(prev => {
      const cleaned: Record<string, Patient[]> = {};
      for (const [cubicle, patients] of Object.entries(prev)) {
        cleaned[cubicle] = patients.filter(p => !pendingIds.includes(p.id));
      }

      const assignedPending = pending.filter(p => p.status === 'Assigned' && p.cubicleNum);
      const overflow: Patient[] = [];

      for (const p of assignedPending) {
        const bucket = cleaned[p.cubicleNum!] || [];
        if (bucket.length < MAX_PATIENTS_PER_CUBICLE) {
          cleaned[p.cubicleNum!] = [...bucket, p];
        } else {
          overflow.push(p); 
        }
      }

      if (overflow.length > 0) {
        const overflowIds = new Set(overflow.map(p => p.id));
        setOnProgressPatients(prevQueue => {
          const withoutOverflow = prevQueue.filter(q => !overflowIds.has(q.id));
          const requeued: Patient[] = overflow.map(p => ({
            ...p,
            status: 'On Progress',
            cubicleNum: null,
            called_at: undefined,
          }));
          return [...withoutOverflow, ...requeued];
        });
        setPendingUpdates(prevPending => prevPending.filter(p => !overflowIds.has(p.id)));
      }

      return cleaned;
    });
  }, [setOnProgressPatients, setAssignedPatients, setPendingUpdates]);


  const globalSyncRef = useRef(false);
  const fetchQueuedRef = useRef(false);

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

  const autoAssignBusy = useRef(false);
  const autoRotateBusy = useRef(false);

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
  useRegistrationRotate(registrationPatients, fetchRegistrationPatients, registrationRotateBusy, rotateTimeoutMs, maxRotations);

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
  }, [draggedPatient, dragOverCubicle, assignedPatients, isDragEnabled]);

  const speak = async (text: string, patientId: number, times: number = 3) => {
    setSpeaking(patientId);
    try {
      const response = await fetch(
        'https://api.deepgram.com/v1/speak?model=aura-2-amalthea-en',
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${process.env.NEXT_PUBLIC_DEEPGRAM_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        }
      );
      if (!response.ok) { setSpeaking(null); return; }
      const arrayBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      let count = 0;
      const audio = new Audio(audioUrl);
      const playOnce = async () => { audio.currentTime = 0; await audio.play(); count++; };
      audio.onended = () => {
        if (count < times) setTimeout(playOnce, 800);
        else { URL.revokeObjectURL(audioUrl); setSpeaking(null); }
      };
      await playOnce();
    } catch { setSpeaking(null); }
  };

  const handleAssignNow = (patient: Patient) => {
    if (!patient.service) return;

    const serviceCubicles = cubicles.filter(c => c.category === patient.service);

    const preferred = (patient.preferredCubicleNums ?? [])
      .map(num => serviceCubicles.find(c => c.cubicleNum === num))
      .filter((c): c is Cubicle => !!c)
      .filter(c => (assignedPatients[c.cubicleNum]?.length ?? 0) < MAX_PATIENTS_PER_CUBICLE);

    const candidates = preferred.length > 0
      ? preferred
      : serviceCubicles.filter(c =>
          (assignedPatients[c.cubicleNum]?.length ?? 0) < MAX_PATIENTS_PER_CUBICLE
        );

    if (candidates.length === 0) {
      console.warn('No available cubicle to assign this patient right now.');
      return;
    }

    const bestCubicle = candidates.reduce((best, c) =>
      (assignedPatients[c.cubicleNum]?.length ?? 0) <
      (assignedPatients[best.cubicleNum]?.length ?? 0) ? c : best
    );

    const now = new Date().toISOString();

    setOnProgressPatients(prev => prev.filter(p => p.id !== patient.id));

    setAssignedPatients(prev => {
      const bucket = prev[bestCubicle.cubicleNum] || [];
      if (bucket.length >= MAX_PATIENTS_PER_CUBICLE) return prev; 
      return {
        ...prev,
        [bestCubicle.cubicleNum]: [...bucket, { ...patient, cubicleNum: bestCubicle.cubicleNum, status: 'Assigned', called_at: now }],
      };
    });

    setPendingUpdates(prev => [
      ...prev.filter(p => p.id !== patient.id),
      { ...patient, cubicleNum: bestCubicle.cubicleNum, status: 'Assigned', called_at: now },
    ]);
  };

  const handleReleaseFromCounter = async (patient: Patient) => {
    const now = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('patients')
        .update({ reg_end: now })
        .eq('id', patient.id);

      if (error) {
        console.error('Failed to release patient from counter:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        return;
      }

      setRegistrationPatients(prev => prev.filter(p => p.id !== patient.id));
      setOnProgressPatients(prev =>
        prev.map(p => (p.id === patient.id ? { ...p, reg_end: now } : p))
      );
    } catch (err: any) {
      console.error('Network error releasing patient from counter:', err?.message ?? err);
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

  const handleConfirm = useCallback(async () => {
    if (pendingUpdates.length === 0 || savingPendingUpdates.current) return;

    const snapshot = [...pendingUpdates];
    savingPendingUpdates.current = true;
    confirmingRef.current = true;
    setIsConfirming(true);

    try {
      const now = new Date().toISOString();

      const patientUpdates = snapshot.map((patient) => ({
        id: patient.id,
        cubicleNum: patient.cubicleNum,
        status: patient.status,
        reg_end: patient.reg_end,
        called_at:
          patient.called_at ??
          (patient.status === "Assigned" ? now : null),
        queue_position: 9999,
        cooldown_until: patient.cooldown_until ?? null,
        progress_started_at: patient.progress_started_at ?? null,
      }));

      await supabase.from("patients").upsert(patientUpdates, { onConflict: "id" });

      await Promise.all(
        snapshot
          .filter(p => p.phoneNum && p.status === "Assigned" && p.cubicleNum)
          .map(p => sendSMS(String(p.phoneNum), p.patientNum, p.cubicleNum!))
      );

      const { data: queue } = await supabase
        .from("patients")
        .select("id")
        .neq("status", "Assigned")
        .order("queue_position");

      if (queue && queue.length > 0) {
        const reorder = queue.map((row, i) => ({ id: row.id, queue_position: i + 1 }));
        await supabase.from("patients").upsert(reorder, { onConflict: "id" });
      }

      setPendingUpdates([]);
      pendingUpdatesRef.current = [];
      pendingAutoRotateIdsRef.current = new Set();

      await syncNow();
    } catch (err) {
      console.error(err);
    } finally {
      savingPendingUpdates.current = false;
      confirmingRef.current = false;
      setIsConfirming(false);
    }
  }, [pendingUpdates, setPendingUpdates, syncNow]);


  const getAvailableRooms = () => {
    if (!selectedCategory) return [];
    const roomsFor = (subcategory: string | null) =>
      myRooms
        .filter(r => r.service === selectedCategory && (r.subcategory ?? null) === subcategory)
        .map(r => r.room);

    if (isConsultation && selectedSubcategory) return [...new Set(roomsFor(selectedSubcategory))].sort((a, b) => a - b);
    if (isOPScreening && selectedOPSubcategory) return [...new Set(roomsFor(selectedOPSubcategory))].sort((a, b) => a - b);
    if (!isConsultation && !isOPScreening && selectedCategory) return [...new Set(roomsFor(null))].sort((a, b) => a - b);
    return [];
  };

  const getVisibleCubicles = () => {
    if (isConsultation && selectedSubcategory && selectedRoom) {
      return cubicles.filter(c =>
        c.category === selectedCategory &&
        c.subcategory === selectedSubcategory &&
        c.room === selectedRoom
      );
    } else if (isOPScreening && selectedOPSubcategory && selectedRoom) {
      return cubicles.filter(c =>
        c.category === selectedCategory &&
        c.subcategory === selectedOPSubcategory &&
        c.room === selectedRoom
      );
    } else if (!isConsultation && !isOPScreening && selectedCategory) {
      // was: return cubicles.filter(c => c.category === selectedCategory);
      const allowedRooms = myRooms
        .filter(r => r.service === selectedCategory && r.subcategory === null)
        .map(r => r.room);
      return cubicles.filter(c => c.category === selectedCategory && allowedRooms.includes(c.room));
    }
    return [];
  };

  const visibleCubicles = getVisibleCubicles();
  const rooms = getAvailableRooms();

  const matchesSelectedService = (p: Patient, requireSubcategory: boolean) => {
    if (!selectedCategory) return true;
    if (isConsultation) {
      if (p.service !== 'Consultation') return false;
      if (requireSubcategory && selectedSubcategory) return p.subcategory === selectedSubcategory;
      return true;
    }
    if (isOPScreening) {
      if (p.service !== 'OPD Screening') return false;
      if (requireSubcategory && selectedOPSubcategory) return p.subcategory === selectedOPSubcategory;
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

  const queueCounts = {
    'Consultation': onProgressPatients.filter(p => p.service === 'Consultation').length,
    'OPD Screening': onProgressPatients.filter(p => p.service === 'OPD Screening').length,
    'OPD Card': onProgressPatients.filter(p => p.service === 'OPD Card').length,
    'Refill Prescription': onProgressPatients.filter(p => p.service === 'Refill Prescription').length,
    'ECG': onProgressPatients.filter(p => p.service === 'ECG').length,
    'Warfarin': onProgressPatients.filter(p => p.service === 'Warfarin').length,
    'OPD Reschedule': onProgressPatients.filter(p => p.service === 'OPD Reschedule').length,
    'Benzathine': onProgressPatients.filter(p => p.service === 'Benzathine').length,
  };

  const idleCounts: Record<string, number> = {
    'Consultation': idlePatients.filter(p => p.service === 'Consultation').length,
    'OPD Screening': idlePatients.filter(p => p.service === 'OPD Screening').length,
    'OPD Card': idlePatients.filter(p => p.service === 'OPD Card').length,
    'Refill Prescription': idlePatients.filter(p => p.service === 'Refill Prescription').length,
    'ECG': idlePatients.filter(p => p.service === 'ECG').length,
    'Warfarin': idlePatients.filter(p => p.service === 'Warfarin').length,
    'OPD Reschedule': idlePatients.filter(p => p.service === 'OPD Reschedule').length,
    'Benzathine': idlePatients.filter(p => p.service === 'Benzathine').length,
  };

  const totalUnassigned = Object.entries(queueCounts)
    .filter(([cat]) => myServices.includes(cat))
    .reduce((sum, [, n]) => sum + n, 0);

  const jumpToCategory = (category: string) => {
    if (!myServices.includes(category)) return; // guard against stale/injected calls
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setSelectedOPSubcategory(null);
    setSelectedRoom(null);
    setSidebarOpen(true);
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-white via-red-50 to-red-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!selectedCategory) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <i className="bx bx-folder-open text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-400 text-lg">Select a service from the sidebar</p>
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
          onDragStartFromQueue={handleDragStartFromQueue}
          onDragStartFromCubicle={handleDragStartFromCubicle}
          onSpeak={speak}
          onMoveBackToProgress={handleMoveBackToProgress}
          isDragEnabled={isDragEnabled}
          registrationPatients={visibleRegistrationPatients}
          regDraggedPatient={regDraggedPatient}
          dragOverCounter={dragOverCounter}
          onRegDragStart={handleRegDragStart}
          cubicleDoctorMap={cubicleDoctorMap}
          onReleaseFromCounter={handleReleaseFromCounter}
          onAssignNow={handleAssignNow}
          idlePatients={visibleIdlePatients}
          onActivateIdle={handleActivateIdle}
          onRemoveIdle={handleRemoveIdle}
          allowedCounters={myCounters}
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
          onDragStartFromQueue={handleDragStartFromQueue}
          onDragStartFromCubicle={handleDragStartFromCubicle}
          onSpeak={speak}
          onMoveBackToProgress={handleMoveBackToProgress}
          isDragEnabled={isDragEnabled}
          registrationPatients={visibleRegistrationPatients}
          regDraggedPatient={regDraggedPatient}
          dragOverCounter={dragOverCounter}
          onRegDragStart={handleRegDragStart}
          onReleaseFromCounter={handleReleaseFromCounter}
          onAssignNow={handleAssignNow}
          idlePatients={visibleIdlePatients}
          onActivateIdle={handleActivateIdle}
          onRemoveIdle={handleRemoveIdle}
          allowedCounters={myCounters}
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
        onDragStartFromQueue={handleDragStartFromQueue}
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
    <div className="flex min-h-screen bg-linear-to-br from-white via-red-50 to-red-100 font-sans">
    <Sidebar
      sidebarOpen={sidebarOpen}
      selectedCategory={selectedCategory}
      queueCounts={queueCounts}
      idleCounts={idleCounts}
      allowedServices={myServices}
      onSelectCategory={(cat) => {
        setSelectedCategory(cat);
        setSelectedSubcategory(null);
        setSelectedOPSubcategory(null);
        setSelectedRoom(null);
      }}
      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
    />

    {accessStatus === 'loading' ? (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading access...</p>
        </div>
      </div>
    ) : accessStatus === 'error' ? (
      <div className="flex-1 flex items-center justify-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-red-800">
            Unable to load access
          </h2>
          <p className="mt-2 text-sm text-red-600">
            Please refresh the page or contact a Super Admin.
          </p>
        </div>
      </div>
    ) : accessStatus === 'unassigned' ? (
      <div className="flex-1 flex items-center justify-center">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            No services assigned
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ask a Super Admin to assign your services, rooms, and counters before managing patients.
          </p>
        </div>
      </div>
    ) : (
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-sm border-b border-red-100 shadow-sm">
          <div className="flex items-center gap-2">
            <i className="bx bx-transfer text-gray-400 text-lg"></i>
            <span className="text-gray-500 text-sm">Patient Transfer</span>
          </div>
          <div className="flex items-center gap-2">

            {/* Global "needs attention" indicator — clickable from anywhere,
                independent of whether the sidebar is open or collapsed. */}
            <div className="relative">
              <button
                onClick={() => setShowUnassignedMenu(v => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
                  totalUnassigned > 0
                    ? 'bg-red-50 border-red-200 text-[#cc3535] hover:bg-red-100'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
                title="Patients waiting to be assigned"
              >
                <i className="bx bx-user-voice text-base"></i>
                {totalUnassigned} Unassigned
                <i className={`bx bx-chevron-down text-sm transition-transform ${showUnassignedMenu ? 'rotate-180' : ''}`}></i>
              </button>

              {showUnassignedMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowUnassignedMenu(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-40 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Needs Attention
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {Object.entries(queueCounts)
                        .filter(([cat]) => myServices.includes(cat))
                        .filter(([, n]) => n > 0).length === 0 && (
                        <p className="px-4 py-4 text-sm text-gray-400 text-center">All caught up — nobody waiting.</p>
                      )}
                      {Object.entries(queueCounts)
                        .filter(([cat]) => myServices.includes(cat))
                        .filter(([, n]) => n > 0)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, n]) => (
                          <button key={cat} onClick={() => jumpToCategory(cat)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-red-50 transition text-left">
                            <span className="text-gray-700">{cat}</span>
                            <span className="text-[#cc3535] font-bold bg-red-100 rounded-full px-2 py-0.5 text-xs">{n}</span>
                          </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            

            {/* Manual confirm — replaces the old 1.8s auto-commit timer for
                Consultation / OPD Screening assignments. */}
            {showConfirmButton && (
              <button
                onClick={() => void handleConfirm()}
                disabled={isConfirming}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#cc3535] text-white text-xs font-semibold shadow-sm hover:bg-red-700 transition disabled:opacity-50"
              >
                {isConfirming ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bx bx-check-circle text-sm"></i>
                    Confirm {pendingUpdates.length} Assignment{pendingUpdates.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            )}

            {isSyncing && !isConfirming && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-blue-600">Syncing...</span>
              </div>
            )}

            <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-50 transition" title="Notifications">
              <i className="bx bxs-bell text-lg text-gray-500"></i>
            </button>

            <button
              onClick={() => setShowDoctorsModal(true)}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-50 transition"
              title="Manage Doctors"
            >
              <i className="bx bx-plus-medical text-lg text-gray-500"></i>
            </button>

          </div>
        </div>

        <div className="px-8 py-6 h-[calc(100vh-73px)] overflow-y-auto">
          <BreadcrumbNav
            selectedCategory={selectedCategory}
            selectedSubcategory={isConsultation ? selectedSubcategory : selectedOPSubcategory}
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
          />

          {renderContent()}
        </div>
      </div>
      )}
      {showDoctorsModal && <DoctorsModal onClose={() => setShowDoctorsModal(false)} />}
    </div>
  );
}