import { apiClient } from './api';
import { ApiResponse } from '../types/auth';

export interface LocationSuggestion {
  displayName: string;
  city?: string;
  district?: string;
  state: string;
  stateCode: string;
  type: 'STATE' | 'DISTRICT' | 'CITY';
}

export interface StateInfo {
  name: string;
  code: string;
  category: string;
}

let suggestCache: Record<string, LocationSuggestion[]> = {};
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const locationService = {
  /**
   * Returns all 36 Indian States and Union Territories.
   */
  async getStates(): Promise<StateInfo[]> {
    const response = await apiClient.get<ApiResponse<StateInfo[]>>('/api/v1/locations/states');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to load states');
    }
    return response.data.data;
  },

  /**
   * Returns location autocomplete suggestions for the given query string.
   * Results include cities, districts, and states matching the query.
   */
  async suggest(query: string): Promise<LocationSuggestion[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    if (suggestCache[trimmed]) return suggestCache[trimmed];

    const response = await apiClient.get<ApiResponse<LocationSuggestion[]>>(
      '/api/v1/locations/suggest',
      { params: { q: trimmed, limit: 8 } }
    );

    if (!response.data.success || !response.data.data) return [];

    suggestCache[trimmed] = response.data.data;
    return response.data.data;
  },

  /**
   * Debounced suggestion helper — calls the backend only after the user
   * stops typing for `delayMs` milliseconds.
   */
  suggestDebounced(
    query: string,
    callback: (suggestions: LocationSuggestion[]) => void,
    delayMs = 250
  ): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!query || query.trim().length < 2) {
      callback([]);
      return;
    }
    debounceTimer = setTimeout(async () => {
      try {
        const results = await locationService.suggest(query);
        callback(results);
      } catch {
        callback([]);
      }
    }, delayMs);
  },

  /** Clears the in-memory suggestion cache (e.g. after locale change). */
  clearCache(): void {
    suggestCache = {};
  },
};

