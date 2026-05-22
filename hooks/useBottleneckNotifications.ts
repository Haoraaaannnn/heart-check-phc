import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  type: 'bottleneck' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function useBottleneckNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check for bottleneck conditions
  const checkBottleneck = useCallback(async () => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      const { data, error } = await supabase
        .from('patients')
        .select('id, status, created_at, consult_start')
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay);

      if (error || !data) return;

      let maxWaitMs = 0;
      data.forEach((patient) => {
        if (patient.status?.toLowerCase().trim() === 'waiting' && patient.created_at) {
          const waitMs = now.getTime() - new Date(patient.created_at).getTime();
          maxWaitMs = Math.max(maxWaitMs, waitMs);
        }
      });

      const maxWaitMins = Math.floor(maxWaitMs / 60000);

      // Create notification if wait exceeds threshold
      if (maxWaitMins > 60) {
        const existingBottleneck = notifications.find(
          (n) => n.type === 'bottleneck' && !n.read
        );

        if (!existingBottleneck) {
          const newNotification: Notification = {
            id: `bottleneck-${Date.now()}`,
            type: 'bottleneck',
            title: '⚠️ System Bottleneck Detected',
            message: `Longest patient wait time: ${maxWaitMins} minutes. Please review queue status.`,
            timestamp: new Date(),
            read: false,
          };

          setNotifications((prev) => [newNotification, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error checking bottleneck:', error);
    }
  }, [notifications]);

  // Poll for bottleneck conditions every 2 minutes
  useEffect(() => {
    checkBottleneck();
    const interval = setInterval(checkBottleneck, 120000);
    return () => clearInterval(interval);
  }, [checkBottleneck]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Update unread count
  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
  };
}
