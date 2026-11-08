import { apiClient } from './api';
import { ApiResponse } from '../types/auth';

export interface PlaceReview {
  id: string;
  placeId: string;
  placeName: string;
  reviewerName: string;
  reviewerAvatarUrl?: string;
  rating: number;
  visitDate?: string;
  reviewText?: string;
  accessibilitySummary?: string;
  hadAccessibleEntrance?: boolean;
  hadAccessibleRestroom?: boolean;
  hadAccessibleParking?: boolean;
  hadElevator?: boolean;
  hadStepFreePath?: boolean;
  hadStaffAssistance?: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
}

export interface PagedReviews {
  content: PlaceReview[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface CreateReviewPayload {
  rating: number;
  visitDate?: string;
  reviewText?: string;
  accessibilitySummary?: string;
  hadAccessibleEntrance?: boolean;
  hadAccessibleRestroom?: boolean;
  hadAccessibleParking?: boolean;
  hadElevator?: boolean;
  hadStepFreePath?: boolean;
  hadStaffAssistance?: boolean;
}

export const reviewService = {
  /**
   * Returns approved community reviews for a place, paginated.
   */
  async getReviews(placeId: string, page = 0, size = 10): Promise<PagedReviews> {
    const response = await apiClient.get<ApiResponse<PagedReviews>>(
      `/api/v1/places/${placeId}/reviews`,
      { params: { page, size } }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to load reviews');
    }
    return response.data.data;
  },

  /**
   * Submits a new community review (requires authentication).
   */
  async submitReview(placeId: string, payload: CreateReviewPayload): Promise<PlaceReview> {
    const response = await apiClient.post<ApiResponse<PlaceReview>>(
      `/api/v1/places/${placeId}/reviews`,
      payload
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to submit review');
    }
    return response.data.data;
  },

  /**
   * Returns the authenticated user's own review for a place.
   */
  async getMyReview(placeId: string): Promise<PlaceReview | null> {
    try {
      const response = await apiClient.get<ApiResponse<PlaceReview>>(
        `/api/v1/places/${placeId}/reviews/mine`
      );
      return response.data.data || null;
    } catch {
      return null;
    }
  },
};

