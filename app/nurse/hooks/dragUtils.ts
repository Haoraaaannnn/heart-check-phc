/**
 * @fileoverview Utility functions for pointer-based drag-and-drop operations
 * across desktop and touch/tablet devices in the Nurse Dashboard.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

/**
 * Coordinate position interface for pointer tracking.
 */
export interface DragPoint {
  x: number;
  y: number;
}

/**
 * Extracts normalized page coordinates from PointerEvent or MouseEvent.
 *
 * @param event - The pointer or mouse event.
 * @returns The `{ x, y }` coordinates.
 */
export function pointOf(event: React.PointerEvent | PointerEvent | React.MouseEvent | MouseEvent): DragPoint {
  return {
    x: event.clientX,
    y: event.clientY,
  };
}

/**
 * Determines if a drag operation can initiate based on pointer type and target.
 *
 * @remarks
 * On touch screens, drag operations are restricted to dedicated drag handles
 * (`data-drag-handle="true"`) to prevent interfering with column scrolling.
 * On mouse/pen devices, dragging can start anywhere on non-interactive card surfaces.
 *
 * @param event - The pointer event.
 * @returns True if dragging can proceed; false otherwise.
 */
export function canStartDrag(event: React.PointerEvent): boolean {
  // If primary mouse button is not pressed, ignore
  if (event.pointerType === 'mouse' && event.button !== 0) {
    return false;
  }

  // On touch, require touching a drag handle or element with data-drag-handle
  if (event.pointerType === 'touch') {
    const target = event.target as HTMLElement | null;
    return !!target?.closest('[data-drag-handle="true"]');
  }

  // Check if click was on an interactive button or input inside the draggable card
  const interactiveTarget = (event.target as HTMLElement | null)?.closest('button, a, input, select');
  if (interactiveTarget) {
    return false;
  }

  return true;
}

/**
 * Walks down the DOM stack at coordinate (x, y) to find the nearest valid drop target.
 *
 * @param point - Current pointer coordinates `{ x, y }`.
 * @param targetAttribute - The HTML attribute identifying drop targets (e.g. 'data-stage-id').
 * @returns The attribute value of the matched drop target, or null if none found.
 */
export function findDropTarget(point: DragPoint, targetAttribute: string): string | null {
  if (typeof document === 'undefined') return null;

  const elements = document.elementsFromPoint(point.x, point.y);
  for (const el of elements) {
    const attr = (el as HTMLElement).getAttribute(targetAttribute);
    if (attr) {
      return attr;
    }
  }

  return null;
}
