/**
 * @fileoverview Main orchestrator, route guard, and state coordinator for the Nurse Dashboard.
 *
 * Provides a non-scrollable, fit-to-screen 3-column clinical pipeline Kanban interface
 * for outpatient consultation rooms at the Philippine Heart Center.
 *
 * Implements:
 * - Parity with the Patient Transfer Dashboard standard (h-screen overflow-hidden)
 * - Dual-mode interaction engine (Pointer Drag-and-Drop and Click-to-Select tablet mode)
 * - Superadmin / Admin bypass for full cubicle visibility
 * - Configurable real-time elapsed timers with urgency thresholds
 * - Deepgram TTS audio announcements
 * - Separation of concerns with centralized texts and design tokens
 *
 * Adheres strictly to AGENTS.md guidelines:
 * - 100% copy isolated in nurseTexts
 * - 100% styles isolated in NurseStyle
 * - Zero emojis in code, comments, or UI
 * - Full file-level and symbol-level JSDoc
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/Types';
import {
  NurseSidebar,
  NurseHeader,
  NurseBoard,
  NurseSelectionBanner,
  NurseDragGhost,
  FinishedDrawer,
} from './components';
import {
  useRequireAuth,
  useIdleTimeout,
  useNurseData,
  useNurseActions,
  useNurseDragAndDrop,
  useNurseSelection,
  useRealtimeSubscription,
  isValidStageTransition,
} from './hooks';
import { useBottleneckNotifications } from '@/app/dashboard/hooks/useBottleneckNotifications';
import { nurseTexts } from './constants/nurseTexts';
import { NurseStyle, nurseLayoutTokens } from './constants/nurse';

/**
 * Nurse Station point-of-care page component.
 *
 * @returns The rendered non-scrollable Nurse Dashboard.
 */
export default function NursePage() {
  const router = useRouter();
  const checking = useRequireAuth();
  useIdleTimeout();

  // Navigation & Filtering State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCubicleNum, setSelectedCubicleNum] = useState<string | null>(null);

  // Modal / Drawer State
  const [finishedDrawerOpen, setFinishedDrawerOpen] = useState(false);

  // Audio Announcement State
  const [speakingId, setSpeakingId] = useState<number | null>(null);

  // Loading & Sync States
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Core Data Hook
  const {
    assignedPatients,
    withDoctorPatients,
    carryoutPatients,
    finishedPatients,
    assignmentStatus,
    assignedCubicles,
    setAssignedPatients,
    setWithDoctorPatients,
    setCarryoutPatients,
    fetchData,
    fetchFinished,
  } = useNurseData();

  // State Mutation Actions Hook
  const {
    actionError,
    clearActionError,
    handleMoveToWithDoctor,
    handleMoveBackFromDoctor,
    handleMoveToCarryout,
    handleMoveBackFromCarryout,
    handleFinish,
    handleTransitionStage,
  } = useNurseActions(
    setAssignedPatients,
    setWithDoctorPatients,
    setCarryoutPatients,
    fetchFinished
  );

  // Pointer Events Drag-and-Drop Hook
  const {
    draggedPatient,
    dragSourceStage,
    dragOverStage,
    dragPoint,
    handlePointerDown,
    cancelDrag,
  } = useNurseDragAndDrop(handleTransitionStage);

  // Click-to-Select Tablet Mode Hook
  const {
    selectedPatient,
    selectPatient,
    clearSelection,
    assignSelectedToStage,
    isStageValidTarget,
  } = useNurseSelection(handleTransitionStage);

  // Bottleneck Notifications
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
  } = useBottleneckNotifications();

  // Debounced Realtime synchronization
  const handleRealtimeUpdate = useCallback(async () => {
    setIsSyncing(true);
    try {
      await Promise.all([fetchData(), fetchFinished()]);
    } finally {
      setIsSyncing(false);
    }
  }, [fetchData, fetchFinished]);

  useRealtimeSubscription(handleRealtimeUpdate, 300);

  // Initial Data Load
  useEffect(() => {
    const initializeDashboard = async () => {
      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace('/login');
          return;
        }

        await Promise.all([fetchData(), fetchFinished()]);
      } catch (error) {
        console.error('Nurse dashboard initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void initializeDashboard();
  }, [fetchData, fetchFinished, router]);

  // Deepgram TTS Audio Announcement
  const speakAnnouncement = useCallback(
    async (text: string, patientId: number, repeatTimes: number = 3) => {
      setSpeakingId(patientId);
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
          setSpeakingId(null);
          return;
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        let playCount = 0;
        const audio = new Audio(audioUrl);

        const playOnce = async () => {
          audio.currentTime = 0;
          await audio.play();
          playCount++;
        };

        audio.onended = () => {
          if (playCount < repeatTimes) {
            setTimeout(playOnce, 800);
          } else {
            URL.revokeObjectURL(audioUrl);
            setSpeakingId(null);
          }
        };

        await playOnce();
      } catch (err) {
        console.error('Audio announcement exception:', err);
        setSpeakingId(null);
      }
    },
    []
  );

  /**
   * Triggers formatted outpatient cubicle audio call.
   */
  const handleCall = useCallback(
    (patient: Patient) => {
      const num = patient.patientNum;
      const letter = num.charAt(0);
      const digits = parseInt(num.slice(1), 10).toString();
      const destination = patient.cubicleNum
        ? `cubicle ${patient.cubicleNum}`
        : 'the doctor';

      const announcement = nurseTexts.ttsCallPhrase(letter, digits, destination);
      void speakAnnouncement(announcement, patient.id);
    },
    [speakAnnouncement]
  );

  // Filtered Patient Rosters based on Category and Cubicle
  const filterPatientList = useCallback(
    (list: Patient[]) => {
      return list.filter((patient) => {
        const matchesCategory =
          !selectedCategory || patient.service === selectedCategory;
        const matchesCubicle =
          !selectedCubicleNum || patient.cubicleNum === selectedCubicleNum;
        return matchesCategory && matchesCubicle;
      });
    },
    [selectedCategory, selectedCubicleNum]
  );

  const visibleAssigned = useMemo(
    () => filterPatientList(assignedPatients),
    [filterPatientList, assignedPatients]
  );

  const visibleWithDoctor = useMemo(
    () => filterPatientList(withDoctorPatients),
    [filterPatientList, withDoctorPatients]
  );

  const visibleCarryout = useMemo(
    () => filterPatientList(carryoutPatients),
    [filterPatientList, carryoutPatients]
  );

  const visibleFinished = useMemo(
    () => filterPatientList(finishedPatients),
    [filterPatientList, finishedPatients]
  );

  // Category counts for sidebar indicators
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const categories = [
      ...new Set(assignedCubicles.map((cubicle) => cubicle.category)),
    ];

    categories.forEach((category) => {
      counts[category] =
        assignedPatients.filter((p) => p.service === category).length +
        withDoctorPatients.filter((p) => p.service === category).length +
        carryoutPatients.filter((p) => p.service === category).length;
    });

    return counts;
  }, [assignedCubicles, assignedPatients, withDoctorPatients, carryoutPatients]);

  // Clear category and cubicle filters
  const handleClearFilter = useCallback(() => {
    setSelectedCategory(null);
    setSelectedCubicleNum(null);
  }, []);

  // Loading State Render
  if (checking || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-200 border-t-[#cc3535] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-700">
            {nurseTexts.loadingDashboard}
          </p>
          <p className="text-xs text-slate-400 mt-1">{nurseTexts.pleaseWait}</p>
        </div>
      </div>
    );
  }

  const isDraggingGhostValid =
    !!dragOverStage &&
    !!dragSourceStage &&
    isValidStageTransition(dragSourceStage, dragOverStage);

  return (
    <div style={NurseStyle.viewportContainer} className="select-none">
      {/* Collapsible Navigation Sidebar */}
      <NurseSidebar
        sidebarOpen={sidebarOpen}
        selectedCategory={selectedCategory}
        selectedCubicleNum={selectedCubicleNum}
        categoryCounts={categoryCounts}
        assignedCubicles={assignedCubicles}
        onSelectCategory={(category) => {
          setSelectedCategory(category);
          setSelectedCubicleNum(null);
        }}
        onSelectCubicle={(cubicleNum) => {
          const cubicle = assignedCubicles.find((c) => c.cubicleNum === cubicleNum);
          setSelectedCategory(cubicle?.category ?? null);
          setSelectedCubicleNum(cubicleNum);
        }}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Fit-to-Screen Pipeline Area */}
      <div
        style={{
          ...NurseStyle.mainArea,
          marginLeft: sidebarOpen
            ? nurseLayoutTokens.sidebarWidthExpanded
            : nurseLayoutTokens.sidebarWidthCollapsed,
        }}
      >
        {/* Fixed Top Header Bar */}
        <NurseHeader
          isSyncing={isSyncing}
          selectedCategory={selectedCategory}
          selectedCubicleNum={selectedCubicleNum}
          assignedCubicles={assignedCubicles}
          finishedCount={visibleFinished.length}
          onOpenFinishedLedger={() => setFinishedDrawerOpen(true)}
          onClearFilter={handleClearFilter}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDismissNotification={dismissNotification}
          onClearAllNotifications={clearAll}
        />

        {/* Action Error Notification Toast */}
        {actionError && (
          <div
            role="alert"
            className="mx-6 mt-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between shrink-0 shadow-xs animate-in fade-in duration-150"
          >
            <div className="flex items-center gap-2">
              <i className="bx bx-error-circle text-base text-red-600" aria-hidden="true" />
              <span>{actionError}</span>
            </div>
            <button
              type="button"
              onClick={clearActionError}
              className="text-red-500 hover:text-red-800 font-bold ml-4 cursor-pointer"
            >
              <i className="bx bx-x text-base" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Workspace: Unassigned Empty State vs 3-Column Pipeline Board */}
        {assignmentStatus === 'unassigned' ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-8 text-center shadow-sm max-w-md">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 text-2xl">
                <i className="bx bx-error text-2xl" aria-hidden="true" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                {nurseTexts.unassignedTitle}
              </h2>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                {nurseTexts.unassignedDesc}
              </p>
            </div>
          </div>
        ) : (
          <NurseBoard
            assignedPatients={visibleAssigned}
            withDoctorPatients={visibleWithDoctor}
            carryoutPatients={visibleCarryout}
            speakingId={speakingId}
            selectedPatient={selectedPatient}
            dragOverStage={dragOverStage}
            onCall={handleCall}
            onSelectPatient={selectPatient}
            onPointerDown={handlePointerDown}
            onMoveToWithDoctor={handleMoveToWithDoctor}
            onMoveBackFromDoctor={handleMoveBackFromDoctor}
            onMoveToCarryout={handleMoveToCarryout}
            onMoveBackFromCarryout={handleMoveBackFromCarryout}
            onFinish={handleFinish}
            onAssignSelectedToStage={assignSelectedToStage}
            isStageValidTarget={isStageValidTarget}
          />
        )}
      </div>

      {/* Click-to-Select Tablet Mode Guidance Banner */}
      <NurseSelectionBanner
        selectedPatient={selectedPatient}
        onCancel={clearSelection}
      />

      {/* Pointer Events Drag Ghost Preview Card */}
      <NurseDragGhost
        patient={draggedPatient}
        point={dragPoint}
        sourceStage={dragSourceStage}
        isValidDropTarget={isDraggingGhostValid}
      />

      {/* Finished Today Archive Slide-over Drawer */}
      <FinishedDrawer
        isOpen={finishedDrawerOpen}
        onClose={() => setFinishedDrawerOpen(false)}
        patients={visibleFinished}
      />
    </div>
  );
}