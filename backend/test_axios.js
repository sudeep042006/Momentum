import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000'
});

api.interceptors.response.use(
    res => res,
    async err => {
        console.log("Error config URL:", err.config.url);
        console.log("Error config baseURL:", err.config.baseURL);
        return Promise.reject(err);
    }
);

api.get('/api/test').catch(() => {});
