// src/api/axiosInstance.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";

    const baseURL = import.meta.env.VITE_BASE_URL as string;

    const apiClient: AxiosInstance = axios.create({
      baseURL,
      withCredentials: true,
    });

    // Request interceptor 
    apiClient.interceptors.request.use(
      (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => { 
        const token = localStorage.getItem(import.meta.env.VITE_ACCESS_KEY);
        if (token && config.headers) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    // Response interceptor 
    apiClient.interceptors.response.use(
      (response: AxiosResponse): AxiosResponse => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
        
          try {
            const res = await axios.post<{ accessToken: string }>(
              `${baseURL}/refresh/token`,
              {},
              { withCredentials: true }
            );
          
            const newAccessToken = res.data.accessToken;
            localStorage.setItem(import.meta.env.VITE_ACCESS_KEY, newAccessToken);
          
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            }
          
            return apiClient(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem(import.meta.env.VITE_ACCESS_KEY);
            window.location.href = "/signin";
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    // public endpoints
    const publicApi = axios.create({
      baseURL, 
      withCredentials: true,
    });

export { apiClient, publicApi };
