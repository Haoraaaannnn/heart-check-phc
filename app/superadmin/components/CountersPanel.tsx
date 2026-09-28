'use client';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../lib/adminApi';

type Counter = { counter_number: number; label: string | null; active: boolean; inUse: number };

export function CountersPanel() {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [labels, setLabels] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await adminApi('/api/superadmin/counters');
      setCounters(data.counters);
      setLabels(Object.fromEntries(data.counters.map((c: Counter) => [c.counter_number, c.label ?? ''])));
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setError('');
    try {
      await fn();
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const add = () =>
    run(async () => {
      await adminApi('/api/superadmin/counters', 'POST', {
        counter_number: newNumber ? Number(newNumber) : undefined,
        label: newLabel,
      });
      setNewNumber('');
      setNewLabel('');
    });

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {error && <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Add counter</h2>
        <div className="flex items-center gap-3">
          <input type="number" min="1" step="1" value={newNumber} onChange={e => setNewNumber(e.target.value)}
            placeholder="Auto" className="w-24 p-2 border border-gray-300 rounded-lg text-gray-900" />
          <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
            placeholder="Label (optional)" className="flex-1 p-2 border border-gray-300 rounded-lg text-gray-900" />
          <button onClick={add}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer">
            Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {counters.length === 0 && <p className="p-6 text-sm text-gray-400">No counters yet.</p>}
        {counters.map(c => (
          <div key={c.counter_number} className="flex items-center gap-3 p-4">
            <span className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
              {c.counter_number}
            </span>
            <input
              type="text"
              value={labels[c.counter_number] ?? ''}
              onChange={e => setLabels(l => ({ ...l, [c.counter_number]: e.target.value }))}
              onBlur={() => {
                if ((labels[c.counter_number] ?? '') !== (c.label ?? '')) {
                  run(() => adminApi('/api/superadmin/counters', 'PUT', {
                    counter_number: c.counter_number, label: labels[c.counter_number], active: c.active,
                  }));
                }
              }}
              placeholder={`Counter ${c.counter_number}`}
              className="flex-1 p-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
            />
            {c.inUse > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {c.inUse} in use
              </span>
            )}
            <button
              onClick={() => run(() => adminApi('/api/superadmin/counters', 'PUT', {
                counter_number: c.counter_number, label: labels[c.counter_number], active: !c.active,
              }))}
              className={`text-xs font-semibold px-3 py-1 rounded-full cursor-pointer ${
                c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {c.active ? 'Active' : 'Inactive'}
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete counter ${c.counter_number}? Users assigned to it lose that assignment.`)) {
                  run(() => adminApi('/api/superadmin/counters', 'DELETE', { counter_number: c.counter_number }));
                }
              }}
              className="text-xs text-red-600 hover:text-red-800 cursor-pointer"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}