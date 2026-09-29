'use client';

import React from 'react';

/**
 * Props for `DragHandle`.
 */
export interface DragHandleProps {
  /** Optional custom class names. */
  className?: string;
  /** Accessible title for screen readers. */
  title?: string;
}

/**
 * Dedicated drag handle grip for touch and pointer-based dragging.
 *
 * @remarks
 * On touch screens and tablets, dragging is gated to this handle (`data-drag-handle="true"`)
 * so users can freely scroll panels with normal touch gestures without triggering accidental drags.
 * Uses pure CSS grip bars instead of font icons.
 *
 * @param props - Customization props for the handle.
 * @returns The rendered grip handle element.
 */
export function DragHandle({ className = '', title = 'Drag to move patient' }: DragHandleProps) {
  return (
    <span
      data-drag-handle="true"
      title={title}
      className={`inline-flex flex-col items-center justify-center gap-[3px] w-7 h-7 rounded-lg hover:bg-gray-100 cursor-grab active:cursor-grabbing touch-none select-none transition-colors ${className}`.trim()}
      aria-label={title}
    >
      <span className="w-3.5 h-[2px] bg-slate-300 rounded-full" />
      <span className="w-3.5 h-[2px] bg-slate-300 rounded-full" />
      <span className="w-3.5 h-[2px] bg-slate-300 rounded-full" />
    </span>
  );
}

export default DragHandle;
