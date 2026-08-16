'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function SettingsPanel() {
  const [minutes, setMinutes] = useState<string>('3');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchTimeout = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'rotate_timeout_seconds')
      .single();

    if (!error && data) {
      setMinutes((parseInt(data.value, 10) / 60).toString());
    }
    setLoading(false);
  };

  useEffect(() => { fetchTimeout(); }, []);

  const handleSave = async () => {
    setError('');
    setMessage('');

    const mins = parseFloat(minutes);
    if (isNaN(mins) || mins <= 0) {
      setError('Enter a valid number of minutes greater than 0.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          { key: 'rotate_timeout_seconds', value: Math.round(mins * 60).toString(), updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (error) throw error;
      setMessage('Timeout updated successfully.');
      setTimeout(() => setMessage(''), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Auto-Rotation Timeout</h2>
      <p className="text-gray-600 text-sm mb-4">
        How long a patient can sit on-progress or in a cubicle before automatically rotating back to the queue.
        Applies to all auto-assign services (not Consultation / OPD Screening).
      </p>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <>
          {error && (
            <div className="mb-3 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-3 p-3 bg-green-100 border border-green-200 text-green-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-28 p-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-600 text-sm">minutes</span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}