export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Chapters: { subject?: string };
  Tests: undefined;
  Leaderboard: undefined;
  Stats: undefined;
};

export type AppStackParamList = {
  GroupSelection: undefined;
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
    testType?: 'pyq' | 'practice' | 'chapter' | 'mocktest';
    mockTestNumber?: number;
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
};
