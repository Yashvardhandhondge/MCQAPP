import axios from 'axios';
import type {
    ChaptersResponse,
    ChaptersAnalyticsResponse,
    DashboardResponse,
    QuestionsResponse,
    SubmitAnswerPayload,
    SubmitAnswerResponse,
    UserAttemptsResponse,
    UserProgressResponse,
    UserStatsResponse,
    YearsResponse,
    YearsAnalyticsResponse,
    TestsResponse,
    StartTestPayload,
    StartTestResponse,
    SubmitTestPayload,
    SubmitTestResponse,
    TestReportResponse,
    TestReportsResponse,
    LeaderboardResponse,
    ExamConfigResponse,
    StudyStreakResponse,
    SolutionResponse,
    SavedQuestionResponse,
    SaveQuestionResponse,
    SavedStatusResponse,
    SavedQuestionsBySubjectResponse,
    SavedQuestionsByChapterResponse,
    SavedQuestionsWithAttemptsResponse,
} from '../types/mcq';
import { axiosInstance } from './http';

const FALLBACK_ERROR_MESSAGE = 'Failed to load dashboard';
const CHAPTERS_ERROR_MESSAGE = 'Failed to load chapters';
const YEARS_ERROR_MESSAGE = 'Failed to load data';
const QUESTIONS_ERROR_MESSAGE = 'Failed to load data';

export async function getDashboard(): Promise<DashboardResponse> {
  try {
    const response = await axiosInstance.get<DashboardResponse>('/api/mcq/dashboard');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? FALLBACK_ERROR_MESSAGE);
    }
    throw new Error(FALLBACK_ERROR_MESSAGE);
  }
}

export async function getExamConfig(): Promise<ExamConfigResponse> {
  try {
    const response = await axiosInstance.get<ExamConfigResponse>('/api/mcq/config');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to load exam config');
    }
    throw new Error('Failed to load exam config');
  }
}

export async function getChaptersBySubject(subject: string): Promise<ChaptersResponse> {
  try {
    const response = await axiosInstance.get<ChaptersResponse>(
      `/api/mcq/subjects/${encodeURIComponent(subject)}/chapters`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? CHAPTERS_ERROR_MESSAGE);
    }
    throw new Error(CHAPTERS_ERROR_MESSAGE);
  }
}

export async function getChaptersWithAnalytics(subject: string): Promise<ChaptersAnalyticsResponse> {
  try {
    const response = await axiosInstance.get<ChaptersAnalyticsResponse>(
      `/api/mcq/subjects/${encodeURIComponent(subject)}/chapters/analytics`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? CHAPTERS_ERROR_MESSAGE);
    }
    throw new Error(CHAPTERS_ERROR_MESSAGE);
  }
}

export async function getYearsBySubjectAndChapter(
  subject: string,
  chapter: string,
): Promise<YearsResponse> {
  try {
    const response = await axiosInstance.get<YearsResponse>(
      `/api/mcq/subjects/${encodeURIComponent(subject)}/chapters/${encodeURIComponent(
        chapter,
      )}/years`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? YEARS_ERROR_MESSAGE);
    }
    throw new Error(YEARS_ERROR_MESSAGE);
  }
}

export async function getYearsWithAnalytics(
  subject: string,
  chapter: string,
): Promise<YearsAnalyticsResponse> {
  try {
    const response = await axiosInstance.get<YearsAnalyticsResponse>(
      `/api/mcq/subjects/${encodeURIComponent(subject)}/chapters/${encodeURIComponent(
        chapter,
      )}/years/analytics`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? YEARS_ERROR_MESSAGE);
    }
    throw new Error(YEARS_ERROR_MESSAGE);
  }
}

export async function getQuestionsBySubjectAndChapter(
  subject: string,
  chapter: string,
): Promise<QuestionsResponse> {
  try {
    const response = await axiosInstance.get<QuestionsResponse>(
      `/api/mcq/subjects/${encodeURIComponent(subject)}/chapters/${encodeURIComponent(
        chapter,
      )}/questions`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? QUESTIONS_ERROR_MESSAGE);
    }
    throw new Error(QUESTIONS_ERROR_MESSAGE);
  }
}

export async function getQuestionsBySubjectChapterAndYear(
  subject: string,
  chapter: string,
  year: string,
): Promise<QuestionsResponse> {
  try {
    const response = await axiosInstance.get<QuestionsResponse>(
      `/api/mcq/subjects/${encodeURIComponent(subject)}/chapters/${encodeURIComponent(
        chapter,
      )}/years/${encodeURIComponent(year)}/questions`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to load year-wise questions');
    }
    throw new Error('Failed to load year-wise questions');
  }
}

export async function generateChapterPractice(
  subject: string,
  chapter: string,
  limit: number = 20,
): Promise<StartTestResponse> {
  try {
    const response = await axiosInstance.get<StartTestResponse>(
      `/api/mcq/chapters/${encodeURIComponent(subject)}/${encodeURIComponent(chapter)}/practice`,
      {
        params: { limit },
      },
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ?? 'Failed to generate chapter practice',
      );
    }
    throw new Error('Failed to generate chapter practice');
  }
}

export async function getQuestionsByIds(questionIds: string[]): Promise<QuestionsResponse> {
  try {
    const response = await axiosInstance.post<QuestionsResponse>('/api/mcq/questions/by-ids', {
      questionIds,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to load questions');
    }
    throw new Error('Failed to load questions');
  }
}

export async function submitAnswer(payload: SubmitAnswerPayload): Promise<SubmitAnswerResponse> {
  try {
    const response = await axiosInstance.post<SubmitAnswerResponse>('/api/mcq/answer', payload);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to submit answer');
    }
    throw new Error('Failed to submit answer');
  }
}

export async function getUserAttemptsByQuestions(
  questionIds: string[],
): Promise<UserAttemptsResponse> {
  try {
    const response = await axiosInstance.post<UserAttemptsResponse>(
      '/api/mcq/attempts/by-questions',
      { questionIds },
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ?? 'Failed to load user attempts',
      );
    }
    throw new Error('Failed to load user attempts');
  }
}

export async function getUserStats(): Promise<UserStatsResponse> {
  try {
    const response = await axiosInstance.get<UserStatsResponse>('/api/mcq/me/stats');
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message ?? 'Failed to load stats';
    throw new Error(message);
  }
}

export async function getUserProgress(): Promise<UserProgressResponse> {
  try {
    const response = await axiosInstance.get<UserProgressResponse>('/api/mcq/me/progress');
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message ?? 'Failed to load progress';
    throw new Error(message);
  }
}

// Test-related functions
export async function getAvailableTests(filter?: 'year' | 'subject'): Promise<TestsResponse> {
  try {
    const params = filter ? { filter } : {};
    const response = await axiosInstance.get<TestsResponse>('/api/mcq/tests', { params });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to load tests');
    }
    throw new Error('Failed to load tests');
  }
}

export async function getDistinctYears(): Promise<{ success: boolean; data: string[] }> {
  try {
    const response = await axiosInstance.get<{ success: boolean; data: string[] }>('/api/mcq/tests/years');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to load years');
    }
    throw new Error('Failed to load years');
  }
}

export async function generateRandomTest(
  questionCount: number = 25,
  year?: string,
  subject?: string
): Promise<StartTestResponse> {
  try {
    const payload: { questionCount: number; year?: string; subject?: string } = {
      questionCount: Math.max(10, Math.min(100, questionCount)),
    };
    if (year) payload.year = year;
    if (subject) payload.subject = subject;
    
    const response = await axiosInstance.post<StartTestResponse>('/api/mcq/tests/random', payload);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to generate random test');
    }
    throw new Error('Failed to generate random test');
  }
}

export async function startTestSession(payload: StartTestPayload): Promise<StartTestResponse> {
  try {
    const response = await axiosInstance.post<StartTestResponse>('/api/mcq/tests/start', payload);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to start test');
    }
    throw new Error('Failed to start test');
  }
}

export async function submitTestSession(payload: SubmitTestPayload): Promise<SubmitTestResponse> {
  try {
    const response = await axiosInstance.post<SubmitTestResponse>('/api/mcq/tests/submit', payload);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to submit test');
    }
    throw new Error('Failed to submit test');
  }
}

// Leaderboard functions
export async function getLeaderboard(timeframe: 'month' | 'all-time' = 'all-time'): Promise<LeaderboardResponse> {
  try {
    const response = await axiosInstance.get<LeaderboardResponse>('/api/mcq/leaderboard', {
      params: { timeframe },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to load leaderboard');
    }
    throw new Error('Failed to load leaderboard');
  }
}

// Test Report functions
export async function getTestReport(sessionId: string): Promise<TestReportResponse> {
  try {
    const response = await axiosInstance.get<TestReportResponse>(
      `/api/mcq/tests/reports/${sessionId}`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to load test report');
    }
    throw new Error('Failed to load test report');
  }
}

export async function getTestReports(params?: {
  subject?: string;
  chapter?: string;
  year?: string;
  testType?: string;
}): Promise<TestReportsResponse> {
  try {
    const response = await axiosInstance.get<TestReportsResponse>('/api/mcq/tests/reports', {
      params,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to load test reports');
    }
    throw new Error('Failed to load test reports');
  }
}

// Study streak and today's progress
export async function getStudyStreak(): Promise<StudyStreakResponse> {
  try {
    const response = await axiosInstance.get<StudyStreakResponse>('/api/mcq/me/streak');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to load study streak');
    }
    throw new Error('Failed to load study streak');
  }
}

// Solution functions
export async function getQuestionSolution(questionId: string): Promise<SolutionResponse> {
  try {
    const response = await axiosInstance.get<SolutionResponse>(
      `/api/mcq/questions/${encodeURIComponent(questionId)}/solution`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to get solution');
    }
    throw new Error('Failed to get solution');
  }
}

// Time-series analytics
export async function getTimeSeriesAnalytics(params?: {
  period?: '7d' | '30d' | '90d' | '1y';
  groupBy?: 'day' | 'week' | 'month';
}): Promise<{
  success: boolean;
  data: {
    timeSeries: Array<{
      date: string;
      totalAttempts: number;
      correctAttempts: number;
      accuracy: number;
      testCount: number;
      totalQuestions: number;
      correctQuestions: number;
    }>;
    subjectBreakdown: Array<{
      subject: string;
      totalAttempts: number;
      correctAttempts: number;
      accuracy: number;
    }>;
    period: string;
    groupBy: string;
  };
}> {
  try {
    const response = await axiosInstance.get('/api/mcq/me/analytics/time-series', {
      params,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to load analytics');
    }
    throw new Error('Failed to load analytics');
  }
}

// Saved Questions functions
export async function saveQuestion(questionId: string): Promise<SaveQuestionResponse> {
  try {
    const response = await axiosInstance.post<SaveQuestionResponse>(
      `/api/mcq/questions/${encodeURIComponent(questionId)}/save`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to save question');
    }
    throw new Error('Failed to save question');
  }
}

export async function unsaveQuestion(questionId: string): Promise<SaveQuestionResponse> {
  try {
    const response = await axiosInstance.delete<SaveQuestionResponse>(
      `/api/mcq/questions/${encodeURIComponent(questionId)}/save`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to unsave question');
    }
    throw new Error('Failed to unsave question');
  }
}

export async function getSavedQuestions(params?: {
  page?: number;
  limit?: number;
}): Promise<SavedQuestionResponse> {
  try {
    const response = await axiosInstance.get<SavedQuestionResponse>(
      '/api/mcq/me/saved-questions',
      { params },
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to load saved questions');
    }
    throw new Error('Failed to load saved questions');
  }
}

export async function getSavedStatus(questionId: string): Promise<SavedStatusResponse> {
  try {
    const response = await axiosInstance.get<SavedStatusResponse>(
      `/api/mcq/questions/${encodeURIComponent(questionId)}/saved-status`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to check saved status');
    }
    throw new Error('Failed to check saved status');
  }
}

// Saved Questions grouped endpoints
export async function getSavedQuestionsBySubjects(): Promise<SavedQuestionsBySubjectResponse> {
  try {
    const response = await axiosInstance.get<SavedQuestionsBySubjectResponse>(
      '/api/mcq/me/saved-questions/subjects',
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to load saved questions by subjects');
    }
    throw new Error('Failed to load saved questions by subjects');
  }
}

export async function getSavedQuestionsByChapters(subject: string): Promise<SavedQuestionsByChapterResponse> {
  try {
    const response = await axiosInstance.get<SavedQuestionsByChapterResponse>(
      `/api/mcq/me/saved-questions/subjects/${encodeURIComponent(subject)}/chapters`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to load saved questions by chapters');
    }
    throw new Error('Failed to load saved questions by chapters');
  }
}

export async function getSavedQuestionsBySubjectAndChapter(
  subject: string,
  chapter: string,
): Promise<SavedQuestionsWithAttemptsResponse> {
  try {
    const response = await axiosInstance.get<SavedQuestionsWithAttemptsResponse>(
      `/api/mcq/me/saved-questions/subjects/${encodeURIComponent(subject)}/chapters/${encodeURIComponent(chapter)}/questions`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to load saved questions');
    }
    throw new Error('Failed to load saved questions');
  }
}
