import { useState, useEffect, useCallback } from 'react';
import { socketClient } from '@/lib/socket-client';
import { auth } from '@/lib/auth';

export interface Notification {
  _id: string;
  userId: string;
  type: 'order' | 'delivery' | 'inspection' | 'stock' | 'message' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Handle incoming notifications
  const handleNotification = useCallback((notification: Notification) => {
    console.log('📬 New notification received:', notification);

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Optional: Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
      });
    }
  }, []);

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (!user) return;

    // Connect to Socket.io
    const socket = socketClient.connect(user.id, user.role);

    if (socket) {
      setIsConnected(true);

      // Listen for notifications
      socketClient.onNotification(handleNotification);

      // Request browser notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    // Cleanup
    return () => {
      socketClient.offNotification(handleNotification);
    };
  }, [handleNotification]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n._id === notificationId ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
    const notification = notifications.find(n => n._id === notificationId);
    if (notification && !notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [notifications]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  };
}
