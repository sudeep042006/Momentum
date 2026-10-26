import React, { createContext, useContext, useState, useCallback } from 'react';
import { cacheManager } from '../storage/cacheManager';
import { syncQueue } from '../storage/syncQueue';
import { taskApi } from '../api/taskApi';
import { networkMonitor } from '../sync/networkMonitor';
import { getTodayDateString } from '../utils/dateUtils';

const TaskContext = createContext({
  tasks: [],
  isLoading: false,
  fetchTasks: async () => {},
  addTask: async () => {},
  toggleTask: async () => {},
  deleteTask: async () => {},
  cloneTasks: async () => {},
});

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTasks = useCallback(async (date = getTodayDateString()) => {
    setIsLoading(true);
    try {
      // 1. Instant Cache Read (0ms latency)
      const cached = await cacheManager.getTasks(date);
      if (cached && Array.isArray(cached)) {
        setTasks(cached);
      }

      // 2. Revalidate if online
      const isOnline = await networkMonitor.checkConnection();
      if (isOnline) {
        const res = await taskApi.getTasks(date);
        const serverTasks = res.data?.data || [];
        setTasks(serverTasks);
        await cacheManager.setTasks(date, serverTasks);
      }
    } catch (e) {
      console.warn('Task fetch error (using cached):', e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTask = async (taskData) => {
    const today = getTodayDateString();
    const tempId = `local_${Date.now()}`;
    const newTask = {
      _id: tempId,
      date: today,
      status: 'pending',
      priority: 'medium',
      category: 'work',
      ...taskData,
      isLocal: true,
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update
    const updated = [newTask, ...tasks];
    setTasks(updated);
    await cacheManager.setTasks(today, updated);

    // Network / Queue handling
    const isOnline = await networkMonitor.checkConnection();
    if (isOnline) {
      try {
        const res = await taskApi.createTask(taskData);
        const serverTask = res.data?.data;
        if (serverTask) {
          const reconciled = updated.map((t) => (t._id === tempId ? serverTask : t));
          setTasks(reconciled);
          await cacheManager.setTasks(today, reconciled);
          return serverTask;
        }
      } catch (err) {
        console.warn('Online task creation failed, queuing offline:', err.message);
        await syncQueue.enqueue({
          endpoint: '/api/tasks',
          method: 'POST',
          payload: taskData,
        });
      }
    } else {
      await syncQueue.enqueue({
        endpoint: '/api/tasks',
        method: 'POST',
        payload: taskData,
      });
    }

    return newTask;
  };

  const toggleTask = async (task) => {
    const today = task.date || getTodayDateString();
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updated = tasks.map((t) =>
      t._id === task._id ? { ...t, status: newStatus } : t
    );

    // Optimistic UI update
    setTasks(updated);
    await cacheManager.setTasks(today, updated);

    // Skip network if it's purely a local unsynced item
    if (task.isLocal) {
      return;
    }

    const payload = {
      status: newStatus,
      priority: task.priority,
      category: task.category,
      title: task.title,
    };

    const isOnline = await networkMonitor.checkConnection();
    if (isOnline) {
      try {
        await taskApi.updateTask(task._id, payload);
      } catch (err) {
        console.warn('Online update failed, queuing offline:', err.message);
        await syncQueue.enqueue({
          endpoint: `/api/tasks/${task._id}`,
          method: 'PUT',
          payload,
        });
      }
    } else {
      await syncQueue.enqueue({
        endpoint: `/api/tasks/${task._id}`,
        method: 'PUT',
        payload,
      });
    }
  };

  const deleteTask = async (taskId) => {
    const today = getTodayDateString();
    const target = tasks.find((t) => t._id === taskId);
    const updated = tasks.filter((t) => t._id !== taskId);

    // Optimistic UI update
    setTasks(updated);
    await cacheManager.setTasks(today, updated);

    if (target?.isLocal) {
      return;
    }

    const isOnline = await networkMonitor.checkConnection();
    if (isOnline) {
      try {
        await taskApi.deleteTask(taskId);
      } catch (err) {
        console.warn('Online delete failed, queuing offline:', err.message);
        await syncQueue.enqueue({
          endpoint: `/api/tasks/${taskId}`,
          method: 'DELETE',
        });
      }
    } else {
      await syncQueue.enqueue({
        endpoint: `/api/tasks/${taskId}`,
        method: 'DELETE',
      });
    }
  };

  const cloneTasks = async (fromDate, toDate) => {
    setIsLoading(true);
    try {
      const res = await taskApi.cloneTasks(fromDate, toDate);
      if (res.data?.data) {
        await fetchTasks(toDate);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoading,
        fetchTasks,
        addTask,
        toggleTask,
        deleteTask,
        cloneTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export const useTasks = () => useContext(TaskContext);
