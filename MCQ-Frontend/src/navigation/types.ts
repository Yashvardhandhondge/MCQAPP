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
};
