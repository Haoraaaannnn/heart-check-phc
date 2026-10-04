/**
 * @fileoverview Notification dropdown panel for Admin Dashboard bottleneck alerts.
 *
 * Displays unread bottleneck alerts, warning messages, and system notices with
 * mark-as-read, dismiss, and clear-all capabilities. Adheres strictly to the
 * high-contrast solid surfaces standard.
 *
 * @module app/dashboard/components/NotificationDropdown
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Notification } from '@/app/dashboard/hooks/useBottleneckNotifications';

/**
 * Properties for NotificationDropdown component.
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'bottleneck':
        return 'bg-red-50 dark:bg-rose-950/40 border-l-4 border-rose-600';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500';
      case 'info':
        return 'bg-slate-100 dark:bg-[#242424] border-l-4 border-slate-500 dark:border-[#737373]';
      default:
        return 'bg-slate-50 dark:bg-[#242424] border-l-4 border-slate-400 dark:border-[#737373]';
    }
  };

  const getNotificationTag = (type: string) => {
    switch (type) {
      case 'bottleneck':
        return '[Alert]';
      case 'warning':
        return '[Warning]';
      case 'info':
        return '[Info]';
      default:
        return '[Notice]';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      {showIcon ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#141414] text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-100 dark:hover:bg-[#242424] transition shadow-2xs border border-slate-200 dark:border-[#2e2e2e] cursor-pointer`}
          aria-label="Notifications"
        >
          <i className="bx bxs-bell text-xl" aria-hidden="true" />

          {/* Unread Count Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-rose-600 rounded-full shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer"
          aria-label="Notifications"
        >
          <span>Alerts</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-slate-200 dark:border-[#2e2e2e] z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-50 dark:bg-[#242424] px-4 py-3 border-b border-slate-200 dark:border-[#2e2e2e] flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-[#f5f5f5]">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-xs text-[#a8071a] dark:text-[#f87171] hover:underline font-semibold cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2e2e2e] phc-scroll">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs font-medium text-slate-400 dark:text-[#737373]">
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 ${getNotificationColor(
                    notification.type
                  )} ${!notification.read ? 'opacity-100' : 'opacity-70'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-[#a3a3a3] shrink-0 pt-0.5">
                      {getNotificationTag(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-[#f5f5f5] text-xs">
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-[#a3a3a3] mt-1">
                        {notification.message}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-[#737373] mt-1.5 font-mono">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() => onMarkAsRead(notification.id)}
                          className="px-1.5 py-0.5 hover:bg-slate-200 dark:hover:bg-[#242424] rounded text-[11px] text-slate-600 dark:text-[#a3a3a3] font-medium cursor-pointer"
                          title="Mark as read"
                        >
                          Read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDismiss(notification.id)}
                        className="px-1.5 py-0.5 hover:bg-slate-200 dark:hover:bg-[#242424] rounded text-[11px] text-slate-600 dark:text-[#a3a3a3] font-medium cursor-pointer"
                        title="Dismiss"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="bg-slate-50/50 dark:bg-[#141414]/50 px-4 py-2 border-t border-slate-200 dark:border-[#2e2e2e]">
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-slate-500 dark:text-[#a3a3a3] hover:text-[#a8071a] dark:hover:text-[#f87171] font-medium w-full text-center py-1 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
