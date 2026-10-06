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

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useRequireAuth } from './hooks/useRequireAuth';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { useSuperadminUsers } from './hooks/useSuperadminUsers';
import { useUserModalState } from './hooks/useUserModalState';
import { SuperadminUser } from './types/superadmin';
import { UserStatsCards } from './components/UserStatsCards';
import { UserTable } from './components/UserTable';
import { UserModal } from './components/UserModal';
import { DeleteUserModal } from './components/DeleteUserModal';
import { SettingsPanel } from './components/SettingsPanel';
import { SUPERADMIN_TEXTS } from './constants/superadminTexts';
import { SUPERADMIN_STYLES } from './constants/superadminStyles';

/**
 * SuperAdmin dashboard orchestrator component.
 *
 * @returns JSX element containing the active view (Users or Settings).
 */
export default function SuperAdminPage() {
  const checking = useRequireAuth();
  useIdleTimeout();

  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');

  useEffect(() => {
    if (urlTab === 'settings' || urlTab === 'security') {
      setActiveTab('settings');
    } else {
      setActiveTab('users');
    }
  }, [urlTab]);

  const handleTabChange = (tab: 'users' | 'settings') => {
    setActiveTab(tab);
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
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete user.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const S = SUPERADMIN_STYLES;
  const T = SUPERADMIN_TEXTS;

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-sans">
        <div className="w-10 h-10 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
      </div>
    );
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
          <UserStatsCards stats={stats} />

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