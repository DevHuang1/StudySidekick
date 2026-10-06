import type { Assignment, StudySession, WeeklyPlan } from "@/lib/types";

type AssignmentWithOptionalProgress = Omit<Assignment, "completedMinutes"> & {
  completedMinutes?: number;
};

const MAX_COMPLETED_MINUTES = 2_147_483_647;

/** Return remaining effort without allowing estimates below completed work to go negative. */
export function remainingEffort(assignment: Pick<Assignment, "estimateMinutes" | "completedMinutes">): number {
  return Math.max(0, assignment.estimateMinutes - Math.max(0, assignment.completedMinutes));
}

/** Migrate older browser data by deriving completion totals from its checked plan sessions. */
export function normalizeAssignmentProgress(
  assignments: AssignmentWithOptionalProgress[],
  sessions: StudySession[] = [],
): Assignment[] {
  const completedFromPlan = new Map<string, number>();
  for (const session of sessions) {
    if (session.completed && Number.isFinite(session.minutes) && session.minutes > 0) {
      completedFromPlan.set(session.assignmentId, (completedFromPlan.get(session.assignmentId) ?? 0) + session.minutes);
    }
  }

  return assignments.map((assignment) => ({
    ...assignment,
    completedMinutes: Number.isFinite(assignment.completedMinutes) && assignment.completedMinutes! >= 0
      ? Math.min(MAX_COMPLETED_MINUTES, Math.floor(assignment.completedMinutes!))
      : Math.min(MAX_COMPLETED_MINUTES, completedFromPlan.get(assignment.id) ?? 0),
  }));
}

/** Apply one session's completion change to its assignment-level cumulative progress. */
export function applySessionCompletion(
  assignments: Assignment[],
  session: Pick<StudySession, "assignmentId" | "minutes">,
  wasCompleted: boolean,
  completed: boolean,
): Assignment[] {
  if (wasCompleted === completed) return assignments;
  const delta = completed ? session.minutes : -session.minutes;
  return assignments.map((assignment) => assignment.id === session.assignmentId
    ? { ...assignment, completedMinutes: Math.min(MAX_COMPLETED_MINUTES, Math.max(0, assignment.completedMinutes + delta)) }
    : assignment);
}

/** Complete a planned block and credit its assignment exactly once. */
export function completePlannedSession(
  plan: WeeklyPlan | null,
  assignments: Assignment[],
  sessionId: string,
  expectedMinutes?: number,
): { plan: WeeklyPlan | null; assignments: Assignment[]; completed: boolean } {
  const session = plan?.sessions.find((item) => item.id === sessionId);
  if (!plan || !session || session.completed || (expectedMinutes !== undefined && session.minutes !== expectedMinutes)
    || !assignments.some((item) => item.id === session.assignmentId)) {
    return { plan, assignments, completed: false };
  }

  return {
    plan: {
      ...plan,
      sessions: plan.sessions.map((item) => item.id === sessionId ? { ...item, completed: true } : item),
    },
    assignments: applySessionCompletion(assignments, session, false, true),
    completed: true,
  };
}
