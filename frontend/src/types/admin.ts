import { UserRole } from './auth';

export interface AdminAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: string;
  metadata: string;
  createdAt: string;
}

export interface AdminOverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalPlaces: number;
  activePlaces: number;
  placesByCategory: Record<string, number>;
  totalReports: number;
  pendingReports: number;
  approvedReports: number;
  rejectedReports: number;
  openDisputes: number;
  pendingBusinessClaims: number;
  verifiedAccessibilityObservations: number;
  recentActivities: AdminAuditLog[];
}

export interface AdminUserSummary {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isEnabled: boolean;
  avatarObjectKey?: string;
  createdAt: string;
  updatedAt: string;
  reportsCount: number;
  disputesCount: number;
  observationsCount: number;
}

export interface AdminPlaceSummary {
  id: string;
  name: string;
  description?: string;
  category: string;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  sourceName: string;
  externalSourceId?: string;
  phone?: string;
  website?: string;
  createdAt: string;
  lastImportedAt?: string;
  verifiedFeaturesCount: number;
}

export interface AdminPlaceUpdateRequest {
  name: string;
  description?: string;
  category: string;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  website?: string;
  reason?: string;
}

export interface DuplicatePlaceCandidate {
  originalPlaceId: string;
  originalPlaceName: string;
  candidateId: string;
  candidateName: string;
  candidateAddress: string;
  candidateCategory: string;
  candidateLatitude: number;
  candidateLongitude: number;
  distanceMeters: number;
  similarityReason: string;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  group: string;
  description: string;
  updatedAt: string;
  updatedByEmail?: string;
}

export interface DataImportHistory {
  id: string;
  providerName: string;
  regionName?: string;
  boundingBox?: string;
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL';
  recordsImported: number;
  recordsSkipped: number;
  recordsFailed: number;
  errorMessage?: string;
  initiatedByEmail?: string;
  createdAt: string;
}

export interface DataManagementOverview {
  providerName: string;
  providerAvailable: boolean;
  lastImportAt?: string;
  totalImportedRecords: number;
  recordsByCategory: Record<string, number>;
  recordsByRegion: Record<string, number>;
  recentImports: DataImportHistory[];
}

export interface BusinessClaim {
  id: string;
  placeId: string;
  placeName: string;
  placeAddress: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
}

