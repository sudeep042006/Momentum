import apiClient from './apiClient';

export const getHeatmap = (startDate, endDate) => 
  apiClient.get(`/api/daily-activity/heatmap`, { params: { startDate, endDate } });
