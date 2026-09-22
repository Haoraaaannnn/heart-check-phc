import { useSyncExternalStore } from "react";

/**
 * Registers window listeners that tell React when the orientation may have changed.
 *
 * @param onChange - Callback React provides; call it when the value may have changed.
 * @returns A cleanup function that removes the listeners.
 */
function subscribe(onChange: () => void) {
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);

    return () => {
        window.removeEventListener("resize", onChange);
        window.removeEventListener("orientationchange", onChange);
    };
}

/** Client value: the window is wider than it is tall. */
const getSnapshot = () => window.innerWidth > window.innerHeight;

/** Server value: there is no window, so assume portrait until the client measures. */
const getServerSnapshot = () => false;

/**
 * Tracks whether the window is in landscape orientation.
 *
 * @remarks
 * Uses `useSyncExternalStore` instead of `useState` + `useEffect`, so it
 * follows resize and rotation without calling setState inside an effect.
 *
 * @returns `true` when `window.innerWidth > window.innerHeight`.
 */
export function useIsLandscape(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}