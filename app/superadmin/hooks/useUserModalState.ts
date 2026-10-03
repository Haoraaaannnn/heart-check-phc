/**
 * @fileoverview Custom React hook managing SuperAdmin user modal state and desk assignments.
 *
 * Encapsulates form state, role-dependent access loading, cubicle toggles,
 * registration service/room/counter associations, and submission handling.
 *
 * @module app/superadmin/hooks/useUserModalState
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  SuperadminUser,
  SuperadminRole,
  CubicleOption,
  AccessOptions,
  AssignedRoom,
} from '../types/superadmin';

export const CLINICAL_ROLES: string[] = ['nurse', 'staff', 'doctor'];
export const REGISTRATION_ROLES: string[] = ['registration'];

export interface UseUserModalStateReturn {
  isOpen: boolean;
  isEditing: boolean;
  editingUser: SuperadminUser | null;
  formEmail: string;
  formUsername: string;
  formPassword: string;
  formRole: SuperadminRole;
  formLoading: boolean;
  formError: string;
  formSuccess: string;
  cubicles: CubicleOption[];
  selectedCubicleIds: number[];
  accessOptions: AccessOptions;
  selectedServices: string[];
  selectedRooms: AssignedRoom[];
  selectedCounters: number[];
  setFormEmail: (email: string) => void;
  setFormUsername: (username: string) => void;
  setFormPassword: (password: string) => void;
  setFormRole: (role: SuperadminRole) => void;
  openCreateModal: () => Promise<void>;
  openEditModal: (user: SuperadminUser) => Promise<void>;
  closeModal: () => void;
  toggleCubicle: (cubicleId: number) => void;
  toggleService: (service: string) => void;
  toggleRoom: (room: AssignedRoom) => void;
  toggleCounter: (counter: number) => void;
  handleSubmit: (e: React.FormEvent, onSuccess: () => void) => Promise<void>;
}

/**
 * Creates unique string key for comparing assigned room objects.
 */
export const roomKey = (r: AssignedRoom): string =>
  `${r.service}::${r.subcategory ?? ''}::${r.room}`;

/**
 * Hook to manage user creation and edit modal state.
 *
 * @returns Form state variables and handler functions.
 */
export function useUserModalState(): UseUserModalStateReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SuperadminUser | null>(null);

  const [formEmail, setFormEmail] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<SuperadminRole>('registration');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [cubicles, setCubicles] = useState<CubicleOption[]>([]);
  const [selectedCubicleIds, setSelectedCubicleIds] = useState<number[]>([]);

  const [accessOptions, setAccessOptions] = useState<AccessOptions>({
    services: [],
    consultationSubcategories: [],
    counters: [],
    availableRooms: [],
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<AssignedRoom[]>([]);
  const [selectedCounters, setSelectedCounters] = useState<number[]>([]);

  /**
   * Loads cubicles list and assigned cubicles for a user from API.
   */
  const loadCubicles = useCallback(async (authId?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const query = authId ? `?authId=${encodeURIComponent(authId)}` : '';
    const response = await fetch(`/api/superadmin/cubicles${query}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load cubicles');
    setCubicles(data.cubicles ?? []);
    setSelectedCubicleIds(data.assignedCubicleIds ?? []);
  }, []);

  /**
   * Loads registration access options (services, rooms, counters) from API.
   */
  const loadAccess = useCallback(async (authId?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const query = authId ? `?authId=${encodeURIComponent(authId)}` : '';
    const response = await fetch(`/api/superadmin/access${query}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load access options');

    setAccessOptions({
      services: data.services ?? [],
      consultationSubcategories: data.consultationSubcategories ?? [],
      counters: data.counters ?? [],
      availableRooms: data.availableRooms ?? [],
    });
    setSelectedServices(data.assignedServices ?? []);
    setSelectedRooms(data.assignedRooms ?? []);
    setSelectedCounters(data.assignedCounters ?? []);
  }, []);

  /**
   * Opens the modal in creation mode.
   */
  const openCreateModal = async () => {
    setEditingUser(null);
    setFormEmail('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('registration');
    setSelectedCubicleIds([]);
    setSelectedServices([]);
    setSelectedRooms([]);
    setSelectedCounters([]);
    setFormError('');
    setFormSuccess('');
    setIsOpen(true);

    try {
      await Promise.all([loadCubicles(), loadAccess()]);
    } catch (err: any) {
      setFormError(err.message || 'Failed to load options.');
    }
  };

  /**
   * Opens the modal in edit mode for a given user.
   */
  const openEditModal = async (user: SuperadminUser) => {
    setEditingUser(user);
    setFormEmail(user.email);
    setFormUsername(user.username);
    setFormPassword('');
    setFormRole(user.role as SuperadminRole);
    setFormError('');
    setFormSuccess('');
    setIsOpen(true);

    try {
      await Promise.all([
        loadCubicles(user.auth_id),
        loadAccess(user.auth_id),
      ]);
    } catch (err: any) {
      setFormError(err.message || 'Failed to load user access assignments.');
    }
  };

  /**
   * Closes the modal and resets state.
   */
  const closeModal = () => {
    setIsOpen(false);
    setEditingUser(null);
    setFormError('');
    setFormSuccess('');
  };

  /**
   * Toggles selection state of a clinical cubicle.
   */
  const toggleCubicle = (cubicleId: number) => {
    setSelectedCubicleIds((prev) =>
      prev.includes(cubicleId) ? prev.filter((id) => id !== cubicleId) : [...prev, cubicleId]
    );
  };

  /**
   * Toggles selection of a registration service and purges any orphaned room assignments.
   */
  const toggleService = (service: string) => {
    setSelectedServices((prev) => {
      const isSelected = prev.includes(service);
      if (isSelected) {
        setSelectedRooms((rooms) => rooms.filter((r) => r.service !== service));
        return prev.filter((s) => s !== service);
      }
      return [...prev, service];
    });
  };

  /**
   * Toggles selection of a consultation room.
   */
  const toggleRoom = (room: AssignedRoom) => {
    setSelectedRooms((prev) =>
      prev.some((r) => roomKey(r) === roomKey(room))
        ? prev.filter((r) => roomKey(r) !== roomKey(room))
        : [...prev, room]
    );
  };

  /**
   * Toggles selection of a registration counter station number.
   */
  const toggleCounter = (counter: number) => {
    setSelectedCounters((prev) =>
      prev.includes(counter) ? prev.filter((c) => c !== counter) : [...prev, counter]
    );
  };

  /**
   * Handles form submission to the appropriate API route.
   */
  const handleSubmit = async (e: React.FormEvent, onSuccess: () => void) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isClinical = CLINICAL_ROLES.includes(formRole);
      const isRegistration = REGISTRATION_ROLES.includes(formRole);

      if (editingUser) {
        const response = await fetch('/api/superadmin/update-role', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            authId: editingUser.auth_id,
            email: formEmail,
            username: formUsername,
            role: formRole,
            cubicleIds: isClinical ? selectedCubicleIds : [],
            serviceAssignments: isRegistration ? selectedServices : [],
            roomAssignments: isRegistration ? selectedRooms : [],
            counterAssignments: isRegistration ? selectedCounters : [],
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update user.');
        setFormSuccess(`User ${formEmail} updated successfully.`);
      } else {
        if (!formPassword || formPassword.length < 8) {
          throw new Error('Password must be at least 8 characters long.');
        }

        const response = await fetch('/api/superadmin/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            email: formEmail,
            password: formPassword,
            username: formUsername,
            role: formRole,
            cubicleIds: isClinical ? selectedCubicleIds : [],
            serviceAssignments: isRegistration ? selectedServices : [],
            roomAssignments: isRegistration ? selectedRooms : [],
            counterAssignments: isRegistration ? selectedCounters : [],
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to create user.');
        setFormSuccess(`User ${formEmail} created successfully.`);
      }

      setTimeout(() => {
        closeModal();
        onSuccess();
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setFormLoading(false);
    }
  };

  return {
    isOpen,
    isEditing: !!editingUser,
    editingUser,
    formEmail,
    formUsername,
    formPassword,
    formRole,
    formLoading,
    formError,
    formSuccess,
    cubicles,
    selectedCubicleIds,
    accessOptions,
    selectedServices,
    selectedRooms,
    selectedCounters,
    setFormEmail,
    setFormUsername,
    setFormPassword,
    setFormRole,
    openCreateModal,
    openEditModal,
    closeModal,
    toggleCubicle,
    toggleService,
    toggleRoom,
    toggleCounter,
    handleSubmit,
  };
}
