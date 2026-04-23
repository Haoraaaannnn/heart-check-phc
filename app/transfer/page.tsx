'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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

export default function TransferPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { onProgressPatients, assignedPatients, setOnProgressPatients, setAssignedPatients, fetchData } = usePatientData();
  const { cubicles, fetchCubicles } = useCubicleData();
  const { draggedPatient, dragOverCubicle, handleDragStartFromQueue, handleDragStartFromCubicle, handleMoveBackToProgress, setupGlobalDragHandlers } = useDragAndDrop(
    assignedPatients, setOnProgressPatients, setAssignedPatients
  );

  useAutoAssign(selectedCategory, onProgressPatients, assignedPatients, cubicles, setOnProgressPatients, setAssignedPatients);
  useRealtimeSubscription('all', fetchData);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.replace('/login'); return; }
    };
    checkSession();
    fetchData();
    fetchCubicles();
  }, []);

  const isConsultation = selectedCategory === 'Consultation';
  const isOPScreening = selectedCategory === 'OPD Screening';
  const isDragEnabled = isConsultation || isOPScreening;

  // Set up drag handlers
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

  const getAvailableRooms = () => {
    if (!selectedCategory) return [];
    
    if (isConsultation && selectedSubcategory) {
      return [...new Set(cubicles.filter(c => 
        c.category === selectedCategory && c.subcategory === selectedSubcategory
      ).map(c => c.room))].sort();
    } else if (isOPScreening) {
      return [...new Set(cubicles.filter(c => c.category === selectedCategory).map(c => c.room))].sort();
    } else if (!isConsultation && !isOPScreening && selectedCategory) {
      return [...new Set(cubicles.filter(c => c.category === selectedCategory).map(c => c.room))].sort();
    }
    return [];
  };

  const getVisibleCubicles = () => {
    if (isConsultation && selectedSubcategory && selectedRoom) {
      return cubicles.filter(c => 
        c.category === selectedCategory && c.subcategory === selectedSubcategory && c.room === selectedRoom
      );
    } else if (isOPScreening && selectedRoom) {
      return cubicles.filter(c => c.category === selectedCategory && c.room === selectedRoom);
    } else if (!isConsultation && !isOPScreening && selectedCategory) {
      return cubicles.filter(c => c.category === selectedCategory);
    }
    return [];
  };

  const visibleCubicles = getVisibleCubicles();
  
  const visibleOnProgress = onProgressPatients.filter(p => {
    if (!selectedCategory) return true;
    if (isConsultation) return p.service === 'Consultation';
    if (isOPScreening) return p.service === 'OPD Screening';
    return p.service === selectedCategory;
  });

  const rooms = getAvailableRooms();
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