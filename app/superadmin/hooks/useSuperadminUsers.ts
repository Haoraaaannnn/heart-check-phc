/**
 * @fileoverview Custom React hook managing SuperAdmin users data fetching and operations.
 *
 * Handles paginated user retrieval from Supabase, role-based filtering, client-side
 * and server-side text searching, summary metrics computation, and account deletion.
 *
 * @module app/superadmin/hooks/useSuperadminUsers
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { SuperadminUser, UserStats } from '../types/superadmin';

export interface UseSuperadminUsersReturn {
  /** Array of users currently displayed. */
  users: SuperadminUser[];
  /** Loading state indicator for user queries. */
  loading: boolean;
  /** Error message if query fails. */
  error: string;
  /** Current active page index (1-based). */
  currentPage: number;
  /** Total number of pages based on total matching users. */
  totalPages: number;
  /** Total count of all users in the system. */
  totalUsers: number;
  /** Active search query string. */
  searchQuery: string;
  /** Currently active role filter ('all' or specific role). */
  roleFilter: string;
  /** Aggregate user statistics. */
  stats: UserStats;
  /** Sets the current page. */
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  /** Updates the active search query. */
  setSearchQuery: (query: string) => void;
  /** Updates the active role filter. */
  setRoleFilter: (role: string) => void;
  /** Refetches the user list. */
  refetch: () => Promise<void>;
  /** Executes user deletion via the backend API. */
  deleteUser: (authId: string) => Promise<void>;
}

const USERS_PER_PAGE = 8;

/**
 * Hook to manage superadmin user accounts list, statistics, and mutations.
 *
 * @returns State and controller functions for the user accounts view.
 */
export function useSuperadminUsers(): UseSuperadminUsersReturn {
  const [allUsers, setAllUsers] = useState<SuperadminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  /**
   * Fetches all registered users from the database to enable responsive
   * multi-parameter search and accurate role-based metric calculation.
   */
  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchErr } = await supabase
        .from('users')
        .select('auth_id, email, username, role, created_at')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setAllUsers((data as SuperadminUser[]) || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Unable to retrieve user list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  /**
   * Computes top-level user account metrics across the entire user base.
   */
  const stats = useMemo<UserStats>(() => {
    const total = allUsers.length;
    let clinical = 0;
    let registration = 0;
    let admin = 0;

    for (const u of allUsers) {
      const role = u.role.toLowerCase();
      if (role === 'nurse' || role === 'doctor' || role === 'staff') {
        clinical += 1;
      } else if (role === 'registration') {
        registration += 1;
      } else if (role === 'admin' || role === 'superadmin') {
        admin += 1;
      }
    }

    return {
      totalUsers: total,
      clinicalStaff: clinical,
      registrationStaff: registration,
      adminUsers: admin,
    };
  }, [allUsers]);

  /**
   * Filters the user dataset based on the active search string and role selector.
   */
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const matchesRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter.toLowerCase();
      if (!matchesRole) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [allUsers, searchQuery, roleFilter]);

  // Adjust current page if out of bounds after filtering
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  /**
   * Slices the filtered users to the current page.
   */
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  /**
   * Deletes a user by calling the superadmin backend endpoint.
   *
   * @param authId - Supabase Auth ID of the user to remove.
   */
  const deleteUser = async (authId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/superadmin/delete-user', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ authId }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete user account.');
    }

    await fetchAllUsers();
  };

  return {
    users: paginatedUsers,
    loading,
    error,
    currentPage,
    totalPages,
    totalUsers: filteredUsers.length,
    searchQuery,
    roleFilter,
    stats,
    setCurrentPage,
    setSearchQuery,
    setRoleFilter,
    refetch: fetchAllUsers,
    deleteUser,
  };
}
