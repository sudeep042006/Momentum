import axios from 'axios';
import { cacheManager } from '../storage/cacheManager';

// Endpoints
export const PRIMARY_API_URL = 'https://momentum-vh06.onrender.com';
export const FALLBACK_API_URL = 'https://momentum-jdcd.onrender.com';
export const LOCAL_ANDROID_API_URL = 'http://10.0.2.2:5000';

let activeBaseUrl = PRIMARY_API_URL;

const apiClient = axios.create({
  baseURL: activeBaseUrl,
  timeout: 15000,
});

apiClient.interceptors.request.use(
  async (config) => {
    config.baseURL = activeBaseUrl;
    const token = await cacheManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Token Refresh & Failover Queue
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // 1. Failover on network error or 5xx
    const isNetworkOrServerError = !error.response || error.response.status >= 500;
    originalRequest._retryCount = originalRequest._retryCount || 0;

    if (isNetworkOrServerError && originalRequest._retryCount < 2) {
      originalRequest._retryCount++;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return apiClient.request(originalRequest);
    }

    if (isNetworkOrServerError && !originalRequest._failedOver && FALLBACK_API_URL) {
      originalRequest._failedOver = true;
      originalRequest._retryCount = 0;
      activeBaseUrl = activeBaseUrl === PRIMARY_API_URL ? FALLBACK_API_URL : PRIMARY_API_URL;
      originalRequest.baseURL = activeBaseUrl;
      return apiClient.request(originalRequest);
    }

    // 2. Token Refresh on 401
    if (error.response?.status === 401 && !originalRequest._retryAuth) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient.request(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retryAuth = true;
      isRefreshing = true;

      try {
        const refreshToken = await cacheManager.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token available');

        const refreshRes = await axios.post(
          `${activeBaseUrl}/api/users/refresh`,
          { refresh_token: refreshToken },
          { timeout: 30000 }
        );

        const newAccessToken = refreshRes.data?.data?.session?.access_token;
        const newRefreshToken = refreshRes.data?.data?.session?.refresh_token;

        if (newAccessToken) {
          await cacheManager.setToken(newAccessToken);
          if (newRefreshToken) await cacheManager.setRefreshToken(newRefreshToken);

          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient.request(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // ONLY clear auth if refresh endpoint explicitly returned 400 or 401 (token truly invalid or expired)
        // If it was a network timeout, offline state, or 5xx cold start, DO NOT log the user out!
        const status = refreshErr.response?.status;
        if (status === 401 || status === 400) {
          await cacheManager.clearAuth();
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
