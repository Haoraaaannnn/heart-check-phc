'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import 'boxicons/css/boxicons.min.css';
import {
  DASHBOARD_HOME,
  NAV_ITEMS,
  type NavGroup,
  type NavItem,
  type NavLink,
} from '@/app/dashboard/constants/navigation';
import { DASH } from '@/app/dashboard/constants/styles';
import { APP_INFO } from '@/constants/app';

const S = DASH.sidebar;

/**
 * Whether `href` is the current page.
 * The dashboard home is matched exactly; every other route also matches its
 * sub-paths (e.g. /dashboard/patients/123 keeps "Patients" highlighted).
 */
function isRouteActive(href: string, pathname: string): boolean {
  if (href === DASHBOARD_HOME) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Type guard: is this nav entry a collapsible group? */
function isGroup(item: NavItem): item is NavGroup {
  return 'children' in item;
}

/**
 * Left navigation for the admin dashboard.
 *
 * Menu structure is defined in constants/navigation.ts; styling in
 * constants/styles.ts (DASH.sidebar). Color-only design - no images.
 * Hidden below the `md` breakpoint (desktop-first admin tool).
 */
export default function Sidebar() {
  const pathname = usePathname();

  // Manual open/closed overrides per group. When a group has no override it is
  // open exactly when one of its children is the current page.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string, currentlyOpen: boolean) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !currentlyOpen }));

  const renderLink = (item: NavLink) => {
    const active = isRouteActive(item.href, pathname);
    return (
      <Link
        key={item.key}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={`${S.item} ${active ? S.itemActive : S.itemIdle}`}
      >
        <i className={`bx ${item.icon} ${S.icon}`} />
        <span>{item.label}</span>
      </Link>
    );
  };

  const renderGroup = (group: NavGroup) => {
    const childActive = group.children.some((c) => isRouteActive(c.href, pathname));
    const isOpen = openGroups[group.key] ?? childActive;

    return (
      <div key={group.key}>
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => toggleGroup(group.key, isOpen)}
          className={`${S.item} ${childActive ? S.itemGroupActive : S.itemIdle}`}
        >
          <i className={`bx ${group.icon} ${S.icon}`} />
          <span>{group.label}</span>
          <i className={`bx bx-chevron-down ${S.chevron} ${isOpen ? S.chevronOpen : ''}`} />
        </button>

        {isOpen && (
          <div className={S.subList}>
            {group.children.map((child) => {
              const active = isRouteActive(child.href, pathname);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  aria-current={active ? 'page' : undefined}
                  className={`${S.subItem} ${active ? S.subActive : S.subIdle}`}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={S.root}>
      <nav className={S.nav} aria-label="Dashboard navigation">
        {NAV_ITEMS.map((item) => (isGroup(item) ? renderGroup(item) : renderLink(item)))}
      </nav>

      <p className={S.footer}>{APP_INFO.pillars.join(' · ')}</p>
    </aside>
  );
}