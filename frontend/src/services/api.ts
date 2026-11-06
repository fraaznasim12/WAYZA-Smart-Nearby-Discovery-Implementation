import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types/auth';

/**
 * Global API Client configured with the Spring Boot backend base URL.
 * Defaults to http://localhost:8080 if VITE_API_BASE_URL is not defined.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * In-memory storage for the active JWT token.
 * SECURITY: Access tokens are held in-memory to prevent XSS exfiltration from Web Storage.
 */
let inMemoryToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  inMemoryToken = token;
};

export const getAuthToken = (): string | null => {
  return inMemoryToken;
};

// Request Interceptor: Injects the Authorization Bearer header if a token exists
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (inMemoryToken && config.headers) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extracts backend ApiResponse envelopes or formats network errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (!error.response) {
      // Network error or server offline
      return Promise.reject(new Error('Unable to connect to AccessMap backend. Please check your network or server status.'));
    }
    return Promise.reject(error);
  }
);

