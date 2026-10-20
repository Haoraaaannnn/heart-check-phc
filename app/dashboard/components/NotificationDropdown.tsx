/**
 * @fileoverview Enterprise notifications dropdown panel for Heart Check PHC.
 *
 * Displays real-time operational notifications, bottleneck alerts, queue warnings,
 * and system notices with category filtering, mark-as-read, dismissal, and purge capabilities.
 *
 * Adheres strictly to AGENTS.md guidelines:
 * - High-contrast solid surfaces (zero blurry glassmorphism)
 * - Strict separation of concerns (all copy in notificationTexts, styles in notificationStyles)
 * - Zero emojis standard across all UI elements and labels
 * - Prohibition of text truncation on operational or medical metadata
 * - Fully accessible keyboard controls and outside-click dismissal
 *
 * @module app/dashboard/components/NotificationDropdown
 */

'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Notification, NotificationType } from '@/app/dashboard/hooks/useBottleneckNotifications';
import { NOTIFICATION_TEXTS } from '@/app/dashboard/constants/notificationTexts';
import { NOTIFICATION_STYLES } from '@/app/dashboard/constants/notificationStyles';

/**
 * Properties for the NotificationDropdown component.
 */
export interface NotificationDropdownProps {
  /** List of real-time notification records */
  notifications: Notification[];
  /** Count of unread notifications */
  unreadCount: number;
  /** Whether to render circular icon button mode or pill badge mode */
  showIcon?: boolean;
  /** Callback to mark a specific notification as read */
  onMarkAsRead: (id: string) => void;
  /** Callback to mark all notifications as read */
  onMarkAllAsRead: () => void;
  /** Callback to dismiss an individual notification */
  onDismiss: (id: string) => void;
  /** Callback to purge all notifications */
  onClearAll: () => void;
}

type FilterCategory = 'all' | 'bottleneck' | 'warning' | 'notice';

/**
 * Enterprise notifications dropdown component.
 *
 * @param props - Component configuration properties.
 * @returns JSX element.
 */
export function NotificationDropdown({
  notifications,
  unreadCount,
  showIcon = true,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onClearAll,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const T = NOTIFICATION_TEXTS;
  const S = NOTIFICATION_STYLES;

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  // Compute category counts for filter bar
  const filterCounts = useMemo(() => {
    const counts = {
      all: notifications.length,
      bottleneck: 0,
      warning: 0,
      notice: 0,
    };

    notifications.forEach((n) => {
      if (n.type === 'bottleneck') counts.bottleneck += 1;
      else if (n.type === 'warning') counts.warning += 1;
      else counts.notice += 1;
    });

    return counts;
  }, [notifications]);

  // Filtered notifications list
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    if (activeFilter === 'bottleneck') {
      return notifications.filter((n) => n.type === 'bottleneck');
    }
    if (activeFilter === 'warning') {
      return notifications.filter((n) => n.type === 'warning');
    }
    return notifications.filter((n) => n.type === 'info' || n.type === 'notice');
  }, [notifications, activeFilter]);

  const getTagText = (type: NotificationType): string => {
    switch (type) {
      case 'bottleneck':
        return T.tags.bottleneck;
      case 'warning':
        return T.tags.warning;
      case 'info':
        return T.tags.info;
      case 'notice':
      default:
        return T.tags.notice;
    }
  };

  const getCardStyle = (type: NotificationType): string => {
    switch (type) {
      case 'bottleneck':
        return S.card.bottleneck;
      case 'warning':
        return S.card.warning;
      case 'info':
        return S.card.info;
      case 'notice':
      default:
        return S.card.notice;
    }
  };

  const getTagStyle = (type: NotificationType): string => {
    switch (type) {
      case 'bottleneck':
        return S.tag.bottleneck;
      case 'warning':
        return S.tag.warning;
      case 'info':
        return S.tag.info;
      case 'notice':
      default:
        return S.tag.notice;
    }
  };

  const getIconClass = (type: NotificationType): string => {
    switch (type) {
      case 'bottleneck':
        return S.icon.bottleneck;
      case 'warning':
        return S.icon.warning;
      case 'info':
        return S.icon.info;
      case 'notice':
      default:
        return S.icon.notice;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button: Circular Bell Icon vs Pill Badge */}
      {showIcon ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={S.trigger.iconButton}
          aria-label={T.header.bellAria}
          aria-expanded={isOpen}
          title={T.header.title}
        >
          <i className="bx bxs-bell text-xl" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className={S.trigger.unreadBadge}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={S.trigger.pillButton}
          aria-label={T.header.bellAria}
          aria-expanded={isOpen}
          title={T.header.title}
        >
          <i className="bx bxs-bell text-sm" aria-hidden="true" />
          <span>{T.header.alertsLabel}</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Floating Notifications Panel */}
      {isOpen && (
        <div className={S.dropdown.panel} role="dialog" aria-label={T.header.title}>
          {/* Header */}
          <div className={S.dropdown.header}>
            <div className={S.dropdown.headerTitle}>
              <i className="bx bxs-bell text-sm text-[#cc3535] dark:text-[#f87171]" aria-hidden="true" />
              <span>
                {T.header.title} {unreadCount > 0 && `(${unreadCount})`}
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-xs text-[#cc3535] dark:text-[#f87171] hover:underline font-bold cursor-pointer"
              >
                {T.header.markAllRead}
              </button>
            )}
          </div>

          {/* Severity Category Filter Pills */}
          {notifications.length > 0 && (
            <div className={S.dropdown.filterBar} role="tablist" aria-label="Notification filters">
              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'all'}
                onClick={() => setActiveFilter('all')}
                className={`${S.dropdown.filterPill} ${
                  activeFilter === 'all'
                    ? S.dropdown.filterPillActive
                    : S.dropdown.filterPillInactive
                }`}
              >
                <span>{T.filters.all}</span>
                <span className="opacity-75">({filterCounts.all})</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'bottleneck'}
                onClick={() => setActiveFilter('bottleneck')}
                className={`${S.dropdown.filterPill} ${
                  activeFilter === 'bottleneck'
                    ? S.dropdown.filterPillActive
                    : S.dropdown.filterPillInactive
                }`}
              >
                <span>{T.filters.alerts}</span>
                <span className="opacity-75">({filterCounts.bottleneck})</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'warning'}
                onClick={() => setActiveFilter('warning')}
                className={`${S.dropdown.filterPill} ${
                  activeFilter === 'warning'
                    ? S.dropdown.filterPillActive
                    : S.dropdown.filterPillInactive
                }`}
              >
                <span>{T.filters.warnings}</span>
                <span className="opacity-75">({filterCounts.warning})</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'notice'}
                onClick={() => setActiveFilter('notice')}
                className={`${S.dropdown.filterPill} ${
                  activeFilter === 'notice'
                    ? S.dropdown.filterPillActive
                    : S.dropdown.filterPillInactive
                }`}
              >
                <span>{T.filters.notices}</span>
                <span className="opacity-75">({filterCounts.notice})</span>
              </button>
            </div>
          )}

          {/* Notification Items List */}
          <div className={S.dropdown.listContainer}>
            {filteredNotifications.length === 0 ? (
              <div className={S.dropdown.emptyState}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#242424] flex items-center justify-center mx-auto mb-2.5 text-slate-400 dark:text-[#737373]">
                  <i className="bx bx-check-circle text-2xl" aria-hidden="true" />
                </div>
                <p className="font-bold text-slate-700 dark:text-[#f5f5f5] text-xs">
                  {T.header.emptyTitle}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-[#a3a3a3] mt-1 leading-relaxed">
                  {T.header.emptyDesc}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const cardStyle = getCardStyle(notification.type);
                const tagStyle = getTagStyle(notification.type);
                const iconClass = getIconClass(notification.type);
                const tagText = getTagText(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 transition-colors ${cardStyle} ${
                      !notification.read ? 'opacity-100 font-medium' : 'opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="pt-0.5 shrink-0">
                        <i className={iconClass} aria-hidden="true" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={tagStyle}>{tagText}</span>
                          <p className="font-bold text-slate-900 dark:text-[#f5f5f5] text-xs break-words">
                            {notification.title}
                          </p>
                        </div>

                        {/* Medical copy: Strictly wrap naturally, no truncation */}
                        <p className="text-xs text-slate-700 dark:text-[#d4d4d4] mt-1 leading-relaxed break-words whitespace-normal">
                          {notification.message}
                        </p>

                        <p className="text-[10px] text-slate-400 dark:text-[#737373] mt-1.5 font-mono">
                          {notification.timestamp instanceof Date
                            ? notification.timestamp.toLocaleTimeString()
                            : new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() => onMarkAsRead(notification.id)}
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] dark:hover:bg-[#2e2e2e] transition cursor-pointer"
                            title={T.actions.read}
                          >
                            {T.actions.read}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDismiss(notification.id)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-[#737373] dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title={T.actions.dismiss}
                        >
                          {T.actions.dismiss}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className={S.dropdown.footer}>
              <span className="text-[11px] text-slate-500 dark:text-[#a3a3a3] font-medium">
                {T.header.totalLabel}: {notifications.length}
              </span>
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-slate-500 dark:text-[#a3a3a3] hover:text-[#cc3535] dark:hover:text-[#f87171] font-bold cursor-pointer transition-colors"
              >
                {T.header.clearAll}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
