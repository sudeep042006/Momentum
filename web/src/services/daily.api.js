import apiClient from './apiClient';

export const getHeatmap = (startDate, endDate) => {
    let url = '/api/daily-activity/heatmap';
    if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return apiClient.get(url);
};

export const getDashboardStats = () => apiClient.get('/api/daily-activity/stats');
