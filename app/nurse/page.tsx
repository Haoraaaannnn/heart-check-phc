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

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/Types';
import { NurseSidebar } from '@/app/nurse/components/NurseSidebar';
import { NurseHeader } from '@/app/nurse/components/NurseHeader';
import { NurseBreakControls } from '@/app/nurse/components/NurseBreakControls';
import { NurseBoard } from '@/app/nurse/components/NurseBoard';
import { NurseQuickActionDropdown } from '@/app/nurse/components/NurseQuickActionDropdown';
import { NurseDragGhost } from '@/app/nurse/components/NurseDragGhost';
import { FinishedDrawer } from '@/app/nurse/components/FinishedDrawer';

import { useRequireAuth } from '@/app/nurse/hooks/useRequireAuth';
import { useIdleTimeout } from '@/app/nurse/hooks/useIdleTimeout';
import { useNurseData } from '@/app/nurse/hooks/useNurseData';
import { useNurseActions } from '@/app/nurse/hooks/useNurseActions';
import {
  useNurseDragAndDrop,
  isValidStageTransition,
} from '@/app/nurse/hooks/useNurseDragAndDrop';
import { useNurseSelection } from '@/app/nurse/hooks/useNurseSelection';
import { useRealtimeSubscription } from '@/app/nurse/hooks/useRealtimeSubscription';
import { useBottleneckNotifications } from '@/app/dashboard/hooks/useBottleneckNotifications';
import { nurseTexts } from '@/app/nurse/constants/nurseTexts';
import { NurseStyle, nurseLayoutTokens } from '@/app/nurse/constants/nurse';
import { requestMonitorCall } from '@/lib/requestMonitorCall';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { ConnectionStatusBanner } from '@/components/reusables/ConnectionStatusBanner';


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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCubicleNum, setSelectedCubicleNum] = useState<string | null>(null);

  // Modal / Drawer State
  const [finishedDrawerOpen, setFinishedDrawerOpen] = useState(false);

  // Audio Announcement State
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [callError, setCallError] = useState('');

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
    assignedServices,
    setAssignedPatients,
    setWithDoctorPatients,
    setCarryoutPatients,
    fetchData,
    fetchFinished,
    refreshCubicles,
    pinInFlightMutation,
    unpinMutation,
    applyRealtimeUpdate,
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
    fetchFinished,
    pinInFlightMutation,
    unpinMutation
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
      await Promise.all([refreshCubicles(), fetchData(), fetchFinished()]);
    } finally {
      setIsSyncing(false);
    }
  }, [refreshCubicles, fetchData, fetchFinished]);

  // Connection status tracking for weak-signal / offline resilience.
  const { isOnline, channelStatus, isFullyConnected, setChannelStatus } = useConnectionStatus();

  // Persistent offline mutation queue (handles sudden power loss & network drops)
  const { pendingCount, isSyncing: isSyncingQueue } = useOfflineQueue(handleRealtimeUpdate);

  useRealtimeSubscription(handleRealtimeUpdate, 150, setChannelStatus, applyRealtimeUpdate);

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

        await refreshCubicles();
        await Promise.all([fetchData(), fetchFinished()]);
      } catch (error) {
        console.error('Nurse dashboard initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void initializeDashboard();
  }, [refreshCubicles, fetchData, fetchFinished, router]);

  // Auto-select initial category or cubicle when nurse assignments load
  const hasInitializedFilterRef = useRef(false);
  useEffect(() => {
    if (!hasInitializedFilterRef.current) {
      if (assignedCubicles.length > 0) {
        hasInitializedFilterRef.current = true;
        const first = assignedCubicles[0];
        if (first.cubicleNum) {
          setSelectedCubicleNum(first.cubicleNum);
          if (first.category) {
            setSelectedCategory(first.category);
          }
        }
      } else if (assignedServices.length > 0) {
        hasInitializedFilterRef.current = true;
        setSelectedCategory(assignedServices[0]);
      }
    }
  }, [assignedCubicles, assignedServices]);

  /**
   * Sends a patient call to the matching public monitor while keeping this workstation silent.
   * @param patient - The active patient selected by nursing staff.
   * @returns Nothing; reports delivery failures through the page alert.
   */
  const handleCall = useCallback((patient: Patient) => {
    setSpeakingId(patient.id);
    setCallError('');
    void requestMonitorCall(patient.id)
      .catch(error => setCallError(error instanceof Error ? error.message : 'Unable to send the call to the monitor.'))
      .finally(() => setSpeakingId(null));
  }, []);

  // Filtered Patient Rosters based on Category and Cubicle
  const filterPatientList = useCallback(
    (list: Patient[]) => {
      return list.filter((patient) => {
        // Patients must be assigned to an active cubicle to appear in clinical workstations
        if (!patient.cubicleNum) return false;

        const matchesCategory =
          !selectedCategory ||
          (patient.service &&
            patient.service.trim().toLowerCase() === selectedCategory.trim().toLowerCase());

        const matchesCubicle =
          !selectedCubicleNum ||
          (patient.cubicleNum &&
            patient.cubicleNum.trim().toLowerCase() === selectedCubicleNum.trim().toLowerCase());

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
      ...new Set([
        ...assignedServices,
        ...assignedCubicles.map((cubicle) => cubicle.category),
      ].filter(Boolean)),
    ];

    categories.forEach((category) => {
      const catNorm = category.trim().toLowerCase();
      counts[category] =
        assignedPatients.filter((p) => p.service && p.service.trim().toLowerCase() === catNorm).length +
        withDoctorPatients.filter((p) => p.service && p.service.trim().toLowerCase() === catNorm).length +
        carryoutPatients.filter((p) => p.service && p.service.trim().toLowerCase() === catNorm).length;
    });

    return counts;
  }, [assignedServices, assignedCubicles, assignedPatients, withDoctorPatients, carryoutPatients]);

  // Clear category and cubicle filters
  const handleClearFilter = useCallback(() => {
    setSelectedCategory(null);
    setSelectedCubicleNum(null);
  }, []);

  // Loading State Render
  if (checking || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0d0d0d]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-200 dark:border-red-950/60 border-t-[#cc3535] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-700 dark:text-[#f5f5f5]">
            {nurseTexts.loadingDashboard}
          </p>
          <p className="text-xs text-slate-400 dark:text-[#737373] mt-1">{nurseTexts.pleaseWait}</p>
        </div>
      </div>
    );
  }

  const isDraggingGhostValid =
    !!dragOverStage &&
    !!dragSourceStage &&
    isValidStageTransition(dragSourceStage, dragOverStage);

  return (
    <div style={NurseStyle.viewportContainer} className="select-none bg-slate-50 dark:bg-[#0d0d0d] text-slate-900 dark:text-[#f5f5f5]">
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
      <NurseSidebar
        isExpanded={isSidebarExpanded}
        selectedCategory={selectedCategory}
        selectedCubicleNum={selectedCubicleNum}
        categoryCounts={categoryCounts}
        assignedCubicles={assignedCubicles}
        assignedServices={assignedServices}
        onSelectCategory={(category) => {
          setSelectedCategory(category);
          setSelectedCubicleNum(null);
        }}
        onSelectCubicle={(cubicleNum) => {
          const cubicle = assignedCubicles.find((c) => c.cubicleNum === cubicleNum);
          setSelectedCategory(cubicle?.category ?? null);
          setSelectedCubicleNum(cubicleNum);
        }}
      />

      {/* Main Content Area: Offset for icon rail (ml-18) or expanded panel (ml-64) */}
      <div
        className={`flex-1 flex flex-col h-screen overflow-hidden min-w-0 transition-all duration-300 ${
          isSidebarExpanded ? 'ml-64' : 'ml-18'
        }`}
      >
        {/* Fixed Top Header Bar */}
        <NurseHeader
          isSidebarOpen={isSidebarExpanded}
          onToggleSidebar={() => setIsSidebarExpanded(prev => !prev)}
          isSyncing={isSyncing || isSyncingQueue}
          selectedCategory={selectedCategory}
          selectedCubicleNum={selectedCubicleNum}
          assignedCubicles={assignedCubicles}
          assignedServices={assignedServices}
          finishedCount={visibleFinished.length}
          onOpenFinishedLedger={() => setFinishedDrawerOpen(true)}
          onClearFilter={handleClearFilter}
          onSelectCategory={(category) => {
            setSelectedCategory(category);
            setSelectedCubicleNum(null);
          }}
          onSelectCubicle={(cubicleNum) => {
            const cubicle = assignedCubicles.find((c) => c.cubicleNum === cubicleNum);
            setSelectedCategory(cubicle?.category ?? null);
            setSelectedCubicleNum(cubicleNum);
          }}
          showCubicleDropdown={assignedCubicles.length > 0 || assignedServices.length > 0}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDismissNotification={dismissNotification}
          onClearAllNotifications={clearAll}
        />

        <NurseBreakControls selectedCubicleNum={selectedCubicleNum} />

        {/* Action Error Notification Toast */}
        {callError && <p role="alert" className="shrink-0 mx-4 mt-2 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{callError}</p>}
        {actionError && (
          <div
            role="alert"
            className="mx-6 mt-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-xs font-semibold flex items-center justify-between shrink-0 shadow-xs animate-in fade-in duration-150"
          >
            <div className="flex items-center gap-2">
              <span>{actionError}</span>
            </div>
            <button
              type="button"
              onClick={clearActionError}
              className="text-red-500 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 font-bold ml-4 cursor-pointer text-xs underline"
            >
              {nurseTexts.dismiss}
            </button>
          </div>
        )}

        {/* Workspace: Unassigned Empty State vs 3-Column Pipeline Board */}
        {assignmentStatus === 'unassigned' ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-8 text-center shadow-sm max-w-md">
              <h2 className="text-base font-bold text-slate-900 dark:text-[#f5f5f5]">
                {nurseTexts.unassignedTitle}
              </h2>
              <p className="mt-2 text-xs text-slate-600 dark:text-[#a3a3a3] leading-relaxed">
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

      {/* Tap-to-Act Quick Action Popover Dropdown */}
      <NurseQuickActionDropdown
        selectedPatient={selectedPatient}
        speakingId={speakingId}
        onMoveToWithDoctor={handleMoveToWithDoctor}
        onMoveBackFromDoctor={handleMoveBackFromDoctor}
        onMoveToCarryout={handleMoveToCarryout}
        onMoveBackFromCarryout={handleMoveBackFromCarryout}
        onFinish={handleFinish}
        onCall={handleCall}
        onClose={clearSelection}
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
