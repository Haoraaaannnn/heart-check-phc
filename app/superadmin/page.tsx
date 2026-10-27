/**
 * @fileoverview Main orchestrator page for the SuperAdmin portal.
 *
 * Coordinates user management, desk access assignments, system automation parameters,
 * and security policies through modular subcomponents and dedicated hooks.
 *
 * @remarks
 * Conforms strictly to AGENTS.md enterprise navigation and solid surfaces standards:
 * matching 1680px container layout, header banner card, and separation of concerns.
 *
 * @module app/superadmin/page
 */

'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/app/superadmin/hooks/useRequireAuth';
import { useIdleTimeout } from '@/app/superadmin/hooks/useIdleTimeout';
import { useSuperadminUsers } from '@/app/superadmin/hooks/useSuperadminUsers';
import { useUserModalState } from '@/app/superadmin/hooks/useUserModalState';
import { SuperadminUser } from '@/app/superadmin/types/superadmin';
import { UserStatsCards } from '@/app/superadmin/components/UserStatsCards';
import { UserTable } from '@/app/superadmin/components/UserTable';
import { UserModal } from '@/app/superadmin/components/UserModal';
import { DeleteUserModal } from '@/app/superadmin/components/DeleteUserModal';
import { SettingsPanel } from '@/app/superadmin/components/SettingsPanel';
import { SuperAdminPageSkeleton } from '@/app/superadmin/components/SuperAdminPageSkeleton';
import { SUPERADMIN_TEXTS } from '@/app/superadmin/constants/superadminTexts';
import { SUPERADMIN_STYLES } from '@/app/superadmin/constants/superadminStyles';

/**
 * SuperAdmin inner content component reading URL search parameters.
 */
function SuperAdminContent() {
  const checking = useRequireAuth();
  useIdleTimeout();

  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const activeTab: 'users' | 'settings' =
    urlTab === 'settings' || urlTab === 'security' ? 'settings' : 'users';

  const handleTabChange = (tab: 'users' | 'settings') => {
    if (tab === 'settings') {
      router.push('/superadmin?tab=settings');
    } else {
      router.push('/superadmin');
    }
  };

  // User Accounts Data Hook
  const {
    users,
    loading: usersLoading,
    currentPage,
    totalPages,
    totalUsers,
    searchQuery,
    roleFilter,
    stats,
    setCurrentPage,
    setSearchQuery,
    setRoleFilter,
    refetch,
    deleteUser,
  } = useSuperadminUsers();

  // User Modal State Hook
  const modalState = useUserModalState();

  // Delete Confirmation State
  const [deletingUser, setDeletingUser] = useState<SuperadminUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const confirmDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    setDeleteError('');

    try {
      await deleteUser(deletingUser.auth_id);
      setDeletingUser(null);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete user.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const S = SUPERADMIN_STYLES;
  const T = SUPERADMIN_TEXTS;

  if (checking) {
    return <SuperAdminPageSkeleton activeTab={activeTab} />;
  }

  return (
    <div className={S.layout.page}>
      {/* Header Banner Card */}
      <div className={S.banner.root}>
        <div className={S.banner.titleSection}>
          <h1 className={S.banner.heading}>
            {activeTab === 'users' ? T.header.pageTitle : T.header.settingsTitle}
          </h1>
          <p className={S.banner.subheading}>
            {activeTab === 'users'
              ? T.header.pageDescription
              : T.header.settingsDescription}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'users' && (
            <button
              type="button"
              onClick={modalState.openCreateModal}
              className={S.buttons.primary}
            >
              <i className="bx bx-user-plus text-base" aria-hidden="true" />
              <span>{T.header.addUserButton}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Controls */}
      <div className={S.tabs.container} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'users'}
          onClick={() => handleTabChange('users')}
          className={`${S.tabs.tab} ${
            activeTab === 'users' ? S.tabs.tabActive : S.tabs.tabIdle
          }`}
        >
          <i className="bx bx-group text-base" aria-hidden="true" />
          <span>{T.navigation.usersTab}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'settings'}
          onClick={() => handleTabChange('settings')}
          className={`${S.tabs.tab} ${
            activeTab === 'settings' ? S.tabs.tabActive : S.tabs.tabIdle
          }`}
        >
          <i className="bx bx-cog text-base" aria-hidden="true" />
          <span>{T.navigation.settingsTab}</span>
        </button>
      </div>

      {/* Tab 1: User Accounts */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* KPI Stats Grid */}
          <UserStatsCards stats={stats} loading={usersLoading} />

          {/* Users Data Table */}
          <UserTable
            users={users}
            loading={usersLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            currentPage={currentPage}
            totalPages={totalPages}
            totalUsers={totalUsers}
            onPageChange={setCurrentPage}
            onEditUser={modalState.openEditModal}
            onDeleteUser={(u) => {
              setDeleteError('');
              setDeletingUser(u);
            }}
          />

          {/* Add / Edit User Modal */}
          <UserModal modalState={modalState} onSuccess={refetch} />

          {/* Delete Confirmation Modal */}
          <DeleteUserModal
            user={deletingUser}
            loading={deleteLoading}
            error={deleteError}
            onClose={() => setDeletingUser(null)}
            onConfirm={confirmDelete}
          />
        </div>
      )}

      {/* Tab 2: System Settings */}
      {activeTab === 'settings' && (
        <SettingsPanel focusSecurity={urlTab === 'security'} />
      )}
    </div>
  );
}

/**
 * SuperAdmin dashboard orchestrator component wrapped in Suspense.
 *
 * @returns JSX element containing the active view (Users or Settings).
 */
export default function SuperAdminPage() {
  return (
    <Suspense fallback={<SuperAdminPageSkeleton />}>
      <SuperAdminContent />
    </Suspense>
  );
}