import { apiClient } from './api';
import { ApiResponse, UserRole } from '../types/auth';
import {
  AdminOverviewStats,
  AdminUserSummary,
  AdminPlaceSummary,
  AdminPlaceUpdateRequest,
  DuplicatePlaceCandidate,
  PlatformSetting,
  DataImportHistory,
  DataManagementOverview,
  AdminAuditLog,
} from '../types/admin';
import { PlaceOwnership } from '../types/accessibility';

export interface PagedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const adminService = {
  /**
   * Retrieves overall database-driven statistics and recent activity logs.
   */
  async getOverviewStats(): Promise<AdminOverviewStats> {
    const response = await apiClient.get<ApiResponse<AdminOverviewStats>>('/api/v1/admin/overview');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch dashboard statistics');
    }
    return response.data.data;
  },

  /**
   * Retrieves paginated users with optional search and filters.
   */
  async getUsers(params?: {
    search?: string;
    role?: UserRole;
    isEnabled?: boolean;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<AdminUserSummary>> {
    const response = await apiClient.get<ApiResponse<PagedResponse<AdminUserSummary>>>(
      '/api/v1/admin/users',
      { params }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch users');
    }
    return response.data.data;
  },

  /**
   * Retrieves detailed profile for a specific user.
   */
  async getUserDetails(userId: string): Promise<AdminUserSummary> {
    const response = await apiClient.get<ApiResponse<AdminUserSummary>>(`/api/v1/admin/users/${userId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch user details');
    }
    return response.data.data;
  },

  /**
   * Toggles active/suspended status of a user account.
   */
  async updateUserStatus(userId: string, isEnabled: boolean, reason?: string): Promise<AdminUserSummary> {
    const response = await apiClient.patch<ApiResponse<AdminUserSummary>>(
      `/api/v1/admin/users/${userId}/status`,
      { isEnabled, reason }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update user account status');
    }
    return response.data.data;
  },

  /**
   * Modifies an authorized role for a user.
   */
  async updateUserRole(userId: string, role: UserRole, reason?: string): Promise<AdminUserSummary> {
    const response = await apiClient.patch<ApiResponse<AdminUserSummary>>(
      `/api/v1/admin/users/${userId}/role`,
      { role, reason }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update user role');
    }
    return response.data.data;
  },

  /**
   * Retrieves paginated places with search and regional filters.
   */
  async getPlaces(params?: {
    search?: string;
    category?: string;
    city?: string;
    state?: string;
    isActive?: boolean;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<AdminPlaceSummary>> {
    const response = await apiClient.get<ApiResponse<PagedResponse<AdminPlaceSummary>>>(
      '/api/v1/admin/places',
      { params }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch places');
    }
    return response.data.data;
  },

  /**
   * Retrieves full details for a place.
   */
  async getPlaceDetails(placeId: string): Promise<AdminPlaceSummary> {
    const response = await apiClient.get<ApiResponse<AdminPlaceSummary>>(`/api/v1/admin/places/${placeId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch place details');
    }
    return response.data.data;
  },

  /**
   * Toggles the active status of a venue.
   */
  async updatePlaceStatus(placeId: string, isActive: boolean, reason?: string): Promise<AdminPlaceSummary> {
    const response = await apiClient.patch<ApiResponse<AdminPlaceSummary>>(
      `/api/v1/admin/places/${placeId}/status`,
      null,
      { params: { isActive, reason } }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update place status');
    }
    return response.data.data;
  },

  /**
   * Updates core place metadata (address, phone, name, category).
   */
  async updatePlace(placeId: string, payload: AdminPlaceUpdateRequest): Promise<AdminPlaceSummary> {
    const response = await apiClient.put<ApiResponse<AdminPlaceSummary>>(
      `/api/v1/admin/places/${placeId}`,
      payload
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update place metadata');
    }
    return response.data.data;
  },

  /**
   * Detects duplicate location candidates for a given venue.
   */
  async getDuplicateCandidates(placeId: string): Promise<DuplicatePlaceCandidate[]> {
    const response = await apiClient.get<ApiResponse<DuplicatePlaceCandidate[]>>(
      `/api/v1/admin/places/${placeId}/duplicates`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch duplicate candidates');
    }
    return response.data.data;
  },

  /**
   * Lists business ownership claims.
   */
  async getBusinessClaims(params?: {
    isVerified?: boolean;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<PlaceOwnership>> {
    const response = await apiClient.get<ApiResponse<PagedResponse<PlaceOwnership>>>(
      '/api/v1/admin/business-claims',
      { params }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch business claims');
    }
    return response.data.data;
  },

  /**
   * Approves or rejects a business ownership claim.
   */
  async verifyBusinessClaim(claimId: string, approved: boolean, reason?: string): Promise<PlaceOwnership> {
    const response = await apiClient.post<ApiResponse<PlaceOwnership>>(
      `/api/v1/admin/business-claims/${claimId}/verify`,
      null,
      { params: { approved, reason } }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to verify business claim');
    }
    return response.data.data;
  },

  /**
   * Retrieves geographical data management overview.
   */
  async getDataManagementOverview(): Promise<DataManagementOverview> {
    const response = await apiClient.get<ApiResponse<DataManagementOverview>>(
      '/api/v1/admin/data-management/overview'
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch data management status');
    }
    return response.data.data;
  },

  /**
   * Retrieves data import history.
   */
  async getDataImportHistory(page = 0, size = 20): Promise<PagedResponse<DataImportHistory>> {
    const response = await apiClient.get<ApiResponse<PagedResponse<DataImportHistory>>>(
      '/api/v1/admin/data-management/history',
      { params: { page, size } }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch import history');
    }
    return response.data.data;
  },

  /**
   * Triggers an authorized bounded OpenStreetMap import.
   */
  async triggerRegionalImport(payload: {
    region: string;
    south: number;
    west: number;
    north: number;
    east: number;
    categories?: string[];
  }): Promise<{ importedCount: number; skippedCount: number; failedCount: number; message: string }> {
    const response = await apiClient.post<ApiResponse<any>>(
      '/api/v1/admin/data-management/import',
      null,
      { params: payload }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Regional import failed to complete');
    }
    return response.data.data;
  },

  /**
   * Retrieves platform audit logs with resource and action filters.
   */
  async getAuditLogs(params?: {
    resourceType?: string;
    action?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<AdminAuditLog>> {
    const response = await apiClient.get<ApiResponse<PagedResponse<AdminAuditLog>>>(
      '/api/v1/admin/audit-logs',
      { params }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch audit logs');
    }
    return response.data.data;
  },

  /**
   * Retrieves platform configuration settings.
   */
  async getSettings(): Promise<PlatformSetting[]> {
    const response = await apiClient.get<ApiResponse<PlatformSetting[]>>('/api/v1/admin/settings');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch platform settings');
    }
    return response.data.data;
  },

  /**
   * Updates a platform configuration setting.
   */
  async updateSetting(key: string, value: string): Promise<PlatformSetting> {
    const response = await apiClient.put<ApiResponse<PlatformSetting>>(
      `/api/v1/admin/settings/${key}`,
      { value }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update platform setting');
    }
    return response.data.data;
  },
};

