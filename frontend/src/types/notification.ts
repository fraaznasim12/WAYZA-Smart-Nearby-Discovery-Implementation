export type NotificationType =
  // User Notifications
  | 'REPORT_SUBMITTED'
  | 'REPORT_APPROVED'
  | 'REPORT_REJECTED'
  | 'ADDITIONAL_INFORMATION_REQUESTED'
  | 'DISPUTE_UPDATED'
  | 'DISPUTE_RESOLVED'
  | 'ACCESSIBILITY_PROFILE_UPDATED'
  | 'ACCOUNT_SECURITY_ALERT'
  // Business Owner Notifications
  | 'BUSINESS_CLAIM_APPROVED'
  | 'BUSINESS_CLAIM_REJECTED'
  | 'NEW_LOCATION_REPORT'
  | 'ACCESSIBILITY_PROPOSAL_REVIEWED'
  | 'BUSINESS_OWNERSHIP_UPDATED'
  // Admin Notifications
  | 'NEW_ACCESSIBILITY_REPORT'
  | 'NEW_BUSINESS_CLAIM'
  | 'NEW_DISPUTE'
  | 'MODERATION_REQUIRED';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: 'REPORT' | 'DISPUTE' | 'PLACE' | 'CLAIM' | 'OBSERVATION' | 'USER' | string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
  metadata?: string | null;
}

export interface NotificationPreference {
  id?: string | null;
  type: NotificationType;
  defaultTitle: string;
  defaultSummary: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  updatedAt?: string | null;
}

export interface NotificationPreferenceUpdateRequest {
  type: NotificationType;
  inAppEnabled: boolean;
  emailEnabled: boolean;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

