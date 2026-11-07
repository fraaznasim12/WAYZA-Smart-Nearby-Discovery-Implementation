import { apiClient } from './api';
import { ApiResponse } from '../types/auth';
import { ConflictDetection } from '../types/dispute';
import {
  AccessibilityReport,
  ReportCreatePayload,
  ReportStatusUpdatePayload,
  ReportPhoto,
  ReportStatus,
} from '../types/report';

export interface PagedReportsResponse {
  content: AccessibilityReport[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
}

export const reportService = {
  /**
   * Submits a community accessibility barrier report.
   * Uses multipart/form-data when photographic files are attached.
   */
  async submitReport(payload: ReportCreatePayload, files?: File[]): Promise<AccessibilityReport> {
    if (files && files.length > 0) {
      const formData = new FormData();
      const reportBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      formData.append('report', reportBlob);

      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await apiClient.post<ApiResponse<AccessibilityReport>>(
        '/api/v1/reports',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to submit report with photos');
      }
      return response.data.data;
    } else {
      const response = await apiClient.post<ApiResponse<AccessibilityReport>>(
        '/api/v1/reports',
        payload
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to submit report');
      }
      return response.data.data;
    }
  },

  /**
   * Uploads an individual photo to an existing report.
   */
  async uploadReportPhoto(reportId: string, file: File, caption?: string): Promise<ReportPhoto> {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) formData.append('caption', caption);

    const response = await apiClient.post<ApiResponse<ReportPhoto>>(
      `/api/v1/reports/${reportId}/photos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to upload photo');
    }
    return response.data.data;
  },

  /**
   * Retrieves all reports submitted by the authenticated user.
   */
  async getMyReports(): Promise<AccessibilityReport[]> {
    const response = await apiClient.get<ApiResponse<AccessibilityReport[]>>('/api/v1/reports/me');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to load your reports');
    }
    return response.data.data;
  },

  /**
   * Retrieves full report details by ID.
   */
  async getReportById(reportId: string): Promise<AccessibilityReport> {
    const response = await apiClient.get<ApiResponse<AccessibilityReport>>(`/api/v1/reports/${reportId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to load report');
    }
    return response.data.data;
  },

  /**
   * Admin: Retrieves paginated community reports with optional status filter.
   */
  async getAdminReports(status?: ReportStatus | 'ALL', page: number = 0, size: number = 20): Promise<PagedReportsResponse> {
    const response = await apiClient.get<ApiResponse<PagedReportsResponse>>('/api/v1/admin/reports', {
      params: {
        status: status && status !== 'ALL' ? status : undefined,
        page,
        size,
      },
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to load admin reports queue');
    }
    return response.data.data;
  },

  /**
   * Admin: Updates report moderation status and optional profile integration.
   */
  async updateReportStatus(reportId: string, payload: ReportStatusUpdatePayload): Promise<AccessibilityReport> {
    const response = await apiClient.patch<ApiResponse<AccessibilityReport>>(
      `/api/v1/admin/reports/${reportId}/status`,
      payload
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update report status');
    }
    return response.data.data;
  },

  /**
   * Admin: Assigns a report to a designated reviewer.
   */
  async assignReport(reportId: string, reviewerId: string, notes?: string): Promise<AccessibilityReport> {
    const response = await apiClient.post<ApiResponse<AccessibilityReport>>(
      `/api/v1/admin/reports/${reportId}/assign`,
      null,
      { params: { reviewerId, notes } }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to assign reviewer');
    }
    return response.data.data;
  },

  /**
   * Admin: Requests additional information from the report author.
   */
  async requestMoreInformation(reportId: string, notes: string): Promise<AccessibilityReport> {
    const response = await apiClient.post<ApiResponse<AccessibilityReport>>(
      `/api/v1/admin/reports/${reportId}/request-info`,
      null,
      { params: { notes } }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to request additional information');
    }
    return response.data.data;
  },

  /**
   * Admin: Detects duplicate reports and conflicts with verified baseline.
   */
  async getReportConflicts(reportId: string): Promise<ConflictDetection> {
    const response = await apiClient.get<ApiResponse<ConflictDetection>>(
      `/api/v1/admin/reports/${reportId}/conflicts`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch conflict analysis');
    }
    return response.data.data;
  },
};

