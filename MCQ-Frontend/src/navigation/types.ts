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
  MainTabs: undefined;
  ChapterDetail: { subject: string; chapter: string };
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
};
