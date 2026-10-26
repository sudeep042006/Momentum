import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationApi } from '../api/notificationApi';
import { cacheManager } from '../storage/cacheManager';
import { networkMonitor } from '../sync/networkMonitor';
import { showSystemNotification } from '../services/systemNotificationService';

import { localStorage } from '../storage/localStorage';

const NOTIFIED_IDS_KEY = 'momentum_shown_system_notifs';

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
  const notifiedIdsRef = useRef(new Set());

  // Load already posted notification IDs from storage on launch
  useEffect(() => {
    (async () => {
      try {
        const stored = await localStorage.getItem(NOTIFIED_IDS_KEY);
        if (Array.isArray(stored)) {
          stored.forEach((id) => notifiedIdsRef.current.add(id));
        }
      } catch (e) {
        // Safe fallback
      }
    })();
  }, []);

  const recordNotifiedId = async (id) => {
    if (!id) return;
    notifiedIdsRef.current.add(id);
    try {
      const arr = Array.from(notifiedIdsRef.current);
      if (arr.length > 80) arr.splice(0, arr.length - 80);
      await localStorage.setItem(NOTIFIED_IDS_KEY, arr);
    } catch (e) {
      // Safe fallback
    }
  };

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

          // Post unread alerts to Android notification bar ONLY ONCE
          serverList.forEach((n) => {
            const notifId = n._id || n.id;
            if (!n.isRead && notifId && !notifiedIdsRef.current.has(notifId)) {
              recordNotifiedId(notifId);
              const actionType = n.type === 'milestone'
                ? 'MILESTONES'
                : n.type === 'task' || n.type === 'streak'
                ? 'TASKS'
                : n.type === 'update'
                ? 'UPDATE'
                : 'NOTIFICATIONS';
              showSystemNotification(n.title, n.message, undefined, actionType, n.metadata || {});
            }
          });
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

  const markAsRead = useCallback(async (id) => {
    try {
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          (n._id === id || n.id === id) ? { ...n, isRead: true } : n
        );
        setUnreadCount(calculateUnread(updated));
        cacheManager.setNotifications(updated);
        return updated;
      });

      const isOnline = await networkMonitor.checkConnection();
      if (isOnline) {
        await notificationApi.markAsRead(id);
      }
    } catch (err) {
      // Handled gracefully
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      setNotifications((prev) => {
        const updated = prev.map((n) => ({ ...n, isRead: true }));
        setUnreadCount(0);
        cacheManager.setNotifications(updated);
        return updated;
      });

      const isOnline = await networkMonitor.checkConnection();
      if (isOnline) {
        await notificationApi.markAllAsRead();
      }
    } catch (err) {
      // Handled gracefully
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      setNotifications((prev) => {
        const updated = prev.filter((n) => n._id !== id && n.id !== id);
        setUnreadCount(calculateUnread(updated));
        cacheManager.setNotifications(updated);
        return updated;
      });

      const isOnline = await networkMonitor.checkConnection();
      if (isOnline) {
        await notificationApi.deleteNotification(id);
      }
    } catch (err) {
      // Handled gracefully
    }
  }, []);

  const clearAll = useCallback(async () => {
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
  }, []);

  const notificationsRef = useRef([]);
  notificationsRef.current = notifications;

  const addLocalNotification = useCallback(async ({ title, message, type = 'system', metadata = {} }) => {
    try {
      const currentList = notificationsRef.current || [];
      const exactExists = currentList.some((n) => n.title === title && n.type === type);
      if (exactExists) {
        return; // Avoid duplicate alerts
      }

      const newNotif = {
        _id: 'local_' + Date.now(),
        title,
        message,
        type,
        isRead: false,
        metadata,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => {
        // For 'update' alerts, replace older version update notifications with the latest one
        let filtered = prev;
        if (type === 'update') {
          filtered = prev.filter((n) => n.type !== 'update');
        }
        const updated = [newNotif, ...filtered];
        setUnreadCount(calculateUnread(updated));
        cacheManager.setNotifications(updated);
        return updated;
      });

      // Post directly to Android status / notification bar
      recordNotifiedId(newNotif._id);
      const actionType = type === 'milestone'
        ? 'MILESTONES'
        : type === 'task' || type === 'streak'
        ? 'TASKS'
        : type === 'update'
        ? 'UPDATE'
        : 'NOTIFICATIONS';
      showSystemNotification(title, message, undefined, actionType, metadata || {});

      const isOnline = await networkMonitor.checkConnection();
      if (isOnline) {
        notificationApi.createNotification({ title, message, type, metadata }).catch(() => {});
      }
    } catch (err) {
      // Handled gracefully
    }
  }, []);

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
