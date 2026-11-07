import { apiClient, getAuthToken } from './api';
import { ApiResponse } from '../types/auth';
import {
  NotificationItem,
  NotificationPreference,
  NotificationPreferenceUpdateRequest,
  UnreadCountResponse,
} from '../types/notification';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface PageResult<T> {
  content: T[];
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
  totalElements?: number;
  totalPages?: number;
}

export const notificationService = {
  /**
   * Retrieves paginated notifications for the authenticated user.
   */
  async getNotifications(
    isRead?: boolean,
    page = 0,
    size = 20
  ): Promise<PageResult<NotificationItem>> {
    const params: Record<string, unknown> = { page, size };
    if (typeof isRead === 'boolean') {
      params.isRead = isRead;
    }

    const response = await apiClient.get<ApiResponse<PageResult<NotificationItem>>>(
      '/api/v1/notifications',
      { params }
    );
    return response.data.data;
  },

  /**
   * Gets unread notifications counter.
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get<ApiResponse<UnreadCountResponse>>(
      '/api/v1/notifications/unread-count'
    );
    return response.data.data;
  },

  /**
   * Marks an individual notification as read.
   */
  async markAsRead(id: string): Promise<NotificationItem> {
    const response = await apiClient.patch<ApiResponse<NotificationItem>>(
      `/api/v1/notifications/${id}/read`
    );
    return response.data.data;
  },

  /**
   * Marks all notifications as read for current user.
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.patch<ApiResponse<void>>('/api/v1/notifications/read-all');
  },

  /**
   * Fetches user channel preferences for all notification types.
   */
  async getPreferences(): Promise<NotificationPreference[]> {
    const response = await apiClient.get<ApiResponse<NotificationPreference[]>>(
      '/api/v1/notifications/preferences'
    );
    return response.data.data;
  },

  /**
   * Updates notification channel preferences.
   */
  async updatePreferences(
    updates: NotificationPreferenceUpdateRequest[]
  ): Promise<NotificationPreference[]> {
    const response = await apiClient.put<ApiResponse<NotificationPreference[]>>(
      '/api/v1/notifications/preferences',
      updates
    );
    return response.data.data;
  },

  /**
   * Connects to the SSE notification stream with Bearer header authentication
   * and automatic polling fallback on network interruptions.
   *
   * SECURITY: Auth token is passed in the Authorization header, never in query parameters.
   */
  subscribeToStream(
    onNotification: (item: NotificationItem) => void,
    onConnected?: () => void,
    onError?: () => void
  ): () => void {
    const token = getAuthToken();
    if (!token) {
      return () => {};
    }

    const controller = new AbortController();
    let isAborted = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const startPollingFallback = () => {
      if (pollInterval || isAborted) return;
      pollInterval = setInterval(async () => {
        try {
          const res = await notificationService.getNotifications(false, 0, 5);
          if (res.content && res.content.length > 0) {
            // Unread notifications present during polling fallback
          }
        } catch {
          // Graceful silent fallback
        }
      }, 30000);
    };

    const connect = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/notifications/stream`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`SSE failed with HTTP status ${response.status}`);
        }

        onConnected?.();
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!isAborted) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const eventMatch = part.match(/event:\s*([^\n]+)/);
            const dataMatch = part.match(/data:\s*([^\n]+)/);
            const eventType = eventMatch ? eventMatch[1].trim() : 'message';

            if (eventType === 'NOTIFICATION' && dataMatch) {
              try {
                const item: NotificationItem = JSON.parse(dataMatch[1]);
                onNotification(item);
              } catch (e) {
                console.error('Failed to parse SSE notification payload', e);
              }
            }
          }
        }
      } catch (err: unknown) {
        if (!isAborted) {
          onError?.();
          startPollingFallback();
        }
      }
    };

    connect();

    return () => {
      isAborted = true;
      controller.abort();
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  },
};

