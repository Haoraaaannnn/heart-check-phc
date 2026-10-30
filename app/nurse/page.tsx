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
import { withRequestDeadline } from '@/lib/requestFetch';
import { WorkstationLoading } from '@/components/auth/WorkstationLoading';
import { Patient } from '@/types/Types';
import { NurseSidebar } from '@/app/nurse/components/NurseSidebar';
import { NurseHeader } from '@/app/nurse/components/NurseHeader';
import { NurseBreakControls } from '@/app/nurse/components/NurseBreakControls';
import { StationScopeBar } from '@/app/nurse/components/StationScopeBar';
import { filterNurseStationPatients, nurseStationContexts, isOpdScreeningService } from '@/app/nurse/lib/stationView';
import { NurseBoard } from '@/app/nurse/components/NurseBoard';
import { NurseQuickActionDropdown } from '@/app/nurse/components/NurseQuickActionDropdown';
import { NurseDragGhost } from '@/app/nurse/components/NurseDragGhost';
import { FinishedDrawer } from '@/app/nurse/components/FinishedDrawer';
import { DoctorsModal } from '@/app/transfer/components/DoctorsModal';

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
import { StationSetupModal } from '@/components/reusables/StationSetupModal';
import { useStationClaim } from '@/hooks/useStationClaim';


/**
 * Nurse Station point-of-care page component.
 *
 * @returns The rendered non-scrollable Nurse Dashboard.
 */
export default function NursePage() {
  const checking = useRequireAuth();
  useIdleTimeout();

  // Navigation & Filtering State
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCubicleNum, setSelectedCubicleNum] = useState<string | null>(null);
  const [showAllScreening, setShowAllScreening] = useState(false);

  // Modal / Drawer State
  const [finishedDrawerOpen, setFinishedDrawerOpen] = useState(false);
  const [showDoctorsModal, setShowDoctorsModal] = useState(false);

  // Audio Announcement State
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [callError, setCallError] = useState('');

  // Station Configuration State
  const {
    assignment: stationAssignment,
    counters: availableCounters,
    cubicles: availableCubicles,
    services: availableStationServices,
    claimStation,
    removeStationClaim,
    refresh: refreshStationClaim,
  } = useStationClaim();
  const [showStationModal, setShowStationModal] = useState<boolean>(false);

  // Loading & Sync States
  const [isLoading, setIsLoading] = useState(true);
  const [startupError, setStartupError] = useState('');
  const startupRequestId = useRef(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Core Data Hook
  const {
    assignedPatients,
    withDoctorPatients,
    carryoutPatients,
    finishedPatients,
    assignmentStatus,
    assignedCubicles,
    stationDirectory,
    setAssignedPatients,
    setWithDoctorPatients,
    setCarryoutPatients,
    fetchData,
    fetchFinished,
    refreshCubicles,
    pinInFlightMutation,
    unpinMutation,
    applyRealtimeUpdate,
  } = useNurseData({ showAllScreening });

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
  const previousScopeRef = useRef(showAllScreening);
  useEffect(() => {
    if (previousScopeRef.current === showAllScreening) return;
    previousScopeRef.current = showAllScreening;
    void handleRealtimeUpdate().catch(() => setCallError('Unable to change the queue view. Please retry.'));
  }, [showAllScreening, handleRealtimeUpdate]);

  // Connection status tracking for weak-signal / offline resilience.
  const { isOnline, channelStatus, isFullyConnected, setChannelStatus } = useConnectionStatus();

  // Persistent offline mutation queue (handles sudden power loss & network drops)
  const { pendingCount, isSyncing: isSyncingQueue } = useOfflineQueue(handleRealtimeUpdate);

  useRealtimeSubscription(handleRealtimeUpdate, 150, setChannelStatus, applyRealtimeUpdate);

  /** Bounds initial data loading after the shared role guard has verified this session. */
  const initializeDashboard = useCallback(async () => {
      const requestId = ++startupRequestId.current;
      setIsLoading(true);
      setStartupError('');
      try {
        await withRequestDeadline((async () => {
          await refreshCubicles();
          await Promise.all([fetchData(), fetchFinished()]);
        })());
      } catch {
        if (requestId === startupRequestId.current) setStartupError('Unable to finish loading the Doctors Station. Please retry.');
      } finally {
        if (requestId === startupRequestId.current) setIsLoading(false);
      }
  }, [refreshCubicles, fetchData, fetchFinished]);

  useEffect(() => {
    if (!checking) void initializeDashboard();
    return () => { ++startupRequestId.current; };
  }, [checking, initializeDashboard]);

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
      return filterNurseStationPatients({ patients: list, ownedStations: assignedCubicles, showAllScreening, selectedCategory, selectedCubicleNum });
    },
    [assignedCubicles, showAllScreening, selectedCategory, selectedCubicleNum]
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
  const ownedServices = useMemo(() => [...new Set(assignedCubicles.map(station => station.category))], [assignedCubicles]);
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const categories = [
      ...new Set([
        ...assignedCubicles.map((cubicle) => cubicle.category),
      ].filter(Boolean)),
    ];

    categories.forEach((category) => {
      const catNorm = category.trim().toLowerCase();
      counts[category] = filterNurseStationPatients({ patients: [...assignedPatients, ...withDoctorPatients, ...carryoutPatients],
        ownedStations: assignedCubicles, showAllScreening: false, selectedCategory: catNorm, selectedCubicleNum: null }).length;
    });

    return counts;
  }, [assignedCubicles, assignedPatients, withDoctorPatients, carryoutPatients]);

  // Clear category and cubicle filters
  const handleClearFilter = useCallback(() => {
    setSelectedCategory(null);
    setSelectedCubicleNum(null);
  }, []);
  const screeningService = ownedServices.find(service => isOpdScreeningService(service));
  const canViewAllScreening = Boolean(screeningService) && (!selectedCategory || isOpdScreeningService(selectedCategory));
  const viewStations = showAllScreening ? stationDirectory.filter(station => isOpdScreeningService(station.category)) : assignedCubicles;
  const stationContext = useMemo(() => nurseStationContexts({ stations: [...stationDirectory, ...assignedCubicles], ownedStations: assignedCubicles }), [assignedCubicles, stationDirectory]);
  const displayedStations = viewStations.filter(station => (!selectedCategory || station.category === selectedCategory) &&
    (!selectedCubicleNum || station.cubicleNum === selectedCubicleNum));

  // Loading State Render
  if (checking || isLoading || startupError) {
    return <WorkstationLoading title={nurseTexts.loadingDashboard} error={checking ? undefined : startupError}
      onRetry={checking ? undefined : () => void initializeDashboard()} />;
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
        assignedServices={ownedServices}
        onSelectCategory={(category) => {
          setShowAllScreening(false);
          setSelectedCategory(category);
          setSelectedCubicleNum(null);
        }}
        onSelectCubicle={(cubicleNum) => {
          setShowAllScreening(false);
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
          assignedCubicles={viewStations}
          showAllScreening={showAllScreening}
          assignedServices={[...new Set(viewStations.map(station => station.category))]}
          finishedCount={visibleFinished.length}
          onOpenFinishedLedger={() => setFinishedDrawerOpen(true)}
          onOpenDoctors={() => setShowDoctorsModal(true)}
          onClearFilter={() => { setShowAllScreening(false); handleClearFilter(); }}
          onSelectCategory={(category) => {
            setSelectedCategory(category);
            setSelectedCubicleNum(null);
          }}
          onSelectCubicle={(cubicleNum) => {
            const cubicle = viewStations.find((c) => c.cubicleNum === cubicleNum);
            setSelectedCategory(cubicle?.category ?? null);
            setSelectedCubicleNum(cubicleNum);
          }}
          showCubicleDropdown={viewStations.length > 0}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDismissNotification={dismissNotification}
          onClearAllNotifications={clearAll}
          claimedCubicleId={stationAssignment.cubicleId}
          onOpenStationModal={() => setShowStationModal(true)}
        />

        <NurseBreakControls selectedCubicleNum={selectedCubicleNum} />
        <StationScopeBar stations={displayedStations} showAllScreening={showAllScreening} canViewAllScreening={canViewAllScreening} onToggle={() => {
          if (!showAllScreening && !canViewAllScreening) return;
          setShowAllScreening(previous => !previous);
          setSelectedCategory(showAllScreening ? null : screeningService ?? null);
          setSelectedCubicleNum(null); clearSelection();
        }} />

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
        {assignmentStatus === 'unassigned' && !showAllScreening ? (
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
            stationContext={stationContext}
            finishedCount={visibleFinished.length}
            scopeLabel={selectedCubicleNum ?? selectedCategory ?? (showAllScreening ? nurseTexts.showAllScreening : nurseTexts.allMyCubicles)}
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
      {showDoctorsModal && <DoctorsModal onClose={() => {
        setShowDoctorsModal(false);
        void handleRealtimeUpdate().catch(() => setCallError('Doctor details were saved, but the station could not refresh. Please retry.'));
      }} />}
      <FinishedDrawer
        isOpen={finishedDrawerOpen}
        onClose={() => setFinishedDrawerOpen(false)}
        patients={visibleFinished}
      />

      {/* Station Configuration Modal */}
      {showStationModal && (
        <StationSetupModal
          isOpen={showStationModal}
          onClose={() => setShowStationModal(false)}
          workstation="nurse"
          currentAssignment={stationAssignment}
          counters={availableCounters}
          cubicles={availableCubicles}
          services={availableStationServices}
          onSave={claimStation}
          onRemove={() => removeStationClaim('nurse')}
          onSuccess={() => {
            void refreshStationClaim();
            void refreshCubicles();
            void fetchData();
          }}
        />
      )}
    </div>
  );
}
