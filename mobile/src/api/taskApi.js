import apiClient from './apiClient';

export const taskApi = {
  getTasks: (date) => {
    const url = date ? `/api/tasks?date=${date}` : '/api/tasks';
    return apiClient.get(url);
  },
  createTask: (taskData) => apiClient.post('/api/tasks', taskData),
  updateTask: (id, taskData) => apiClient.put(`/api/tasks/${id}`, taskData),
  deleteTask: (id) => apiClient.delete(`/api/tasks/${id}`),
  cloneTasks: (fromDate, toDate) => apiClient.post('/api/tasks/clone', { fromDate, toDate }),
};
