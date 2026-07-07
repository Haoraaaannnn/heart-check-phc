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
import { RegistrationCounterSection } from './components/RegistrationCounterSection';
import { useRegistrationDragAndDrop } from './hooks/useRegistrationDragAndDrop';
import { Patient } from '@/types/Types';

export default function TransferPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [registrationPatients, setRegistrationPatients] = useState<Patient[]>([]);
  const pendingUpdatesRef = useRef<Patient[]>([]);
  

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const { regDraggedPatient, dragOverCounter, handleRegDragStart } = useRegistrationDragAndDrop(
    registrationPatients, setRegistrationPatients
  );
  const { onProgressPatients, assignedPatients, setOnProgressPatients, setAssignedPatients, fetchData } = usePatientData();
  const { cubicles, fetchCubicles } = useCubicleData();
  const {
    draggedPatient,
    dragOverCubicle,
    handleDragStartFromQueue,
    handleDragStartFromCubicle,
    handleMoveBackToProgress,
    setupGlobalDragHandlers,
    pendingUpdates,
    setPendingUpdates,
  } = useDragAndDrop(
    assignedPatients,
    setOnProgressPatients,
    setAssignedPatients
  );

  const fetchRegistrationPatients = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .in('service', ['Consultation', 'OPD Screening'])
      .in('status', ['On Progress', 'Waiting'])
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('counter', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (!error && data) setRegistrationPatients(data);
  }, []);

    const syncing = useRef(false);

    const handleRealtimeUpdate = async () => {
      if (syncing.current) return;

      await fetchData();

      setAssignedPatients(prev => {
          const merged = {...prev};

          pendingUpdates.forEach(patient => {
          });

          return merged;
      });
      
      syncing.current = true;
      setIsSyncing(true);

      try {
        await Promise.all([
          fetchData(),
          fetchRegistrationPatients(),
        ]);
      } finally {
        setIsSyncing(false);
        syncing.current = false;
      }
    };

  useAutoAssign(
    selectedCategory,
    onProgressPatients,
    assignedPatients,
    cubicles,
    setPendingUpdates,
    setOnProgressPatients,
    setAssignedPatients
  );
  useRealtimeSubscription(handleRealtimeUpdate);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) { 
          router.replace('/login'); 
          return; 
        }
        
        await Promise.all([
          fetchData(),
          fetchRegistrationPatients(),
          fetchCubicles()
        ]);
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
  pendingUpdatesRef.current = pendingUpdates;
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

    const handleConfirm = async () => {
    if (pendingUpdates.length === 0) return;

    setIsSyncing(true);

    try {
      await Promise.all(
        pendingUpdates.map(async (patient) => {
          await supabase
            .from("patients")
            .update({
              cubicleNum: patient.cubicleNum,
              status: patient.status,
              reg_end: patient.reg_end,
            })
            .eq("id", patient.id);

          if (
            patient.phoneNum &&
            patient.status === "Assigned" &&
            patient.cubicleNum
          ) {
            await sendSMS(
              String(patient.phoneNum),
              patient.patientNum,
              patient.cubicleNum
            );
          }
        })
      );

      setPendingUpdates([]);
      pendingUpdatesRef.current = [];

      await Promise.all([
        fetchData(),
        fetchRegistrationPatients(),
      ]);

    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const getAvailableRooms = () => {
    if (!selectedCategory) return [];
    if (isConsultation && selectedSubcategory) {
      const filteredCubicles = cubicles.filter(c =>
        c.category === selectedCategory && c.subcategory === selectedSubcategory
      );
      return [...new Set(filteredCubicles.map(c => c.room))].sort();
    } else if (isOPScreening) {
      const filteredCubicles = cubicles.filter(c => c.category === selectedCategory);
      return [...new Set(filteredCubicles.map(c => c.room))].sort();
    } else if (!isConsultation && !isOPScreening && selectedCategory) {
      const filteredCubicles = cubicles.filter(c => c.category === selectedCategory);
      return [...new Set(filteredCubicles.map(c => c.room))].sort();
    }
    return [];
  };

  const getVisibleCubicles = () => {
    if (isConsultation && selectedSubcategory && selectedRoom) {
      return cubicles.filter(c =>
        c.category === selectedCategory &&
        c.subcategory === selectedSubcategory &&
        c.room === selectedRoom
      );
    } else if (isOPScreening && selectedRoom) {
      return cubicles.filter(c =>
        c.category === selectedCategory && c.room === selectedRoom
      );
    } else if (!isConsultation && !isOPScreening && selectedCategory) {
      return cubicles.filter(c => c.category === selectedCategory);
    }
    return [];
  };

  const visibleCubicles = getVisibleCubicles();
  const rooms = getAvailableRooms();

  const visibleOnProgress = onProgressPatients.filter(p => {
    if (!selectedCategory) return true;
    if (isConsultation) return p.service === 'Consultation';
    if (isOPScreening) return p.service === 'OPD Screening';
    return p.service === selectedCategory;
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
          registrationPatients={registrationPatients}
          regDraggedPatient={regDraggedPatient}
          dragOverCounter={dragOverCounter}
          onRegDragStart={handleRegDragStart}
        />
      );
    }

    if (isOPScreening) {
      return (
        <OPScreeningFlow
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
          registrationPatients={registrationPatients}
          regDraggedPatient={regDraggedPatient}
          dragOverCounter={dragOverCounter}
          onRegDragStart={handleRegDragStart}
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
      />
    );
  };

  return (
    <div className="flex min-h-screen bg-linear-to-br from-white via-red-50 to-red-100 font-sans">
      <Sidebar
        sidebarOpen={sidebarOpen}
        selectedCategory={selectedCategory}
        queueCounts={queueCounts}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSelectedSubcategory(null);
          setSelectedRoom(null);
        }}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-sm border-b border-red-100 shadow-sm">
          <div className="flex items-center gap-2">
            <i className="bx bx-transfer text-gray-400 text-lg"></i>
            <span className="text-gray-500 text-sm">Patient Transfer</span>
          </div>
          <div className="flex items-center gap-2">

            {isSyncing && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-blue-600">Syncing...</span>
              </div>
            )}

            {pendingUpdates.length > 0 && (
              <button
                onClick={handleConfirm}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Save Changes ({pendingUpdates.length})
              </button>
            )}

            <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-50 transition">
              <i className="bx bxs-bell text-lg text-gray-500"></i>
            </button>

            </div>
        </div>

        <div className="px-8 py-6 h-[calc(100vh-73px)] overflow-y-auto">
          <BreadcrumbNav
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            selectedRoom={selectedRoom}
            isConsultation={isConsultation}
            onReset={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
              setSelectedRoom(null);
            }}
            onResetToCategory={() => {
              setSelectedSubcategory(null);
              setSelectedRoom(null);
            }}
            onResetToSubcategory={() => setSelectedRoom(null)}
          />

          {renderContent()}
        </div>
      </div>
    </div>
  );
}