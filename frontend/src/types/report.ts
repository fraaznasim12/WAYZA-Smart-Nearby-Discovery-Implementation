export type ReportCategory =
  | 'INACCESSIBLE_ENTRANCE'
  | 'DAMAGED_OR_MISSING_RAMP'
  | 'ELEVATOR_UNAVAILABLE'
  | 'INACCESSIBLE_WASHROOM'
  | 'BLOCKED_PATHWAY'
  | 'INACCESSIBLE_PARKING'
  | 'MISSING_SIGNAGE'
  | 'OTHER';

export type ReportType =
  | 'ACCESSIBILITY_ISSUE'
  | 'ACCESSIBILITY_IMPROVEMENT'
  | 'VISIT_REVIEW';

export type ObservationStatus =
  | 'AVAILABLE'
  | 'PARTIALLY_AVAILABLE'
  | 'NOT_AVAILABLE'
  | 'NOT_SURE';

export type ImpactLevel =
  | 'PREVENTS_ACCESS'
  | 'MAKES_MOVEMENT_DIFFICULT'
  | 'REQUIRES_ASSISTANCE'
  | 'MINOR_INCONVENIENCE'
  | 'OTHER';

export type ObservationSource =
  | 'PERSONALLY_VISITED'
  | 'ACCOMPANIED_VISITOR'
  | 'OTHER_INFORMATION';

export type AccessibilityFeature =
  | 'WHEELCHAIR_ENTRANCE'
  | 'STEP_FREE_RAMP'
  | 'ACCESSIBLE_RESTROOM'
  | 'ELEVATOR_ACCESS'
  | 'MOBILITY_PARKING'
  | 'PUBLIC_TRANSPORT'
  | 'BRAILLE_TACTILE'
  | 'AUDIO_ASSISTANCE'
  | 'SEATING_WAITING'
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
  category?: ReportCategory;
  categoryDisplayName?: string;
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
  // Extended community report fields
  reportType?: ReportType;
  reportTypeDisplayName?: string;
  observationStatus?: ObservationStatus;
  impact?: ImpactLevel;
  isPresent?: string;
  observationSource?: ObservationSource;
  rating?: number;
  whatLiked?: string;
  whatImproved?: string;
  whatToKnow?: string;
}

export interface ReportCreatePayload {
  placeId: string;
  category?: ReportCategory;
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
  // Extended community report fields
  reportType?: ReportType;
  observationStatus?: ObservationStatus;
  impact?: ImpactLevel;
  isPresent?: string;
  observationSource?: ObservationSource;
  rating?: number;
  whatLiked?: string;
  whatImproved?: string;
  whatToKnow?: string;
}

export interface ReportStatusUpdatePayload {
  status: ReportStatus;
  adminNotes?: string;
  rejectionReason?: string;
  updateAccessibilityFeature?: boolean;
  featureCode?: string;
  featureStatus?: 'AVAILABLE' | 'NOT_AVAILABLE' | 'UNKNOWN' | 'NOT_VERIFIED';
}

