import { apiClient } from './api';
import { ApiResponse } from '../types/auth';

export interface AvatarResponseData {
  mediaId: string;
  avatarUrl: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export const avatarService = {
  /**
   * Uploads or replaces the authenticated user's profile photo.
   * Accepts JPEG, PNG, or WebP. Validates, strips EXIF, re-encodes, and saves to object storage.
   */
  async uploadAvatar(
    file: File,
    onProgress?: (progressPercentage: number) => void
  ): Promise<AvatarResponseData> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.put<ApiResponse<AvatarResponseData>>(
      '/api/v1/users/me/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to upload profile photo');
    }

    return response.data.data;
  },

  /**
   * Retrieves the current user's avatar metadata and a fresh pre-signed access URL.
   */
  async getAvatar(): Promise<AvatarResponseData | null> {
    try {
      const response = await apiClient.get<ApiResponse<AvatarResponseData>>('/api/v1/users/me/avatar');
      return response.data.data;
    } catch (err: unknown) {
      // 404 means no avatar uploaded yet
      return null;
    }
  },

  /**
   * Removes the authenticated user's avatar.
   */
  async deleteAvatar(): Promise<void> {
    await apiClient.delete('/api/v1/users/me/avatar');
  },
};

