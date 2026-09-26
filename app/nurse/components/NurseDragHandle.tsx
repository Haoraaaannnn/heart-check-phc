/**
 * @fileoverview Dedicated drag handle component for the Nurse Dashboard.
 *
 * Provides an accessible touch grip icon for initiating pointer-based drag-and-drop
 * interactions on both touchscreens and desktop workstations.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

'use client';

import React from 'react';

/**
 * Props for the NurseDragHandle component.
 */
export interface NurseDragHandleProps {
  /** Optional additional CSS classes. */
  className?: string;
  /** Accessible tooltip and label for screen readers. */
  title?: string;
}

/**
 * Grip handle icon specifically marked with `data-drag-handle="true"`.
 *
 * @param props - Customization properties.
 * @returns Rendered drag handle element.
 */
export function NurseDragHandle({
  className = '',
  title = 'Drag to move patient to next stage',
}: NurseDragHandleProps) {
  return (
    <span
      data-drag-handle="true"
      title={title}
      aria-label={title}
      role="button"
      tabIndex={0}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-grab active:cursor-grabbing touch-none select-none transition-colors ${className}`.trim()}
    >
      <i className="bx bx-grid-vertical text-lg" aria-hidden="true" />
    </span>
  );
}

export default NurseDragHandle;
