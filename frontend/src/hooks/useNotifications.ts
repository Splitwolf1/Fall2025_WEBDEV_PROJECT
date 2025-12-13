import { useState, useEffect, useCallback } from 'react';
import { socketClient } from '@/lib/socket-client';
import { toast } from 'sonner';
import { auth } from '@/lib/auth';

export interface Notification {
  _id: string;
  userId: string;
  type: 'order' | 'delivery' | 'inspection' | 'stock' | 'message' | 'system' | 'rating' | 'order_update' | 'chat_message' | 'chat_message_sent';
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
    // Skip chat messages - those are handled by MessageContext
    if (notification.type === 'chat_message' || notification.type === 'chat_message_sent') {
      console.log('📬 Skipping chat message (handled by MessageContext):', notification.type);
      return;
    }

    console.log('📬 New notification received:', notification);

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show toast notification
    toast(notification.title, {
      description: notification.message,
      action: {
        label: 'View',
        onClick: () => console.log('View notification', notification._id),
      },
    });

    // Optional: Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
      });
    }
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('notifications');
        if (stored) {
          const parsed = JSON.parse(stored);
          setNotifications(parsed);
          setUnreadCount(parsed.filter((n: Notification) => !n.isRead).length);
        }
      }
    } catch (error) {
      console.error('Failed to load notifications from storage:', error);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && notifications.length > 0) {
        localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, 50))); // Keep last 50
      } else if (notifications.length === 0 && typeof window !== 'undefined') {
        // Verify if we should clear it or if it's just initial empty state
        // Safe to clear if we are sure it's an intentional empty state, 
        // but better effectively managed by the clear functions.
        // However, for simplicity in this hook, we sync state.
        // Check if initialized to avoid wiping storage on hydration if empty by default
      }
    } catch (error) {
      console.error('Failed to save notifications to storage:', error);
    }
  }, [notifications]);

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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('notifications');
    }
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
