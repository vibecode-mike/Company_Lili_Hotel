import { apiClient } from './client';
import type {
  Survey,
  SurveyCreate,
  SurveyTemplate,
  SurveyQuestion,
  SurveyResponse,
  SurveyStatistics,
} from '@/types/survey';

// Survey Management APIs
export const fetchSurveys = async (params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<Survey[]> => {
  return apiClient.get('/surveys', { params });
};

export const fetchSurvey = async (id: number): Promise<Survey> => {
  return apiClient.get(`/surveys/${id}`);
};

export const createSurvey = async (data: SurveyCreate): Promise<Survey> => {
  return apiClient.post('/surveys', data);
};

export const updateSurvey = async (id: number, data: Partial<SurveyCreate>): Promise<Survey> => {
  return apiClient.put(`/surveys/${id}`, data);
};

export const deleteSurvey = async (id: number): Promise<void> => {
  return apiClient.delete(`/surveys/${id}`);
};

export const publishSurvey = async (id: number): Promise<Survey> => {
  return apiClient.post(`/surveys/${id}/publish`);
};

// Template Management APIs
export const fetchSurveyTemplates = async (): Promise<SurveyTemplate[]> => {
  return apiClient.get('/surveys/templates');
};

export const fetchSurveyTemplate = async (id: number): Promise<SurveyTemplate> => {
  return apiClient.get(`/surveys/templates/${id}`);
};

// Question Management APIs
export const createQuestion = async (
  surveyId: number,
  data: SurveyQuestion
): Promise<SurveyQuestion> => {
  return apiClient.post(`/surveys/${surveyId}/questions`, data);
};

export const updateQuestion = async (
  surveyId: number,
  questionId: number,
  data: Partial<SurveyQuestion>
): Promise<SurveyQuestion> => {
  return apiClient.put(`/surveys/${surveyId}/questions/${questionId}`, data);
};

export const deleteQuestion = async (surveyId: number, questionId: number): Promise<void> => {
  return apiClient.delete(`/surveys/${surveyId}/questions/${questionId}`);
};

export const reorderQuestions = async (
  surveyId: number,
  questionIds: number[]
): Promise<void> => {
  return apiClient.post(`/surveys/${surveyId}/questions/reorder`, {
    question_ids: questionIds,
  });
};

// Response Management APIs
export const fetchSurveyResponses = async (
  surveyId: number,
  params?: { page?: number; limit?: number }
): Promise<SurveyResponse[]> => {
  return apiClient.get(`/surveys/${surveyId}/responses`, { params });
};

export const fetchSurveyResponse = async (
  surveyId: number,
  responseId: number
): Promise<SurveyResponse> => {
  return apiClient.get(`/surveys/${surveyId}/responses/${responseId}`);
};

// Statistics APIs
export const fetchSurveyStatistics = async (surveyId: number): Promise<SurveyStatistics> => {
  return apiClient.get(`/surveys/${surveyId}/statistics`);
};
