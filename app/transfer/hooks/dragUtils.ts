/**
 * @fileoverview Utility functions for pointer-based drag-and-drop operations
 * across desktop and touch/tablet devices in the transfer dashboard.
 */

/**
 * Coordinate position interface.
 */
export interface DragPoint {
  x: number;
  y: number;
}

/**
 * Extracts normalized page coordinates from PointerEvent, MouseEvent, or TouchEvent.
 *
 * @param event - The input event.
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
 * On touch screens, drag operations should only be initiated from dedicated drag handles
 * to prevent interfering with normal page and container scrolling.
 * On mouse/pen devices, dragging can start from anywhere on the card.
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
 * @param targetAttribute - The HTML attribute identifying drop targets (e.g. 'data-cubicle' or 'data-counter').
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
