import { apiClient } from './api';
import { ApiResponse } from '../types/auth';
import {
  AiChatRequest,
  AiChatResponse,
  AiSearchRequest,
  AiSearchResponse,
  AiProfileExplanation,
  AiReportAssistanceRequest,
  AiReportAssistanceResponse,
} from '../types/ai';

export const aiService = {
  /**
   * Executes natural language place discovery grounded strictly in real database records.
   */
  async search(request: AiSearchRequest): Promise<AiSearchResponse> {
    const response = await apiClient.post<ApiResponse<AiSearchResponse>>(
      '/api/v1/ai/assistant/search',
      request
    );
    return response.data.data;
  },

  /**
   * Engages in multi-turn Q&A with the grounded accessibility assistant.
   */
  async chat(request: AiChatRequest): Promise<AiChatResponse> {
    const response = await apiClient.post<ApiResponse<AiChatResponse>>(
      '/api/v1/ai/assistant/chat',
      request
    );
    return response.data.data;
  },

  /**
   * Retrieves an empathetic, plain-language four-state breakdown of a venue's accessibility profile.
   */
  async explainPlace(placeId: string): Promise<AiProfileExplanation> {
    const response = await apiClient.get<ApiResponse<AiProfileExplanation>>(
      `/api/v1/ai/assistant/explain-place/${placeId}`
    );
    return response.data.data;
  },

  /**
   * Provides non-binding suggestions to enhance report clarity, grammar, and completeness.
   */
  async improveReport(request: AiReportAssistanceRequest): Promise<AiReportAssistanceResponse> {
    const response = await apiClient.post<ApiResponse<AiReportAssistanceResponse>>(
      '/api/v1/ai/assistant/improve-report',
      request
    );
    return response.data.data;
  },
};

