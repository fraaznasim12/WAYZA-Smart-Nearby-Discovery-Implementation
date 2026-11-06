import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  AuthResponseData,
  LoginRequestData,
  RegisterRequestData,
  UserProfile,
} from '../types/auth';
import { authService } from '../services/authService';
import { getAuthToken } from '../services/api';
import { AxiosError } from 'axios';
import { ApiResponse } from '../types/auth';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  login: (credentials: LoginRequestData) => Promise<AuthResponseData>;
  register: (data: RegisterRequestData) => Promise<AuthResponseData>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (credentials: LoginRequestData): Promise<AuthResponseData> => {
    setIsLoading(true);
    setError(null);
    try {
      const authData = await authService.login(credentials);
      setTokenState(authData.token);
      setUser({
        id: authData.userId,
        email: authData.email,
        fullName: authData.fullName,
        role: authData.role,
      });
      return authData;
    } catch (err: unknown) {
      let message = 'Login failed. Please check your credentials.';
      if (err instanceof AxiosError && err.response?.data) {
        const apiResponse = err.response.data as ApiResponse<unknown>;
        message = apiResponse.error?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequestData): Promise<AuthResponseData> => {
    setIsLoading(true);
    setError(null);
    try {
      const authData = await authService.register(data);
      setTokenState(authData.token);
      setUser({
        id: authData.userId,
        email: authData.email,
        fullName: authData.fullName,
        role: authData.role,
      });
      return authData;
    } catch (err: unknown) {
      let message = 'Registration failed. Please check your information.';
      if (err instanceof AxiosError && err.response?.data) {
        const apiResponse = err.response.data as ApiResponse<unknown>;
        message = apiResponse.error?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setTokenState(null);
    setUser(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      error,
      clearError,
      login,
      register,
      logout,
    }),
    [user, token, isLoading, error, clearError, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

