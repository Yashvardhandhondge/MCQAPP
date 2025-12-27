export interface SubjectSummary {
  name: string;
  questionCount: number;
}

export interface DashboardData {
  totalQuestions: number;
  subjects: SubjectSummary[];
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

export interface ChaptersResponse {
  success: boolean;
  data: string[];
}

export interface ChapterAnalytics {
  chapter: string;
  totalQuestions: number;
  userAttempts: number;
  standard?: '11' | '12';
  chapterNumber?: number;
  examQuestions?: number; // Number of questions from this chapter in MHT-CET exam
  examMarks?: number; // Total marks for questions from this chapter in MHT-CET exam
}

export interface ChaptersAnalyticsData {
  standard11: ChapterAnalytics[];
  standard12: ChapterAnalytics[];
  unclassified: ChapterAnalytics[];
}

export interface ChaptersAnalyticsResponse {
  success: boolean;
  data: ChaptersAnalyticsData;
}

export interface YearsResponse {
  success: boolean;
  data: string[];
}

export interface YearAnalytics {
  year: string;
  totalQuestions: number;
  userAttempts: number;
  isBlurred?: boolean;
}

export interface YearsAnalyticsResponse {
  success: boolean;
  data: YearAnalytics[];
}

export interface Question {
  _id: string;
  question: string;
  sourceFile: string;
  subject: string;
  chapter: string;
  correctanswrs: string;
  options: string[];
  year: string;
  solution?: string;
  isBlurred?: boolean;
}

export interface QuestionsResponse {
  success: boolean;
  data: Question[];
  isChapterLocked?: boolean;
  shouldBlurYear?: boolean;
}

export interface SubmitAnswerPayload {
  questionId: string;
  selectedOption: string;
}

export interface SubmitAnswerData {
  isCorrect: boolean;
  correctAnswer: string;
  questionId: string;
}

export interface SubmitAnswerResponse {
  success: boolean;
  data: SubmitAnswerData;
}

export interface UserAttemptData {
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
  isSubmitted: boolean;
}

export interface UserAttemptsResponse {
  success: boolean;
  data: Record<string, UserAttemptData>;
}

export interface OverallStats {
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
}

export interface SubjectStats {
  totalAttempts: number;
  correctAttempts: number;
  subject: string;
  accuracy: number;
}

export interface SubjectChapterStats {
  totalAttempts: number;
  correctAttempts: number;
  subject: string;
  chapter: string;
  accuracy: number;
}

export interface SubjectChapterYearStats {
  totalAttempts: number;
  correctAttempts: number;
  subject: string;
  chapter: string;
  year: string;
  accuracy: number;
}

export interface UserStatsData {
  overall: OverallStats;
  perSubject: SubjectStats[];
  perSubjectChapter: SubjectChapterStats[];
}

export interface UserStatsResponse {
  success: boolean;
  data: UserStatsData;
}

export interface UserProgressData {
  overall: OverallStats;
  perSubject: SubjectStats[];
  perSubjectChapter: SubjectChapterStats[];
  perSubjectChapterYear: SubjectChapterYearStats[];
}

export interface UserProgressResponse {
  success: boolean;
  data: UserProgressData;
}

// Test-related types
export type TestStatus = 'completed' | 'failed' | 'not-started';

export interface Test {
  id: string;
  name: string;
  year: string;
  shift: string;
  duration: number;
  status: TestStatus;
  score?: number;
  total?: number;
  questionCount: number;
}

export interface TestsResponse {
  success: boolean;
  data: Test[];
}

export interface StartTestPayload {
  year?: string;
  shift?: string;
  subject?: string;
  chapter?: string;
  testType?: 'pyq' | 'chapter';
  limit?: number;
}

export interface StartTestResponse {
  success: boolean;
  data: {
    sessionId: string;
    questions: string[];
    testType: string;
    year?: string;
    shift?: string;
    questionsData?: Question[]; // Full question data for chapter practice
  };
}

export interface SubmitTestPayload {
  sessionId: string;
  answers: Array<{
    questionId: string;
    selectedOption: string;
  }>;
}

export interface TestResult {
  questionId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  selectedOption: string;
  isCorrect: boolean;
  subject: string;
  chapter: string;
  year: string;
}

export interface SubmitTestResponse {
  success: boolean;
  data: {
    sessionId: string;
    score: number;
    total: number;
    wrongCount: number;
    accuracy: string;
    duration: number;
    testType: string;
    subject?: string;
    chapter?: string;
    year?: string;
    shift?: string;
    completedAt: string;
    results: TestResult[];
  };
}

export interface TestReport {
  sessionId: string;
  score: number;
  total: number;
  wrongCount: number;
  accuracy: string;
  duration: number;
  testType: string;
  subject?: string;
  chapter?: string;
  year?: string;
  shift?: string;
  completedAt: string;
  createdAt: string;
}

export interface TestReportResponse {
  success: boolean;
  data: TestReport;
}

export interface TestReportsResponse {
  success: boolean;
  data: TestReport[];
}

// Leaderboard types
export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
  isCurrentUser: boolean;
  totalCorrect: number;
  totalAttempts: number;
}

export interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardEntry[];
}

// Config types
export interface ExamConfigData {
  examName: string;
  targetYear: string;
  examDate: string;
  daysUntilExam: number;
}

export interface ExamConfigResponse {
  success: boolean;
  data: ExamConfigData;
}

export interface StudyStreakData {
  studyStreak: number;
  maxStreak: number;
  todayProgress: number;
  hasTodayActivity: boolean;
  activityDates: string[]; // Array of dates in YYYY-MM-DD format
}

export interface StudyStreakResponse {
  success: boolean;
  data: StudyStreakData;
}

// Solution types
export interface SolutionData {
  solution: string;
  fromCache: boolean;
}

export interface SolutionResponse {
  success: boolean;
  data: SolutionData;
}

// Saved Questions types
export interface SavedQuestionResponse {
  success: boolean;
  data: Question[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalQuestions: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SaveQuestionResponse {
  success: boolean;
  message: string;
  data: {
    isSaved: boolean;
  };
}

export interface SavedStatusResponse {
  success: boolean;
  data: {
    isSaved: boolean;
  };
}

export interface SavedQuestionWithAttempt extends Question {
  userAttempt: {
    selectedOption: string;
    isCorrect: boolean;
    answeredAt: string;
  } | null;
}

export interface SavedQuestionsBySubject {
  subject: string;
  questionCount: number;
}

export interface SavedQuestionsBySubjectResponse {
  success: boolean;
  data: SavedQuestionsBySubject[];
}

export interface SavedQuestionsByChapter {
  chapter: string;
  questionCount: number;
}

export interface SavedQuestionsByChapterResponse {
  success: boolean;
  data: SavedQuestionsByChapter[];
}

export interface SavedQuestionsWithAttemptsResponse {
  success: boolean;
  data: SavedQuestionWithAttempt[];
}

// Question Report types
export type ReportType = 'wrong-question' | 'wrong-options' | 'invalid-question';

export interface ReportQuestionPayload {
  reportType: ReportType;
  details: string;
}

export interface ReportQuestionResponse {
  success: boolean;
  message: string;
  data: {
    reportId: string;
  };
}