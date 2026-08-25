import axios from 'axios';

const primaryUrl = import.meta.env.VITE_BACKEND_API;
const fallbackUrl = import.meta.env.VITE_FALLBACK_BACKEND_API;

let activeUrl = primaryUrl;

const apiClient = axios.create({
  baseURL: activeUrl,
});

apiClient.interceptors.request.use(
  (config) => {
    // Ensure the request uses the current active URL
    config.baseURL = activeUrl;

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for automatic token refreshing and failover
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
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

    // 1. Failover and Retry logic: Handle network errors and 5xx server errors
    const isNetworkOrServerError = !error.response || error.response.status >= 500;

    originalRequest._retryCount = originalRequest._retryCount || 0;

    if (isNetworkOrServerError) {
      if (originalRequest._retryCount < 2) {
        originalRequest._retryCount++;
        console.warn(`API request failed, retrying attempt ${originalRequest._retryCount} for ${originalRequest.url}`);
        
        // Wait before retrying (Render cold start)
        await new Promise(resolve => setTimeout(resolve, 2500));
        return apiClient.request(originalRequest);
      } 
      
      if (!originalRequest._failedOver && fallbackUrl) {
        // Exhausted retries on current URL. Failover.
        originalRequest._failedOver = true;
        originalRequest._retryCount = 0; // Reset retries for the new URL

        if (activeUrl === primaryUrl) {
          activeUrl = fallbackUrl;
          console.warn(`Primary API failed completely, switching to fallback URL: ${activeUrl}`);
        }

        // Guarantee we strip the old absolute URL prefix so Axios uses the new baseURL
        let relativeUrl = originalRequest.url;
        if (primaryUrl && relativeUrl.startsWith(primaryUrl)) relativeUrl = relativeUrl.substring(primaryUrl.length);
        if (fallbackUrl && relativeUrl.startsWith(fallbackUrl)) relativeUrl = relativeUrl.substring(fallbackUrl.length);
        
        originalRequest.url = relativeUrl;
        originalRequest.baseURL = activeUrl;

        return apiClient.request(originalRequest);
      }

      // Exhausted all retries and failovers
      return Promise.reject(error);
    }

    // 2. Token Refresh logic
    if (error.response && error.response.status === 401 && !originalRequest._retryAuth) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return apiClient.request(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retryAuth = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${activeUrl}/api/users/refresh`, { refresh_token: refreshToken });

          if (res.data?.data?.session) {
            const newAccessToken = res.data.data.session.access_token;
            const newRefreshToken = res.data.data.session.refresh_token;

            localStorage.setItem('token', newAccessToken);
            localStorage.setItem('refresh_token', newRefreshToken);

            apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            processQueue(null, newAccessToken);
            return apiClient.request(originalRequest);
          }
        } catch (refreshError) {
          console.error("Refresh token failed", refreshError);
          processQueue(refreshError, null);
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
