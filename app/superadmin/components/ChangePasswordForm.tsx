'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (newPassword.length < 8) return setError('New password must be at least 8 characters.');
    if (newPassword !== confirmPassword) return setError('New passwords do not match.');

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Unable to change password.'); return; }
      setMessage('Password updated successfully.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Change Password</h2>
      <p className="text-gray-600 text-sm mb-4">You'll need your current password. Other devices will be signed out.</p>
      {error && <div className="mb-3 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {message && <div className="mb-3 p-3 bg-green-100 border border-green-200 text-green-700 rounded-lg text-sm">{message}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input type="password" placeholder="Current password" value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg text-gray-900" required />
        <input type="password" placeholder="New password" value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg text-gray-900" required />
        <input type="password" placeholder="Confirm new password" value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg text-gray-900" required />
        <button type="submit" disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
          {saving ? 'Saving…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}