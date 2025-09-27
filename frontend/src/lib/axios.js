import axios from "axios";
import { useLoadingStore } from '../store/useLoadingStore';

export const axiosInstance = axios.create({
    baseURL: "http://localhost:5001/api",
    withCredentials: true,
});

// Smart global loading interceptors
axiosInstance.interceptors.request.use(
    (config) => {
        try { useLoadingStore.getState().start(); } catch (_) {}
        return config;
    },
    (error) => {
        try { useLoadingStore.getState().stop(); } catch (_) {}
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        try { useLoadingStore.getState().stop(); } catch (_) {}
        return response;
    },
    (error) => {
        try { useLoadingStore.getState().stop(); } catch (_) {}
        return Promise.reject(error);
    }
);