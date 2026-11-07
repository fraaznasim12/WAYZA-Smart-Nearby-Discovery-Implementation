import type { PlaceCategory } from './place';

export type FeatureStatus = 'AVAILABLE' | 'NOT_AVAILABLE' | 'UNKNOWN' | 'NOT_VERIFIED';

export type FeatureCategory =
  | 'ENTRANCE'
  | 'VERTICAL_ACCESS'
  | 'RESTROOM'
  | 'PARKING'
  | 'PATHWAYS'
  | 'ADDITIONAL';

export type FeatureType =
  // ENTRANCE
  | 'WHEELCHAIR_ACCESSIBLE_ENTRANCE'
  | 'STEP_FREE_ENTRANCE'
  | 'ENTRANCE_RAMP'
  | 'AUTOMATIC_DOORS'
  | 'DOORWAY_ACCESSIBILITY_INFO'
  // VERTICAL ACCESS
  | 'ELEVATOR_AVAILABILITY'
  | 'ELEVATOR_ACCESSIBILITY'
  | 'STAIR_FREE_ACCESS'
  | 'HANDRAILS'
  // RESTROOM
  | 'ACCESSIBLE_WASHROOM'
  | 'WHEELCHAIR_ACCESSIBLE_RESTROOM'
  | 'ACCESSIBLE_RESTROOM_SIGNAGE'
  // PARKING
  | 'ACCESSIBLE_PARKING'
  | 'RESERVED_WHEELCHAIR_PARKING'
  // PATHWAYS
  | 'WHEELCHAIR_ACCESSIBLE_PATHWAYS'
  | 'ACCESSIBLE_RECEPTION_COUNTERS'
  | 'ACCESSIBLE_SEATING'
  // ADDITIONAL
  | 'BRAILLE_SIGNAGE'
  | 'TACTILE_INDICATORS'
  | 'AUDIO_ASSISTANCE'
  | 'STAFF_ASSISTANCE'
  // LEGACY
  | 'RAMP'
  | 'ELEVATOR'
  | 'ACCESSIBLE_RESTROOM'
  | 'PUBLIC_TRANSPORT_ACCESSIBILITY';

export interface FeatureDefinition {
  code: string;
  category: FeatureCategory | string;
  name: string;
  description: string;
  icon?: string;
  displayOrder: number;
}

export interface FeatureStatusItem {
  code: string;
  name: string;
  category: FeatureCategory | string;
  description: string;
  icon?: string;
  status: FeatureStatus;
  notes?: string;
  lastVerifiedAt?: string;
}

export type SubmissionType = 'COMMUNITY' | 'BUSINESS_OWNER' | 'ADMIN';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ObservationItem {
  id?: string;
  featureCode: string;
  status: FeatureStatus;
  notes?: string;
}

export interface ObservationEvidence {
  id?: string;
  imageUrl: string;
  caption?: string;
  featureCode?: string;
  uploadedAt?: string;
}

export interface ObservationSubmission {
  id: string;
  placeId: string;
  placeName?: string;
  submittedById?: string;
  submittedByName?: string;
  submissionType: SubmissionType;
  verificationStatus: VerificationStatus;
  observationDate: string;
  description?: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  items: ObservationItem[];
  evidence: ObservationEvidence[];
}

export interface AccessibilityProfile {
  placeId: string;
  placeName: string;
  availableCount: number;
  notAvailableCount: number;
  unknownCount: number;
  notVerifiedCount: number;
  totalTrackedFeatures: number;
  lastVerifiedAt?: string | null;
  pendingObservationsCount: number;
  features: FeatureStatusItem[];
  recentObservations: ObservationSubmission[];
}

/**
 * Lightweight summary returned by GET /api/v1/places/{id}/accessibility/summary.
 * Contains the four-state counts, an overall percentage score, and
 * a per-category breakdown of "available" feature counts.
 */
export interface AccessibilitySummary {
  placeId: string;
  placeName: string;
  overallStatus: string;
  availableCount: number;
  notAvailableCount: number;
  unknownCount: number;
  notVerifiedCount: number;
  totalFeatures: number;
  scorePercentage: number;
  lastVerifiedAt?: string;
  categoryAvailableCounts: Record<string, number>;
}

export interface ObservationSubmitPayload {
  items: {
    featureCode: string;
    status: FeatureStatus;
    notes?: string;
  }[];
  description?: string;
  observationDate?: string;
  evidence?: {
    imageUrl: string;
    caption?: string;
    featureCode?: string;
  }[];
}

export interface ObservationReviewPayload {
  decision: 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
}

export interface PlaceOwnership {
  id: string;
  placeId: string;
  placeName: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory | string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  features: {
    id: string;
    featureType: FeatureType;
    status: FeatureStatus;
    notes?: string;
    lastVerifiedAt?: string;
  }[];
  verifiedCount?: number;
  lastAuditedDaysAgo?: number;
  isPrototypeSample?: boolean;
}

export type { PlaceCategory } from './place';
