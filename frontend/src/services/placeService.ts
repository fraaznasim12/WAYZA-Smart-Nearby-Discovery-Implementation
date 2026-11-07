import { apiClient } from './api';
import { ApiResponse } from '../types/auth';
import { Place, PagedPlacesResponse, PlaceFilterParams, NearbyFilterParams, ViewportFilterParams } from '../types/place';

export const placeService = {
  /**
   * Retrieves active venues with optional search query, category, city, state, and feature filters.
   */
  async getPlaces(params?: PlaceFilterParams): Promise<PagedPlacesResponse> {
    const response = await apiClient.get<ApiResponse<PagedPlacesResponse>>('/api/v1/places', {
      params: {
        q: params?.q || params?.name || undefined,
        category: params?.category && params.category !== 'ALL' ? params.category : undefined,
        city: params?.city || undefined,
        state: params?.state || undefined,
        features: params?.features && params.features.length > 0 ? params.features.join(',') : undefined,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        sort: params?.sort || 'name,asc',
      },
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to retrieve places');
    }

    return response.data.data;
  },

  /**
   * Viewport Spatial Search: Finds places within a map bounding box.
   */
  async getPlacesInViewport(params: ViewportFilterParams): Promise<PagedPlacesResponse> {
    const response = await apiClient.get<ApiResponse<PagedPlacesResponse>>('/api/v1/places/viewport', {
      params: {
        north: params.north,
        south: params.south,
        east: params.east,
        west: params.west,
        category: params.category && params.category !== 'ALL' ? params.category : undefined,
        page: params.page ?? 0,
        size: params.size ?? 50,
      },
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to retrieve viewport places');
    }

    return response.data.data;
  },

  /**
   * PostGIS Proximity Search: Finds places within a radius in meters from GPS coordinates.
   */
  async getNearbyPlaces(params: NearbyFilterParams): Promise<PagedPlacesResponse> {
    const response = await apiClient.get<ApiResponse<PagedPlacesResponse>>('/api/v1/places/nearby', {
      params: {
        lat: params.lat,
        lng: params.lng,
        radiusMeters: params.radiusMeters || 5000,
        category: params.category && params.category !== 'ALL' ? params.category : undefined,
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to retrieve nearby places');
    }

    return response.data.data;
  },

  /**
   * Retrieves detailed information for a single place by its UUID.
   */
  async getPlaceById(id: string): Promise<Place> {
    const response = await apiClient.get<ApiResponse<Place>>(`/api/v1/places/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to retrieve place details');
    }

    return response.data.data;
  },
};

