export type DisputeCategory =
  | 'INCORRECT_ACCESSIBILITY_INFO'
  | 'OUTDATED_FACILITY_INFO'
  | 'INCORRECT_REPORT_APPROVAL'
  | 'INCORRECT_REPORT_REJECTION'
  | 'FEATURE_STATUS_CHANGE';

export const DISPUTE_CATEGORY_LABELS: Record<DisputeCategory, string> = {
  INCORRECT_ACCESSIBILITY_INFO: 'Incorrect Accessibility Information',
  OUTDATED_FACILITY_INFO: 'Outdated Facility Information',
  INCORRECT_REPORT_APPROVAL: 'Contested Report Approval',
  INCORRECT_REPORT_REJECTION: 'Contested Report Rejection',
  FEATURE_STATUS_CHANGE: 'Physical Infrastructure Modified / Restored',
};

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'ADDITIONAL_INFORMATION_REQUIRED'
  | 'UPHELD'
  | 'OVERTURNED'
  | 'CLOSED';

export interface DisputePhoto {
  id: string;
  photoUrl: string;
  caption?: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  placeId: string;
  placeName: string;
  placeAddress: string;
  reportId?: string;
  reportTitle?: string;
  observationId?: string;
  featureCode?: string;
  submittingUserId: string;
  submittingUserName: string;
  submittingUserEmail?: string;
  category: DisputeCategory;
  categoryDisplayName: string;
  explanation: string;
  status: DisputeStatus;
  assignedReviewerName?: string;
  resolutionNotes?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  profileCorrected: boolean;
  photos: DisputePhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface DisputeCreatePayload {
  placeId: string;
  reportId?: string;
  observationId?: string;
  featureCode?: string;
  category: DisputeCategory;
  explanation: string;
  photos?: {
    url: string;
    caption?: string;
  }[];
}

export interface DisputeStatusUpdatePayload {
  status: DisputeStatus;
  resolutionNotes: string;
  correctAccessibilityProfile?: boolean;
  targetFeatureCode?: string;
  targetFeatureStatus?: 'AVAILABLE' | 'NOT_AVAILABLE' | 'UNKNOWN' | 'NOT_VERIFIED';
}

export interface ConflictDetection {
  reportId: string;
  placeId: string;
  placeName: string;
  featureCode?: string;
  currentFeatureStatus?: 'AVAILABLE' | 'NOT_AVAILABLE' | 'UNKNOWN' | 'NOT_VERIFIED';
  currentLastVerifiedAt?: string;
  similarReports: {
    id: string;
    title: string;
    status: string;
    submitterName: string;
    createdAt: string;
    photosCount: number;
  }[];
  hasConflict: boolean;
  conflictDescription: string;
}

export interface FeatureFreshnessItem {
  featureCode: string;
  featureName: string;
  status: 'AVAILABLE' | 'NOT_AVAILABLE' | 'UNKNOWN' | 'NOT_VERIFIED';
  lastVerifiedAt?: string;
  daysSinceVerification?: number;
  isStale: boolean;
  freshnessRating: 'FRESH' | 'AGING' | 'STALE' | 'NEVER_VERIFIED';
}

export interface PlaceFreshness {
  placeId: string;
  placeName: string;
  freshnessThresholdDays: number;
  totalFeatures: number;
  freshCount: number;
  staleCount: number;
  unverifiedCount: number;
  features: FeatureFreshnessItem[];
}

