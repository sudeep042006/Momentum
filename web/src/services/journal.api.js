import apiClient from './apiClient';

export const getJournals = async () => {
  return await apiClient.get('/api/journals');
};

export const createJournal = async (journalData) => {
  return await apiClient.post('/api/journals', journalData);
};

export const updateJournal = async (id, journalData) => {
  return await apiClient.put(`/api/journals/${id}`, journalData);
};

export const deleteJournal = async (id) => {
  return await apiClient.delete(`/api/journals/${id}`);
};
