export type FeatureStatus = 'AVAILABLE' | 'NOT_AVAILABLE' | 'UNKNOWN' | 'NOT_VERIFIED';

export type FeatureType =
  | 'STEP_FREE_ENTRANCE'
  | 'RAMP'
  | 'ELEVATOR'
  | 'ACCESSIBLE_RESTROOM'
  | 'ACCESSIBLE_PARKING'
  | 'PUBLIC_TRANSPORT_ACCESSIBILITY';

export type PlaceCategory =
  | 'HOSPITAL'
  | 'COLLEGE'
  | 'TRANSIT_STATION'
  | 'RESTAURANT'
  | 'PUBLIC_OFFICE'
  | 'SHOPPING_MALL';

export interface AccessibilityFeature {
  id: string;
  featureType: FeatureType;
  status: FeatureStatus;
  notes?: string;
  lastVerifiedAt?: string;
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  features: AccessibilityFeature[];
  verifiedCount?: number;
  lastAuditedDaysAgo?: number;
  isPrototypeSample?: boolean;
}

export interface SearchFilterState {
  query: string;
  category: string;
  requiredFeatures: FeatureType[];
}