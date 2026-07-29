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
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 1. Failover logic: If network error or 5xx server error, and we haven't failed over yet
    const isNetworkOrServerError = !error.response || error.response.status >= 500;
    
    if (isNetworkOrServerError && !originalRequest._failedOver && fallbackUrl) {
      originalRequest._failedOver = true; // Mark as failed over to prevent infinite loops
      
      // Switch active URL to the other one
      activeUrl = (activeUrl === primaryUrl) ? fallbackUrl : primaryUrl;
      console.warn(`API request failed, switching to fallback URL: ${activeUrl}`);
      
      // Update the base URL for this specific request
      originalRequest.baseURL = activeUrl;
      
      // We must remove the full URL from the original request config so it re-uses the new baseURL
      if (originalRequest.url && originalRequest.url.startsWith('http')) {
        const oldUrl = activeUrl === primaryUrl ? fallbackUrl : primaryUrl;
        originalRequest.url = originalRequest.url.replace(oldUrl, activeUrl);
      }

      try {
        // Retry the request with the new baseURL
        return await axios(originalRequest);
      } catch (retryError) {
        // If it fails again, reject the promise
        return Promise.reject(retryError);
      }
    }

    // 2. Token Refresh logic
    // If error is 401 and we haven't retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          // Attempt to refresh the token using activeUrl
          const res = await axios.post(`${activeUrl}/api/users/refresh`, { refresh_token: refreshToken });
          
          if (res.data?.data?.session) {
            const newAccessToken = res.data.data.session.access_token;
            const newRefreshToken = res.data.data.session.refresh_token;
            
            localStorage.setItem('token', newAccessToken);
            localStorage.setItem('refresh_token', newRefreshToken);
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails, log them out
          console.error("Refresh token failed", refreshError);
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        // No refresh token available, standard logout
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
