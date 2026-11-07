import { FeatureStatus, FeatureType } from './accessibility';

export type PlaceCategory =
  | 'HOSPITAL'
  | 'CLINIC'
  | 'DOCTORS'
  | 'MEDICAL_CENTRE'
  | 'DIAGNOSTIC_CENTRE'
  | 'COLLEGE'
  | 'UNIVERSITY'
  | 'SCHOOL'
  | 'LIBRARY'
  | 'EDUCATIONAL_INSTITUTION'
  | 'RAILWAY_STATION'
  | 'METRO_STATION'
  | 'BUS_STATION'
  | 'AIRPORT'
  | 'PUBLIC_TRANSPORT_TERMINAL'
  | 'TRANSIT_STATION'
  | 'RESTAURANT'
  | 'CAFE'
  | 'HOTEL'
  | 'SHOPPING_MALL'
  | 'SUPERMARKET'
  | 'MARKET'
  | 'PUBLIC_OFFICE'
  | 'PARK'
  | 'COMMUNITY_CENTRE'
  | 'PUBLIC_BUILDING'
  | 'RETAIL'
  | 'THEATER'
  | 'OTHER';

export interface PlaceFeature {
  id: string;
  featureType: FeatureType;
  status: FeatureStatus;
  notes?: string;
  lastVerifiedAt?: string;
}

export interface Place {
  id: string;
  name: string;
  description?: string;
  category: PlaceCategory | string;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number | null;
  phone?: string;
  website?: string;
  isActive: boolean;
  sourceName?: string;
  externalSourceId?: string | null;
  lastImportedAt?: string | null;
  features: PlaceFeature[];
  createdAt: string;
  updatedAt: string;
}

export interface PlaceFilterParams {
  q?: string;
  name?: string;
  category?: string;
  city?: string;
  state?: string;
  features?: string[];
  page?: number;
  size?: number;
  sort?: string;
}

export interface ViewportFilterParams {
  north: number;
  south: number;
  east: number;
  west: number;
  category?: string;
  page?: number;
  size?: number;
}

export interface NearbyFilterParams {
  lat: number;
  lng: number;
  radiusMeters?: number;
  category?: string;
  page?: number;
  size?: number;
}

export interface UserDeviceLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

export interface PageMetadata {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PagedPlacesResponse {
  content: Place[];
  page: PageMetadata;
}

