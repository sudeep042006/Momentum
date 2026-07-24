import apiClient from './apiClient';

export const getTasks = () => apiClient.get('/api/tasks');
export const createTask = (taskData) => apiClient.post('/api/tasks', taskData);
export const updateTask = (id, taskData) => apiClient.put(`/api/tasks/${id}`, taskData);
export const deleteTask = (id) => apiClient.delete(`/api/tasks/${id}`);
