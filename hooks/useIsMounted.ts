import { useSyncExternalStore } from "react";

/** The "client vs server" answer never changes after load, so there is nothing to subscribe to. */
const subscribe = () => () => undefined;

/**
 * Tells a component whether it is running on the client after hydration.
 *
 * @remarks
 * Replaces the `useState(false)` + `useEffect(() => setMounted(true), [])`
 * pattern, which triggers the `react-hooks/set-state-in-effect` lint error.
 * React uses the server value (`false`) for the server render and hydration,
 * then switches to the client value (`true`), so there is no hydration mismatch.
 *
 * @returns `false` on the server and during hydration, `true` afterwards.
 */
export function useIsMounted(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
    );
}