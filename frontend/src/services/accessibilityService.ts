import { apiClient } from './api';
import { ApiResponse } from '../types/auth';
import {
  AccessibilityProfile,
  AccessibilitySummary,
  FeatureDefinition,
  ObservationSubmission,
  ObservationSubmitPayload,
  ObservationReviewPayload,
  PlaceOwnership,
} from '../types/accessibility';

export interface PagedObservationsResponse {
  content: ObservationSubmission[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export const accessibilityService = {
  /**
   * Retrieves all 21 standardized accessibility feature definitions from the catalogue.
   */
  async getFeatureCatalog(): Promise<FeatureDefinition[]> {
    const response = await apiClient.get<ApiResponse<FeatureDefinition[]>>('/api/v1/accessibility/features');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to load feature catalogue');
    }
    return response.data.data;
  },

  /**
   * Retrieves the comprehensive four-state accessibility profile for a place.
   */
  async getPlaceAccessibility(placeId: string): Promise<AccessibilityProfile> {
    const response = await apiClient.get<ApiResponse<AccessibilityProfile>>(`/api/v1/places/${placeId}/accessibility`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to load accessibility profile');
    }
    return response.data.data;
  },

  /**
   * Submits a community or business owner accessibility observation checklist.
   */
  async submitObservation(placeId: string, payload: ObservationSubmitPayload): Promise<ObservationSubmission> {
    const response = await apiClient.post<ApiResponse<ObservationSubmission>>(
      `/api/v1/places/${placeId}/observations`,
      payload
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to submit accessibility observation');
    }
    return response.data.data;
  },

  /**
   * Retrieves all past observation submissions for a place.
   */
  async getPlaceObservations(placeId: string): Promise<ObservationSubmission[]> {
    const response = await apiClient.get<ApiResponse<ObservationSubmission[]>>(`/api/v1/places/${placeId}/observations`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to load place observation history');
    }
    return response.data.data;
  },

  /**
   * Admin: Retrieves the moderation queue of observation submissions.
   */
  async getAdminObservations(status?: string, page: number = 0): Promise<PagedObservationsResponse> {
    const response = await apiClient.get<ApiResponse<PagedObservationsResponse>>('/api/v1/admin/observations', {
      params: {
        status: status && status !== 'ALL' ? status : undefined,
        page,
        size: 20,
      },
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to load admin moderation queue');
    }
    return response.data.data;
  },

  /**
   * Admin: Approves or rejects an observation submission.
   */
  async reviewObservation(id: string, payload: ObservationReviewPayload): Promise<ObservationSubmission> {
    const response = await apiClient.post<ApiResponse<ObservationSubmission>>(
      `/api/v1/admin/observations/${id}/review`,
      payload
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to execute observation review');
    }
    return response.data.data;
  },

  /**
   * Business owner: Submits a claim on a venue.
   */
  async claimPlace(placeId: string): Promise<PlaceOwnership> {
    const response = await apiClient.post<ApiResponse<PlaceOwnership>>(`/api/v1/business/places/${placeId}/claim`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to submit place claim');
    }
    return response.data.data;
  },

  /**
   * Business owner: Lists claims for the current user.
   */
  async getMyClaims(): Promise<PlaceOwnership[]> {
    const response = await apiClient.get<ApiResponse<PlaceOwnership[]>>('/api/v1/business/claims');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to load business claims');
    }
    return response.data.data;
  },

  /**
   * Admin: Verifies a business ownership claim.
   */
  async verifyOwnership(id: string, approved: boolean): Promise<PlaceOwnership> {
    const response = await apiClient.post<ApiResponse<PlaceOwnership>>(
      `/api/v1/admin/ownerships/${id}/verify?approved=${approved}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to verify ownership');
    }
    return response.data.data;
  },

  /**
   * Retrieves the four-state summary (counts + score) for a place's accessibility.
   * GET /api/v1/places/{placeId}/accessibility/summary
   */
  async getPlaceAccessibilitySummary(placeId: string): Promise<AccessibilitySummary> {
    const response = await apiClient.get<ApiResponse<AccessibilitySummary>>(
      `/api/v1/places/${placeId}/accessibility/summary`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to load accessibility summary');
    }
    return response.data.data;
  },

  /**
   * Retrieves the current user's own observation submissions.
   * GET /api/v1/accessibility/observations/me
   */
  async getMyObservations(): Promise<ObservationSubmission[]> {
    const response = await apiClient.get<ApiResponse<ObservationSubmission[]>>(
      '/api/v1/accessibility/observations/me'
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to load your observations');
    }
    return response.data.data;
  },

  /**
   * Admin: Approves an observation submission via dedicated endpoint.
   * POST /api/v1/admin/accessibility/observations/{id}/approve
   */
  async approveObservation(id: string, notes?: string): Promise<ObservationSubmission> {
    const params = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    const response = await apiClient.post<ApiResponse<ObservationSubmission>>(
      `/api/v1/admin/accessibility/observations/${id}/approve${params}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to approve observation');
    }
    return response.data.data;
  },

  /**
   * Admin: Rejects an observation submission via dedicated endpoint.
   * POST /api/v1/admin/accessibility/observations/{id}/reject
   */
  async rejectObservation(id: string, notes?: string): Promise<ObservationSubmission> {
    const params = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    const response = await apiClient.post<ApiResponse<ObservationSubmission>>(
      `/api/v1/admin/accessibility/observations/${id}/reject${params}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to reject observation');
    }
    return response.data.data;
  },

  /**
   * Uploads a photo file as accessibility evidence for a place.
   * POST /api/v1/places/{placeId}/accessibility/evidence/upload (multipart)
   * Returns a pre-signed URL for the uploaded file.
   */
  async uploadEvidenceFile(
    placeId: string,
    file: File,
    caption?: string,
    featureCode?: string
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) formData.append('caption', caption);
    if (featureCode) formData.append('featureCode', featureCode);

    const response = await apiClient.post<ApiResponse<string>>(
      `/api/v1/places/${placeId}/accessibility/evidence/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to upload evidence photo');
    }
    return response.data.data;
  },
};

