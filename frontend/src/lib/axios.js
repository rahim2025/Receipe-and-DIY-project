import axios from "axios";
import { useLoadingStore } from '../store/useLoadingStore';

export const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL ,
    withCredentials: true,
    timeout: 10000, // 10 second timeout
});

// Smart global loading interceptors
axiosInstance.interceptors.request.use(
    (config) => {
        try { 
            useLoadingStore.getState().start(); 
            
            // Add token from localStorage as backup for cross-origin issues
            const token = localStorage.getItem('jwt-token');
            if (token && !config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            
            // For FormData, don't set Content-Type (let browser handle boundary)
            if (config.data instanceof FormData) {
                delete config.headers['Content-Type'];
            }
        } catch (_) {}
        return config;
    },
    (error) => {
        try { useLoadingStore.getState().stop(); } catch (_) {}
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        try { 
            useLoadingStore.getState().stop();
            
            // Store token from response if available (for login/signup)
            const token = response.headers['authorization'] || response.data?.token;
            if (token) {
                localStorage.setItem('jwt-token', token.replace('Bearer ', ''));
            }
            
            console.log('Response interceptor - status:', response.status, 'data:', response.data);
        } catch (error) {
            console.error('Error in response interceptor:', error);
        }
        return response;
    },
    (error) => {
        try { 
            useLoadingStore.getState().stop();
            
            console.error('Error interceptor triggered:', error);
            console.error('Error response:', error.response);
            
            // If 401, clear stored token and redirect to login
            if (error.response?.status === 401) {
                localStorage.removeItem('jwt-token');
                // Optional: redirect to login page
                // window.location.href = '/login';
            }
        } catch (e) {
            console.error('Error in error interceptor:', e);
        }
        return Promise.reject(error);
    }
);