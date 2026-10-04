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
 * Dedicated drag handle grip icon for touch and pointer-based dragging.
 *
 * @remarks
 * On touch screens and tablets, dragging is gated to this handle (`data-drag-handle="true"`)
 * so users can freely scroll panels with normal touch gestures without triggering accidental drags.
 *
 * @param props - Customization props for the handle.
 * @returns The rendered grip handle element.
 */
export function DragHandle({ className = '', title = 'Drag to move patient' }: DragHandleProps) {
  return (
    <span
      data-drag-handle="true"
      title={title}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-grab active:cursor-grabbing touch-none select-none transition-colors ${className}`.trim()}
      aria-label={title}
    >
      <i className="bx bx-grid-vertical text-lg" aria-hidden="true" />
    </span>
  );
}

export default DragHandle;
