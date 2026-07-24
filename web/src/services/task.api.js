import apiClient from './apiClient';

export const getTasks = (date) => {
    const url = date ? `/api/tasks?date=${date}` : '/api/tasks';
    return apiClient.get(url);
};
export const createTask = (taskData) => apiClient.post('/api/tasks', taskData);
export const updateTask = (id, taskData) => apiClient.put(`/api/tasks/${id}`, taskData);
export const deleteTask = (id) => apiClient.delete(`/api/tasks/${id}`);
export const cloneTasks = (fromDate, toDate) => apiClient.post('/api/tasks/clone', { fromDate, toDate });
