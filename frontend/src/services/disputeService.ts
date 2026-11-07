import { apiClient } from './api';
import { ApiResponse } from '../types/auth';
import {
  Dispute,
  DisputeCreatePayload,
  DisputePhoto,
  DisputeStatus,
  DisputeStatusUpdatePayload,
  PlaceFreshness,
} from '../types/dispute';

export interface PagedDisputesResponse {
  content: Dispute[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
}

export const disputeService = {
  /**
   * Submits a community dispute regarding accessibility information or report outcomes.
   * Supports multipart/form-data when camera or gallery images are attached.
   */
  async submitDispute(payload: DisputeCreatePayload, files?: File[]): Promise<Dispute> {
    if (files && files.length > 0) {
      const formData = new FormData();
      const disputeBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      formData.append('dispute', disputeBlob);

      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await apiClient.post<ApiResponse<Dispute>>(
        '/api/v1/disputes',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to submit dispute with evidence photos');
      }
      return response.data.data;
    } else {
      const response = await apiClient.post<ApiResponse<Dispute>>(
        '/api/v1/disputes',
        payload
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to submit dispute');
      }
      return response.data.data;
    }
  },

  /**
   * Uploads an individual photo to an existing dispute.
   */
  async uploadDisputePhoto(disputeId: string, file: File, caption?: string): Promise<DisputePhoto> {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) formData.append('caption', caption);

    const response = await apiClient.post<ApiResponse<DisputePhoto>>(
      `/api/v1/disputes/${disputeId}/photos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to upload photo to dispute');
    }
    return response.data.data;
  },

  /**
   * Retrieves all disputes submitted by the authenticated user.
   */
  async getMyDisputes(): Promise<Dispute[]> {
    const response = await apiClient.get<ApiResponse<Dispute[]>>('/api/v1/disputes/me');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to load your disputes');
    }
    return response.data.data;
  },

  /**
   * Retrieves full dispute details by ID.
   */
  async getDisputeById(disputeId: string): Promise<Dispute> {
    const response = await apiClient.get<ApiResponse<Dispute>>(`/api/v1/disputes/${disputeId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to load dispute');
    }
    return response.data.data;
  },

  /**
   * Admin: Retrieves paginated disputes queue with optional status filter.
   */
  async getAdminDisputes(status?: DisputeStatus | 'ALL', page: number = 0, size: number = 20): Promise<PagedDisputesResponse> {
    const response = await apiClient.get<ApiResponse<PagedDisputesResponse>>('/api/v1/admin/disputes', {
      params: {
        status: status && status !== 'ALL' ? status : undefined,
        page,
        size,
      },
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to load admin disputes queue');
    }
    return response.data.data;
  },

  /**
   * Admin: Updates dispute resolution status with decision notes and optional profile correction.
   */
  async updateDisputeStatus(disputeId: string, payload: DisputeStatusUpdatePayload): Promise<Dispute> {
    const response = await apiClient.patch<ApiResponse<Dispute>>(
      `/api/v1/admin/disputes/${disputeId}/status`,
      payload
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to resolve dispute');
    }
    return response.data.data;
  },

  /**
   * Admin: Assigns a dispute to a moderator for investigation.
   */
  async assignDispute(disputeId: string, reviewerId: string, notes?: string): Promise<Dispute> {
    const response = await apiClient.post<ApiResponse<Dispute>>(
      `/api/v1/admin/disputes/${disputeId}/assign`,
      null,
      { params: { reviewerId, notes } }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to assign dispute reviewer');
    }
    return response.data.data;
  },

  /**
   * Retrieves freshness audit analysis for a place.
   */
  async getPlaceFreshness(placeId: string, thresholdDays: number = 90): Promise<PlaceFreshness> {
    const response = await apiClient.get<ApiResponse<PlaceFreshness>>(
      `/api/v1/places/${placeId}/freshness`,
      { params: { thresholdDays } }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch freshness report');
    }
    return response.data.data;
  },
};

