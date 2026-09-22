// app/kiosk/context/KioskLoadingContext.tsx
"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

/** Shape of the value exposed by {@link KioskLoadingProvider}. */
interface KioskLoadingContextValue {
    /** Whether the full-screen loading overlay is currently visible. */
    isLoading: boolean;
    /** Optional status text shown under the spinner while loading. */
    message: string;
    /**
     * Shows the overlay.
     * @param message - Optional status text to display; keeps the previous
     *                   message if omitted.
     */
    showLoading: (message?: string) => void;
    /** Hides the overlay. */
    hideLoading: () => void;
}

const KioskLoadingContext = createContext<KioskLoadingContextValue | null>(
    null,
);

const DEFAULT_MESSAGE = "Loading, please wait...";

/**
 * Provides kiosk-wide loading overlay state.
 *
 * Wrap the kiosk route tree with this once (in `app/kiosk/layout.tsx`) so
 * that any page or hook nested under `/kiosk/*` can call
 * `useKioskLoading()` to show/hide a full-screen "please wait" overlay —
 * e.g. while submitting a check-in, printing a ticket, or waiting on a
 * Supabase call — without each page managing its own local state.
 *
 * @param props.children - The kiosk route tree.
 */
export function KioskLoadingProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(DEFAULT_MESSAGE);

    const showLoading = useCallback((nextMessage?: string) => {
        if (nextMessage) setMessage(nextMessage);
        setIsLoading(true);
    }, []);

    const hideLoading = useCallback(() => {
        setIsLoading(false);
    }, []);

    const value = useMemo(
        () => ({ isLoading, message, showLoading, hideLoading }),
        [isLoading, message, showLoading, hideLoading],
    );

    return (
        <KioskLoadingContext.Provider value={value}>
            {children}
        </KioskLoadingContext.Provider>
    );
}

/**
 * Hook for reading/controlling the kiosk-wide loading overlay from any
 * component nested under {@link KioskLoadingProvider}.
 *
 * @throws If called outside a `KioskLoadingProvider` (i.e. outside `/kiosk/*`).
 */
export function useKioskLoading(): KioskLoadingContextValue {
    const ctx = useContext(KioskLoadingContext);
    if (!ctx) {
        throw new Error(
            "useKioskLoading must be used within a KioskLoadingProvider",
        );
    }
    return ctx;
}