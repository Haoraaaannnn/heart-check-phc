'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../lib/adminApi';
import { SERVICES, SERVICES_WITH_SUBCATEGORIES, SUBCATEGORIES } from '@/lib/facilities';

type Cubicle = { id: number; cubicleNum: string; category: string; room: number; subcategory: string | null };
type Group = { category: string; subcategory: string | null; room: number; cubicles: Cubicle[] };

type ModalState =
  | { type: 'addRoom' }
  | { type: 'renameRoom'; group: Group }
  | { type: 'addCubicle'; group: Group }
  | { type: 'editCubicle'; cubicle: Cubicle }
  | { type: 'confirm'; title: string; message: string; run: () => Promise<void> }
  | null;

const sectionLabel = (category: string, sub: string | null) => (sub ? `${category} · ${sub}` : category);

export function RoomsPanel() {
  const [cubicles, setCubicles] = useState<Cubicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const [fCategory, setFCategory] = useState(SERVICES[0]);
  const [fSub, setFSub] = useState(SUBCATEGORIES[0]);
  const [fRoom, setFRoom] = useState('');
  const [fCount, setFCount] = useState('1');
  const [fName, setFName] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await adminApi('/api/superadmin/cubicles');
      setCubicles(data.cubicles ?? []);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sections = useMemo(() => {
    const groups = new Map<string, Group>();
    for (const c of cubicles) {
      const key = `${c.category}::${c.subcategory ?? ''}::${c.room}`;
      if (!groups.has(key)) {
        groups.set(key, { category: c.category, subcategory: c.subcategory, room: c.room, cubicles: [] });
      }
      groups.get(key)!.cubicles.push(c);
    }
    const bySection = new Map<string, Group[]>();
    [...groups.values()]
      .sort((a, b) =>
        a.category.localeCompare(b.category) ||
        (a.subcategory ?? '').localeCompare(b.subcategory ?? '') ||
        a.room - b.room
      )
      .forEach(g => {
        const label = sectionLabel(g.category, g.subcategory);
        bySection.set(label, [...(bySection.get(label) ?? []), g]);
      });
    return [...bySection.entries()];
  }, [cubicles]);

  const openModal = (m: ModalState) => {
    setModalError('');
    setFName('');
    setFRoom('');
    setFCount('1');
    if (m?.type === 'editCubicle') setFName(m.cubicle.cubicleNum);
    if (m?.type === 'renameRoom') setFRoom(String(m.group.room));
    setModal(m);
  };

  const needsSub = SERVICES_WITH_SUBCATEGORIES.includes(fCategory);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    setModalError('');
    try {
      switch (modal.type) {
        case 'addRoom':
          await adminApi('/api/superadmin/rooms', 'POST', {
            category: fCategory,
            subcategory: needsSub ? fSub : null,
            room: Number(fRoom),
            cubicleCount: Number(fCount),
          });
          break;
        case 'renameRoom':
          await adminApi('/api/superadmin/rooms', 'PUT', {
            category: modal.group.category,
            subcategory: modal.group.subcategory,
            room: modal.group.room,
            newRoom: Number(fRoom),
          });
          break;
        case 'addCubicle':
          await adminApi('/api/superadmin/cubicles', 'POST', {
            category: modal.group.category,
            subcategory: modal.group.subcategory,
            room: modal.group.room,
            cubicleNum: fName.trim() || undefined,
          });
          break;
        case 'editCubicle':
          await adminApi('/api/superadmin/cubicles', 'PUT', { id: modal.cubicle.id, cubicleNum: fName });
          break;
        case 'confirm':
          await modal.run();
          break;
      }
      setModal(null);
      await load();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteRoom = (g: Group) =>
    openModal({
      type: 'confirm',
      title: `Delete Room ${g.room}?`,
      message: `This permanently deletes Room ${g.room} (${sectionLabel(g.category, g.subcategory)}) and its ${g.cubicles.length} cubicle(s).`,
      run: async () => {
        await adminApi('/api/superadmin/rooms', 'DELETE', {
          category: g.category, subcategory: g.subcategory, room: g.room,
        });
      },
    });

  const confirmDeleteCubicle = (c: Cubicle) =>
    openModal({
      type: 'confirm',
      title: 'Delete cubicle?',
      message: `This permanently deletes ${c.cubicleNum}.`,
      run: async () => { await adminApi('/api/superadmin/cubicles', 'DELETE', { id: c.id }); },
    });

  const inputCls =
    'w-full p-2 border border-gray-300 rounded-lg mb-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500';

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">
          Rooms are made of cubicles. Adding a room creates its cubicles; deleting one removes them.
        </p>
        <button
          onClick={() => openModal({ type: 'addRoom' })}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium cursor-pointer"
        >
          + Add Room
        </button>
      </div>

      {error && <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {sections.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center text-gray-400 text-sm">
          No rooms yet.
        </div>
      )}

      {sections.map(([label, groups]) => (
        <div key={label}>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">{label}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map(g => (
              <div key={`${label}-${g.room}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900">Room {g.room}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => openModal({ type: 'renameRoom', group: g })}
                      className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 cursor-pointer">Renumber</button>
                    <button onClick={() => confirmDeleteRoom(g)}
                      className="text-xs text-red-600 hover:text-red-800 px-2 py-1 cursor-pointer">Delete</button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  {g.cubicles.map(c => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5">
                      <span className="text-sm text-gray-700 truncate">{c.cubicleNum}</span>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openModal({ type: 'editCubicle', cubicle: c })}
                          className="text-xs text-blue-600 hover:text-blue-800 px-1.5 cursor-pointer">Edit</button>
                        <button onClick={() => confirmDeleteCubicle(c)}
                          className="text-xs text-red-600 hover:text-red-800 px-1.5 cursor-pointer">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => openModal({ type: 'addCubicle', group: g })}
                  className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                  + Add cubicle
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={submit} className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className={`text-xl font-bold mb-4 ${modal.type === 'confirm' ? 'text-red-600' : 'text-gray-900'}`}>
              {modal.type === 'addRoom' && 'Add Room'}
              {modal.type === 'renameRoom' && `Renumber Room ${modal.group.room}`}
              {modal.type === 'addCubicle' && `Add cubicle to Room ${modal.group.room}`}
              {modal.type === 'editCubicle' && 'Edit cubicle'}
              {modal.type === 'confirm' && modal.title}
            </h2>

            {modalError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">{modalError}</div>
            )}

            {modal.type === 'addRoom' && (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <select value={fCategory} onChange={e => setFCategory(e.target.value)} className={inputCls}>
                  {SERVICES.map(s => <option key={s}>{s}</option>)}
                </select>
                {needsSub && (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient group</label>
                    <select value={fSub} onChange={e => setFSub(e.target.value)} className={inputCls}>
                      {SUBCATEGORIES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </>
                )}
                <label className="block text-sm font-medium text-gray-700 mb-1">Room number</label>
                <input type="number" min="1" step="1" required value={fRoom}
                  onChange={e => setFRoom(e.target.value)} className={inputCls} />
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of cubicles</label>
                <input type="number" min="1" max="20" step="1" required value={fCount}
                  onChange={e => setFCount(e.target.value)} className={inputCls} />
              </>
            )}

            {modal.type === 'renameRoom' && (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">New room number</label>
                <input type="number" min="1" step="1" required value={fRoom}
                  onChange={e => setFRoom(e.target.value)} className={inputCls} />
                <p className="text-xs text-gray-500 mb-3">
                  Cubicle names containing R{modal.group.room} are updated to match.
                </p>
              </>
            )}

            {(modal.type === 'addCubicle' || modal.type === 'editCubicle') && (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cubicle name</label>
                <input type="text" value={fName} onChange={e => setFName(e.target.value)}
                  required={modal.type === 'editCubicle'}
                  placeholder={modal.type === 'addCubicle' ? 'Leave blank to auto-generate' : ''}
                  className={inputCls} />
              </>
            )}

            {modal.type === 'confirm' && <p className="text-gray-700 mb-2">{modal.message}</p>}

            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setModal(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className={`px-4 py-2 text-white rounded-lg transition disabled:opacity-50 cursor-pointer ${
                  modal.type === 'confirm' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}>
                {saving ? 'Saving...' : modal.type === 'confirm' ? 'Delete' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}