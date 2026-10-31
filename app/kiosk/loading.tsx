/** @fileoverview Immediate kiosk route feedback while server-side service data is fetched. */
/** @returns A light-mode loading placeholder that fits the existing kiosk shell. */
export default function KioskLoading() {
  return <div role="status" className="flex h-full items-center justify-center p-6 text-center text-xl text-slate-600">Loading, please wait…</div>;
}
