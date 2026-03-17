export type AuthStackParamList = {
  OTPLogin: undefined;
  Register: undefined;
  ClassLogin: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Chapters: { subject?: string };
  Tests: undefined;
  Leaderboard: undefined;
  Stats: undefined;
};

export type AppStackParamList = {
  GroupSelection: { editMode?: boolean } | undefined;
  MainTabs: undefined;
  ChapterDetail: { subject: string; chapter: string; standard?: '11' | '12'; chapterNumber?: number };
  PracticeByYear: { subject: string; chapter: string; standard?: '11' | '12'; chapterNumber?: number };
  Questions: {
    subject: string;
    chapter: string;
    mode: 'all' | 'year' | 'random';
    year?: string;
    randomQuestions?: any[];
  };
  CBT: {
    testId: string;
    questions: any[];
    testType?: 'pyq' | 'practice' | 'chapter' | 'mocktest' | 'pyq-mocktest';
    mockTestNumber?: number;
    testTitle?: string;
    sections?: {
      section1: { start: number; end: number; timeLimit: number };
      section2: { start: number; end: number; timeLimit: number };
    };
  };
  TestResults: {
    sessionId: string;
  };
  Profile: undefined;
  EditProfile: undefined;
  PremiumPurchase: undefined;
  SavedQuestions: undefined;
  SavedQuestionsChapters: { subject: string };
  SavedQuestionsList: { subject: string; chapter: string };
  MockTestSelection: undefined;
  MockTestLeaderboardSelection: undefined;
  MockTestLeaderboard: { mockTestNumber: number };
  Notifications: undefined;
  NotificationDetail: { notificationId: string };
  Privacy: undefined;
  PyqMockTestSelection: undefined;
  PyqMockTestInstructions: {
    test: {
      id: string;
      title: string;
      year: string;
      questionCount: number;
      subjects: string[];
    };
  };
  PyqMockTestLeaderboard: {
    title: string;
    year?: string;
  };
};
