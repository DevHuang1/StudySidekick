export type Assignment = {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  /** Total estimated effort; completedMinutes records finished planned work. */
  estimateMinutes: number;
  completedMinutes: number;
  createdAt: string;
};

export type DailyAvailability = {
  date: string;
  minutes: number;
};

export type AssistantStudyContext = {
  assignments: Array<Pick<Assignment, "id" | "title" | "course" | "dueDate" | "estimateMinutes" | "completedMinutes">>;
  availability: DailyAvailability[];
};

export type StudySession = {
  id: string;
  assignmentId: string;
  date: string;
  minutes: number;
  completed: boolean;
};

export type WeeklyPlan = {
  sessions: StudySession[];
  generatedAt: string;
  weekStart: string;
  inputSignature: string;
};

export type Reminder = {
  id: string;
  text: string;
  dueAt: string | null;
  done: boolean;
};

export type AssistantAction =
  | { type: "add_assignment"; title: string; course: string; dueDate: string; estimateMinutes: number }
  | { type: "update_assignment"; assignmentId: string; changes: Partial<Pick<Assignment, "title" | "course" | "dueDate" | "estimateMinutes">> }
  | { type: "set_availability"; date: string; minutes: number }
  | { type: "add_reminder"; text: string; dueAt: string | null }
  | { type: "start_focus"; minutes: number }
  | { type: "build_plan" };

export type PendingAssistantAction =
  | (Extract<AssistantAction, { type: "add_assignment" }> & { previewId: string })
  | Exclude<AssistantAction, { type: "add_assignment" }>;

export type AssistantProviderChoice = "auto" | "ollama" | "groq";
export type AssistantProvider = "ollama" | "groq" | "guided";

export type AssistantReply = {
  reply: string;
  clarification: string | null;
  proposedActions: AssistantAction[];
  provider: AssistantProvider;
};

export type Shortfall = {
  assignmentId: string;
  minutes: number;
  reason: "overdue" | "capacity";
};

export type StoredStudyData = {
  assignments: Assignment[];
  availability: DailyAvailability[];
  plan: WeeklyPlan | null;
  reminders: Reminder[];
  focusMinutes: number;
};
