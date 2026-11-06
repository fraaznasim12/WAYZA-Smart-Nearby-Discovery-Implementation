import { apiClient, setAuthToken } from './api';
import {
  ApiResponse,
  AuthResponseData,
  LoginRequestData,
  RegisterRequestData,
  UserProfile,
} from '../types/auth';

/**
 * Authentication Service connecting to Spring Boot REST endpoints:
 * - POST /api/v1/auth/register
 * - POST /api/v1/auth/login
 * - GET  /api/v1/auth/me
 */
export const authService = {
  /**
   * Registers a new user account with ROLE_USER.
   */
  async register(data: RegisterRequestData): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>(
      '/api/v1/auth/register',
      data
    );
    const authData = response.data.data;
    setAuthToken(authData.token);
    return authData;
  },

  /**
   * Authenticates an existing user and retrieves a signed JWT token.
   */
  async login(credentials: LoginRequestData): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>(
      '/api/v1/auth/login',
      credentials
    );
    const authData = response.data.data;
    setAuthToken(authData.token);
    return authData;
  },

  /**
   * Fetches the current authenticated user's profile from /api/v1/auth/me.
   */
  async getCurrentUser(): Promise<UserProfile> {
    const response = await apiClient.get<ApiResponse<UserProfile>>('/api/v1/auth/me');
    return response.data.data;
  },

  /**
   * Clears the in-memory token on client-side logout.
   * Stateless JWT requires no server session invalidation.
   */
  logout(): void {
    setAuthToken(null);
  },
};

