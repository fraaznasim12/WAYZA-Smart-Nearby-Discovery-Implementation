import { Place } from './place';

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiSearchFilters {
  category?: string | null;
  city?: string | null;
  state?: string | null;
  requiredFeatures?: string[];
  extractedKeyword?: string | null;
}

export interface AiSearchRequest {
  query: string;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
}

export interface AiSearchResponse {
  originalQuery: string;
  extractedFilters: AiSearchFilters;
  places: Place[];
  explanation: string;
  totalResults: number;
}

export interface AiChatRequest {
  message: string;
  history?: AiChatMessage[];
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface AiChatResponse {
  reply: string;
  placeId?: string | null;
  placeName?: string | null;
  structuredFilters?: AiSearchFilters | null;
  matchedPlaces?: Place[];
  suggestedQuestions?: string[];
  modelUsed: string;
  providerUsed: string;
}

export interface AiProfileExplanation {
  placeId: string;
  placeName: string;
  plainEnglishExplanation: string;
  confirmedAvailable: string[];
  confirmedUnavailable: string[];
  unknownFeatures: string[];
  unverifiedObservations: string[];
  lastVerifiedAt?: string | null;
}

export interface AiReportAssistanceRequest {
  draftDescription: string;
  placeId?: string | null;
  featureCode?: string | null;
}

export interface AiReportAssistanceResponse {
  originalDescription: string;
  improvedDescription: string;
  suggestedFeatureCode?: string | null;
  suggestedFeatureName?: string | null;
  missingInformationTips: string[];
  grammarCorrectionsSummary?: string | null;
}

