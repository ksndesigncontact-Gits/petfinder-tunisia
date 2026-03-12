import { useState, useEffect, useCallback } from 'react';
import type { Notification } from '../types';

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/notifications?owner_id=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data: Notification[] = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: number | string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      });
      if (!res.ok) throw new Error('Failed to mark all as read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all as read error:', err);
    }
  }, []);

  // Polling every 3 seconds (only if logged in)
  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);

    return () => clearInterval(interval);
  }, [userId, fetchNotifications]);

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
