/** @fileoverview Username ownership labels shared by counter and nurse station controls. */
import { StationOwner } from '@/types/StationOwnership';
import type { ReactNode } from 'react';

/**
 * Labels the assigned usernames and highlights ownership of the signed-in staff account.
 * @param props - Verified owner metadata, or undefined while metadata is loading.
 * @returns A wrapping, accessible ownership indicator using solid subdued surfaces.
 */
export function StationOwnerBadge({ owners, variant = 'badge', actions }: {
  owners?: StationOwner[]; variant?: 'badge' | 'header'; actions?: ReactNode;
}) {
  const isMine = owners?.some(owner => owner.isCurrentUser) ?? false;
  const label = owners === undefined ? 'Checking owner...' : owners.length === 0 ? 'Unassigned'
    : `Owner: ${owners.map(owner => `${owner.username}${owner.isCurrentUser ? ' (You)' : ''}`).join(', ')}`;
  if (variant === 'header') return <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
    <span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isMine
      ? 'bg-red-50 text-red-700 dark:bg-slate-800 dark:text-red-300'
      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}><i className="bx bx-user text-base" /></span>
    <span className="min-w-0 flex-1 text-xs font-semibold text-slate-700 whitespace-normal break-words dark:text-slate-200">{label}</span>
    {isMine && <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">Your counter</span>}
    {actions && <div className="ml-auto flex shrink-0 items-center gap-1.5">{actions}</div>}
  </div>;
  return <span className={`inline-flex max-w-full flex-wrap items-center gap-1 rounded-md border px-2 py-1 text-xs whitespace-normal break-words ${isMine
    ? 'border-slate-400 bg-slate-100 font-semibold text-slate-900 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100'
    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>
    {label}
  </span>;
}
