export type ReportCategory =
  | 'INACCESSIBLE_ENTRANCE'
  | 'DAMAGED_OR_MISSING_RAMP'
  | 'ELEVATOR_UNAVAILABLE'
  | 'INACCESSIBLE_WASHROOM'
  | 'BLOCKED_PATHWAY'
  | 'INACCESSIBLE_PARKING'
  | 'MISSING_SIGNAGE'
  | 'OTHER';

export type ReportStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'NEEDS_MORE_INFORMATION'
  | 'DISPUTED'
  | 'RESOLVED';

export interface ReportPhoto {
  id: string;
  photoUrl: string;
  caption?: string;
  createdAt: string;
}

export interface AccessibilityReport {
  id: string;
  placeId: string;
  placeName: string;
  placeAddress: string;
  reportingUserId: string;
  reportingUserName: string;
  reportingUserEmail?: string;
  category: ReportCategory;
  categoryDisplayName: string;
  issueType?: string;
  title: string;
  description: string;
  observationDate: string;
  latitude?: number;
  longitude?: number;
  status: ReportStatus;
  adminNotes?: string;
  rejectionReason?: string;
  infoRequestedAt?: string;
  assignedReviewerName?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  resolvedAt?: string;
  profileUpdated: boolean;
  photos: ReportPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface ReportCreatePayload {
  placeId: string;
  category: ReportCategory;
  issueType?: string;
  title: string;
  description: string;
  observationDate?: string;
  latitude?: number;
  longitude?: number;
  photos?: {
    url: string;
    caption?: string;
  }[];
}

export interface ReportStatusUpdatePayload {
  status: ReportStatus;
  adminNotes?: string;
  rejectionReason?: string;
  updateAccessibilityFeature?: boolean;
  featureCode?: string;
  featureStatus?: 'AVAILABLE' | 'NOT_AVAILABLE' | 'UNKNOWN' | 'NOT_VERIFIED';
}

