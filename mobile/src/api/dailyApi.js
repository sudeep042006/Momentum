import apiClient from './apiClient';

export const dailyApi = {
  getHeatmap: (startDate, endDate) => {
    let start = startDate;
    let end = endDate;
    if (!start || !end) {
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setDate(today.getDate() - 365);
      start = oneYearAgo.toISOString().split('T')[0];
      end = today.toISOString().split('T')[0];
    }
    return apiClient.get(`/api/daily-activity/heatmap?startDate=${start}&endDate=${end}`);
  },
  getDashboardStats: () => apiClient.get('/api/daily-activity/stats'),
};
