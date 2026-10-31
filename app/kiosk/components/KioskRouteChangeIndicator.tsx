/** @fileoverview Loading completion tracks the full kiosk route, including query-only navigation. */
'use client';
import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useKioskLoading } from '@/app/kiosk/context/KioskLoadingContext';

/** @returns A stable route key, independent of query parameter ordering or an anchor fragment. */
export function kioskRouteKey(pathname: string, search: string) {
  const params = new URLSearchParams(search);
  params.sort();
  return `${pathname}?${params}`;
}

/** @returns No visual output; clears the overlay when either the path or its options finish changing. */
export default function KioskRouteChangeIndicator() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const routeKey = kioskRouteKey(pathname, search);
  const previousRoute = useRef(routeKey);
  const { showLoading, hideLoading } = useKioskLoading();
  useEffect(() => {
    /** @param event - Same-origin link activation before Next.js begins its transition. */
    function handleClick(event: MouseEvent) {
      if (!(event.target instanceof Element) || event.defaultPrevented || event.button !== 0
        || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target.closest('a');
      if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')
        || anchor.origin !== window.location.origin) return;
      if (kioskRouteKey(anchor.pathname, anchor.search) !== routeKey) showLoading();
    }
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [routeKey, showLoading]);
  useEffect(() => {
    if (previousRoute.current === routeKey) return;
    previousRoute.current = routeKey;
    hideLoading();
  }, [routeKey, hideLoading]);
  return null;
}
