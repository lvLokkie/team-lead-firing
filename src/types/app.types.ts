export type AppSettings = {
  jira: {
    email: string;
    apiToken: string;
    domain: string;
    projects: string[];
    boardsByProject?: Record<string, string[]>;
  };
  notion: {
    apiKey: string;
    databaseIds: string[];
  };
  llm: {
    provider: 'openai' | 'gemini' | 'google';
    apiKey: string;
  };
};

export type TeamMetrics = {
  sprintProgress: number;
  velocity: number;
  sprintHealth: number;
  blockers: number;
};

export type SprintGoal = {
  teamName: string;
  sprintName: string;
  status: 'active' | 'completed' | 'planned';
  goal: string;
  goalStatus: string;
  firstAddedDate: string;
  notes: string;
  epicLink: string;
  transferCount: number;
  priority: 'high' | 'medium' | 'low';
  owner: string;
}; 