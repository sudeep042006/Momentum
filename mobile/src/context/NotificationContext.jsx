import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationApi } from '../api/notificationApi';
import { cacheManager } from '../storage/cacheManager';
import { networkMonitor } from '../sync/networkMonitor';

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  fetchNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  clearAll: async () => {},
  addLocalNotification: async () => {},
});

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Recalculate unread count helper
  const calculateUnread = (list) => {
    return list.filter((n) => !n.isRead).length;
  };

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      // 1. Instant cache load
      const cached = await cacheManager.getNotifications();
      if (Array.isArray(cached)) {
        setNotifications(cached);
        setUnreadCount(calculateUnread(cached));
      }

      // 2. Fetch fresh from server if online
      const isOnline = await networkMonitor.checkConnection();
      if (isOnline) {
        const res = await notificationApi.getNotifications();
        if (res.data?.success) {
          const serverList = res.data.data || [];
          setNotifications(serverList);
          const count = typeof res.data.unreadCount === 'number' 
            ? res.data.unreadCount 
            : calculateUnread(serverList);
          setUnreadCount(count);
          await cacheManager.setNotifications(serverList);
        }
      }
    } catch (err) {
      // Offline fallback: keep cached data
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      // Optimistic update
      const updated = notifications.map((n) =>
        (n._id === id || n.id === id) ? { ...n, isRead: true } : n
      );
      setNotifications(updated);
      setUnreadCount(calculateUnread(updated));
      await cacheManager.setNotifications(updated);

      const isOnline = await networkMonitor.checkConnection();
      if (isOnline) {
        await notificationApi.markAsRead(id);
      }
    } catch (err) {
      // Handled gracefully
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic update
      const updated = notifications.map((n) => ({ ...n, isRead: true }));
      setNotifications(updated);
      setUnreadCount(0);
      await cacheManager.setNotifications(updated);

      const isOnline = await networkMonitor.checkConnection();
      if (isOnline) {
        await notificationApi.markAllAsRead();
      }
    } catch (err) {
      // Handled gracefully
    }
  };

  const deleteNotification = async (id) => {
    try {
      const updated = notifications.filter((n) => n._id !== id && n.id !== id);
      setNotifications(updated);
      setUnreadCount(calculateUnread(updated));
      await cacheManager.setNotifications(updated);

      const isOnline = await networkMonitor.checkConnection();
      if (isOnline) {
        await notificationApi.deleteNotification(id);
      }
    } catch (err) {
      // Handled gracefully
    }
  };

  const clearAll = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      await cacheManager.setNotifications([]);

      const isOnline = await networkMonitor.checkConnection();
      if (isOnline) {
        await notificationApi.clearAll();
      }
    } catch (err) {
      // Handled gracefully
    }
  };

  const addLocalNotification = async ({ title, message, type = 'system', metadata = {} }) => {
    try {
      const newNotif = {
        _id: 'local_' + Date.now(),
        title,
        message,
        type,
        isRead: false,
        metadata,
        createdAt: new Date().toISOString(),
      };
      const updated = [newNotif, ...notifications];
      setNotifications(updated);
      setUnreadCount(calculateUnread(updated));
      await cacheManager.setNotifications(updated);

      const isOnline = await networkMonitor.checkConnection();
      if (isOnline) {
        notificationApi.createNotification({ title, message, type, metadata }).catch(() => {});
      }
    } catch (err) {
      // Handled gracefully
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addLocalNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
