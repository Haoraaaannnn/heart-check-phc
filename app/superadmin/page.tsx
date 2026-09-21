'use client'

import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"
import { SettingsPanel } from './components/SettingsPannel';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { useRequireAuth } from './hooks/useRequireAuth';

interface User {
  auth_id: string
  email: string
  username: string
  role: string
  created_at: string
}

interface Cubicle {
  id: number;
  cubicleNum: string;
  category: string;
  room: number;
  subcategory?: string | null;
}

export default function SuperAdminPage() {
  const checking = useRequireAuth();
  useIdleTimeout();
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<User | null>(null)
  
  

  const [currentPage, setCurrentPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const usersPerPage = 8
  

  const [formEmail, setFormEmail] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState('registration')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'settings' >('users')

  const CLINICAL_ROLES = ['nurse', 'staff', 'doctor'];
  const REGISTRATION_ROLES = ['registration'];

  const [cubicles, setCubicles] = useState<Cubicle[]>([]);
  const [selectedCubicleIds, setSelectedCubicleIds] = useState<number[]>([]);

  const [accessOptions, setAccessOptions] = useState<{
    services: string[];
    consultationSubcategories: string[];
    counters: number[];
    availableRooms: { service: string; subcategory: string | null; room: number }[];
  }>({ services: [], consultationSubcategories: [], counters: [], availableRooms: [] });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<{ service: string; subcategory: string | null; room: number }[]>([]);
  const [selectedCounters, setSelectedCounters] = useState<number[]>([]);

  const loadAccess = async (authId?: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const query = authId ? `?authId=${encodeURIComponent(authId)}` : '';
  const response = await fetch(`/api/superadmin/access${query}`, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to load access options');

  setAccessOptions({
    services: data.services,
    consultationSubcategories: data.consultationSubcategories,
    counters: data.counters,
    availableRooms: data.availableRooms,
  });
  setSelectedServices(data.assignedServices ?? []);
  setSelectedRooms(data.assignedRooms ?? []);
  setSelectedCounters(data.assignedCounters ?? []);
};

  const toggleService = (service: string) => {
    setSelectedServices(prev => {
      const isSelected = prev.includes(service);

      if (isSelected) {
        setSelectedRooms(rooms =>
          rooms.filter(r => r.service !== service)
        );

        return prev.filter(s => s !== service);
      }

      return [...prev, service];
    });
  };

  const roomKey = (r: { service: string; subcategory: string | null; room: number }) =>
    `${r.service}::${r.subcategory ?? ''}::${r.room}`;

  const toggleRoom = (room: { service: string; subcategory: string | null; room: number }) => {
    setSelectedRooms(prev =>
      prev.some(r => roomKey(r) === roomKey(room))
        ? prev.filter(r => roomKey(r) !== roomKey(room))
        : [...prev, room]
    );
  };

  const toggleCounter = (counter: number) => {
    setSelectedCounters(prev =>
      prev.includes(counter) ? prev.filter(c => c !== counter) : [...prev, counter]
    );
  };

  const fetchUsers = async (page: number) => {
    setLoading(true)
    const start = (page - 1) * usersPerPage
    const end = start + usersPerPage - 1

    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    setTotalUsers(count || 0)

    const { data, error } = await supabase
      .from('users')
      .select('auth_id, email, username, role, created_at')
      .order('created_at', { ascending: false })
      .range(start, end)

    if (error) {
      console.error('Error fetching users:', error)
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers(currentPage)
  }, [currentPage])

  const totalPages = Math.ceil(totalUsers / usersPerPage)

    const loadCubicles = async (authId?: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const query = authId
      ? `?authId=${encodeURIComponent(authId)}`
      : '';

    const response = await fetch(`/api/superadmin/cubicles${query}`, {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to load cubicles');
    }

    setCubicles(data.cubicles ?? []);
    setSelectedCubicleIds(data.assignedCubicleIds ?? []);
  };

  const toggleCubicle = (cubicleId: number) => {
    setSelectedCubicleIds((previous) =>
      previous.includes(cubicleId)
        ? previous.filter((id) => id !== cubicleId)
        : [...previous, cubicleId]
    );
  };


  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setFormLoading(true)
      setFormError('')
      setFormSuccess('')

      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (editingUser) {
          const response = await fetch('/api/superadmin/update-role', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              authId: editingUser.auth_id,
              email: formEmail,
              username: formUsername,
              role: formRole,
              cubicleIds: CLINICAL_ROLES.includes(formRole)
                ? selectedCubicleIds
                : [],
              serviceAssignments: REGISTRATION_ROLES.includes(formRole)
                ? selectedServices
                : [],
              roomAssignments: REGISTRATION_ROLES.includes(formRole)
                ? selectedRooms
                : [],
              counterAssignments: REGISTRATION_ROLES.includes(formRole)
                ? selectedCounters
                : [],
            }),
          })
          const data = await response.json()
          if (!response.ok) throw new Error(data.error)
          setFormSuccess(`User ${formEmail} updated successfully!`)

          setTimeout(() => {
            setShowAddModal(false)
            setEditingUser(null)
            setFormSuccess('')
            fetchUsers(currentPage)
          }, 1500)
        } else {
          const response = await fetch('/api/superadmin/create-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              email: formEmail,
              password: formPassword,
              username: formUsername,
              role: formRole,
              cubicleIds: CLINICAL_ROLES.includes(formRole)
                ? selectedCubicleIds
                : [],
              serviceAssignments: REGISTRATION_ROLES.includes(formRole)
                ? selectedServices
                : [],
              roomAssignments: REGISTRATION_ROLES.includes(formRole)
                ? selectedRooms
                : [],
              counterAssignments: REGISTRATION_ROLES.includes(formRole)
                ? selectedCounters
                : [],
            }),
          })
          const data = await response.json()
          if (!response.ok) throw new Error(data.error)
          setFormSuccess(`User ${formEmail} created!`)

          setTimeout(() => {
            setShowAddModal(false)
            setFormSuccess('')
            setFormEmail('')
            setFormUsername('')
            setFormPassword('')
            fetchUsers(currentPage)
          }, 1500)
        }
      } catch (err: any) {
        setFormError(err.message)
      } finally {
        setFormLoading(false)
      }
    }

    const handleDelete = async (user: User) => {
      setFormLoading(true)
      setFormError('')
      try {
        const { data: { session } } = await supabase.auth.getSession()

        const response = await fetch('/api/superadmin/delete-user', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ authId: user.auth_id }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)

      setFormSuccess(`User ${user.email} deleted!`)
      setTimeout(() => {
        setShowDeleteConfirm(null)
        setFormSuccess('')
        if (users.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
        } else {
          fetchUsers(currentPage)
        }
      }, 1500)
    } catch (err: any) {
      setFormError(err.message)
      setTimeout(() => setFormError(''), 3000)
    } finally {
      setFormLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  const handleEdit = async (user: User) => {
    setEditingUser(user);
    setFormEmail(user.email);
    setFormUsername(user.username);
    setFormRole(user.role);
    setFormError('');
    setFormSuccess('');
    setShowAddModal(true);

    try {
      await Promise.all([
        loadCubicles(user.auth_id),
        loadAccess(user.auth_id),
      ]);
    } catch (error: any) {
      setFormError(error.message);
    }
  };

  const handleAddClick = async () => {
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
    setShowAddModal(true);

    try {
      await Promise.all([
        loadCubicles(),
        loadAccess(),
      ]);
    } catch (error: any) {
      setFormError(error.message);
    }
  };

return (
  <div className="p-8 bg-gray-50 min-h-screen">
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
        <p className="text-gray-600 mt-1">Manage users and system settings</p>
      </div>
      {activeTab === 'users' && (
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
        >
          + Add User
        </button>
      )}
    </div>

    <div className="flex gap-2 mb-6">
      <button
        onClick={() => setActiveTab('users')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
          activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
      >
        Users
      </button>
      <button
        onClick={() => setActiveTab('settings')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
          activeTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
      >
        Settings
      </button>

    </div>

    {activeTab === 'settings' && <SettingsPanel />}

    {activeTab === 'users' && (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.auth_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'nurse' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button 
                        onClick={() => handleEdit(user)} 
                        className="text-blue-600 hover:text-blue-800 mr-3 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(user)} 
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p-1))} 
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
</>
        )}
      </div>
    )}

    {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingUser ? 'Edit User' : 'Add User'}
            </h2>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}
            
            {formSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 rounded-lg text-sm">
                {formSuccess}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <input 
                type="email" 
                placeholder="Email" 
                value={formEmail} 
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg mb-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required 
              />
              
              <input 
                type="text" 
                placeholder="Username" 
                value={formUsername} 
                onChange={(e) => setFormUsername(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg mb-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required 
              />
              
              {!editingUser && (
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={formPassword} 
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg mb-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required 
                />
              )}
              
              <select 
                value={formRole} 
                onChange={(e) => setFormRole(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg mb-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="registration">Registration</option>
                <option value="nurse">Nurse</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>

              {CLINICAL_ROLES.includes(formRole) && (
                <div className="mt-5 border-t border-slate-200 pt-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800">
                        Assigned cubicles
                      </label>
                      <p className="mt-1 text-xs text-slate-500">
                        Choose the cubicles this user can manage.
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      {selectedCubicleIds.length} selected
                    </span>
                  </div>

                  <div className="max-h-72 space-y-4 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3">
                    {Object.entries(
                      cubicles.reduce<Record<string, Cubicle[]>>((groups, cubicle) => {
                        const groupName = cubicle.category || "Other";
                        groups[groupName] ??= [];
                        groups[groupName].push(cubicle);
                        return groups;
                      }, {})
                    ).map(([category, categoryCubicles]) => (
                      <div key={category}>
                      <div className="mb-2 rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-900">
                        {category}
                      </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {categoryCubicles.map((cubicle) => {
                            const isSelected = selectedCubicleIds.includes(cubicle.id);

                            return (
                              <button
                                key={cubicle.id}
                                type="button"
                                onClick={() => toggleCubicle(cubicle.id)}
                                className={`rounded-lg border p-3 text-left transition ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-50 text-blue-900 shadow-sm"
                                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold">
                                      {cubicle.cubicleNum}
                                    </p>

                                    <p
                                      className={`mt-1 text-xs ${
                                        isSelected ? "text-blue-700" : "text-slate-500"
                                      }`}
                                    >
                                      Room {cubicle.room}
                                      {cubicle.subcategory ? ` · ${cubicle.subcategory}` : ""}
                                    </p>
                                  </div>

                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                                      isSelected
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : "border-slate-300 text-transparent"
                                    }`}
                                  >
                                    ✓
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {REGISTRATION_ROLES.includes(formRole) && (
                <div className="mt-5 border-t border-slate-200 pt-5 space-y-5">
                  {/* Services */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Assigned services</label>
                    <div className="grid grid-cols-2 gap-2">
                      {accessOptions.services.map(service => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => toggleService(service)}
                          className={`rounded-lg border p-2 text-left text-sm transition ${
                            selectedServices.includes(service)
                              ? 'border-blue-500 bg-blue-50 text-blue-900'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                          }`}
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rooms — only for the services already selected */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Assigned rooms</label>
                    <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
                      {selectedServices.length === 0 && (
                        <p className="text-xs text-slate-500">Select a service above first.</p>
                      )}
                      {selectedServices.map(service => {
                        const roomsForService = accessOptions.availableRooms.filter(r => r.service === service);
                        const subcats = [...new Set(roomsForService.map(r => r.subcategory ?? '__none__'))];
                        return (
                          <div key={service}>
                            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-900">{service}</div>
                            {subcats.map(subKey => {
                              const subcategory = subKey === '__none__' ? null : subKey;
                              const rooms = roomsForService.filter(r => (r.subcategory ?? null) === subcategory);
                              return (
                                <div key={subKey} className="mb-2">
                                  {subcategory && <div className="text-[11px] text-slate-500 mb-1">{subcategory}</div>}
                                  <div className="flex flex-wrap gap-2">
                                    {rooms.map(r => {
                                      const isSelected = selectedRooms.some(sel => roomKey(sel) === roomKey(r));
                                      return (
                                        <button
                                          key={roomKey(r)}
                                          type="button"
                                          onClick={() => toggleRoom(r)}
                                          className={`px-3 py-1 rounded-full text-xs border ${
                                            isSelected
                                              ? 'border-blue-600 bg-blue-600 text-white'
                                              : 'border-gray-300 bg-white text-gray-700'
                                          }`}
                                        >
                                          Room {r.room}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Counters — global, 1-5 */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Assigned counters</label>
                    <div className="flex gap-2">
                      {accessOptions.counters.map(counter => (
                        <button
                          key={counter}
                          type="button"
                          onClick={() => toggleCounter(counter)}
                          className={`w-10 h-10 rounded-lg border text-sm font-semibold ${
                            selectedCounters.includes(counter)
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-gray-300 bg-white text-gray-700'
                          }`}
                        >
                          {counter}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingUser(null)
                    setFormError('')
                    setFormSuccess('')
                  }} 
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={formLoading} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">Confirm Delete</h2>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}
            
            <p className="text-gray-700">
              Are you sure you want to delete <span className="font-semibold">{showDeleteConfirm.email}</span>?
              <br />
              <span className="text-sm text-red-500">This action cannot be undone.</span>
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => {
                  setShowDeleteConfirm(null)
                  setFormError('')
                }} 
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(showDeleteConfirm)} 
                disabled={formLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
              >
                {formLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}