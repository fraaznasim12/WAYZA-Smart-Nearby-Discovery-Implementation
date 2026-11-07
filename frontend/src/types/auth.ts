/**
 * Authentication and User Role Domain Types for AccessMap.
 * Accurately mirrors backend DTOs and Enums from com.accessmap.
 */

export type UserRole =
  | 'ROLE_USER'
  | 'ROLE_CONTRIBUTOR'
  | 'ROLE_BUSINESS'
  | 'ROLE_BUSINESS_OWNER'
  | 'ROLE_ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  memberSince?: string;
  avatarUrl?: string | null;
}

export interface AuthResponseData {
  token: string;
  tokenType: string;
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string> | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiError | null;
  timestamp: string;
}

export interface RegisterRequestData {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequestData {
  email: string;
  password: string;
}

