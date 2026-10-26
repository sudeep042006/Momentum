import apiClient from './apiClient';

export const journalApi = {
  getJournals: () => apiClient.get('/api/journals'),
  getJournalById: (id) => apiClient.get(`/api/journals/${id}`),
  createJournal: (data) => apiClient.post('/api/journals', data),
  updateJournal: (id, data) => apiClient.put(`/api/journals/${id}`, data),
  deleteJournal: (id) => apiClient.delete(`/api/journals/${id}`),
  uploadImage: (formData) =>
    apiClient.post('/api/journals/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 35000,
    }),
};
