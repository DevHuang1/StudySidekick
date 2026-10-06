import type { Assignment, DailyAvailability, Shortfall, StudySession } from "@/lib/types";
import { remainingEffort } from "./progress";

export type BacklogAssignment = Assignment & { remainingMinutes: number };

export type ScheduleResult = {
  sessions: StudySession[];
  shortfalls: Shortfall[];
  backlog: BacklogAssignment[];
};

function makeSessionId(assignmentId: string, date: string, index: number): string {
  return `${assignmentId}-${date}-${index}`;
}

export function planInputSignature(assignments: Assignment[], availability: DailyAvailability[]): string {
  const taskInputs = assignments.map(({ id, title, course, dueDate, estimateMinutes, createdAt }) => ({
    id, title, course, dueDate, estimateMinutes, createdAt,
  }));
  return JSON.stringify({ assignments: taskInputs, availability });
}

export function completedSessionsForWeek(
  sessions: StudySession[],
  assignments: Assignment[],
  weekDates: string[],
): StudySession[] {
  const assignmentIds = new Set(assignments.map((assignment) => assignment.id));
  const dates = new Set(weekDates);
  return sessions.filter((session) => session.completed && assignmentIds.has(session.assignmentId) && dates.has(session.date));
}

/** Deterministically schedules the earliest deadlines first without exceeding a day's capacity. */
export function buildSchedule(
  assignments: Assignment[],
  availability: DailyAvailability[],
  weekDates: string[],
  today: string,
  preservedCompletedSessions: StudySession[] = [],
): ScheduleResult {
  const capacityByDate = new Map(availability.map((day) => [day.date, Math.max(0, day.minutes)]));
  const usedByDate = new Map<string, number>();
  const assignmentIds = new Set(assignments.map((assignment) => assignment.id));
  const activeDates = new Set(weekDates);
  const preserved = preservedCompletedSessions.filter((session) =>
    session.completed && assignmentIds.has(session.assignmentId) && activeDates.has(session.date));
  for (const session of preserved) {
    usedByDate.set(session.date, (usedByDate.get(session.date) ?? 0) + session.minutes);
  }
  const sessions: StudySession[] = [...preserved];
  const usedSessionIds = new Set(preserved.map((session) => session.id));
  const shortfalls: Shortfall[] = [];
  const horizonEnd = weekDates.at(-1) ?? today;
  const backlog = assignments
    .filter((assignment) => assignment.dueDate > horizonEnd && remainingEffort(assignment) > 0)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
  const eligible = assignments
    .filter((assignment) => assignment.dueDate <= horizonEnd && remainingEffort(assignment) > 0)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate) || left.createdAt.localeCompare(right.createdAt));

  for (const assignment of eligible) {
    let remaining = remainingEffort(assignment);
    if (assignment.dueDate < today) {
      shortfalls.push({ assignmentId: assignment.id, minutes: remaining, reason: "overdue" });
      continue;
    }

    let sessionIndex = 0;
    for (const [dayIndex, date] of weekDates.entries()) {
      if (date > assignment.dueDate || remaining <= 0) break;
      let free = Math.max(0, (capacityByDate.get(date) ?? 0) - (usedByDate.get(date) ?? 0));
      while (free > 0 && remaining > 0) {
        const canFinishLater = weekDates.slice(dayIndex + 1)
          .filter((nextDate) => nextDate <= assignment.dueDate)
          .some((nextDate) => Math.max(0, (capacityByDate.get(nextDate) ?? 0) - (usedByDate.get(nextDate) ?? 0)) >= remaining);
        // Avoid leaving an awkward <25 minute tail when it can fit as one block tomorrow.
        if (canFinishLater && (free < 25 || (remaining > free && remaining - free < 25))) break;
        const targetParts = Math.max(1, Math.ceil(remaining / 60));
        const balancedBlock = Math.ceil(remaining / targetParts);
        const minutes = Math.min(60, balancedBlock, free, remaining);
        let id = makeSessionId(assignment.id, date, sessionIndex++);
        while (usedSessionIds.has(id)) id = makeSessionId(assignment.id, date, sessionIndex++);
        usedSessionIds.add(id);
        sessions.push({
          id,
          assignmentId: assignment.id,
          date,
          minutes,
          completed: false,
        });
        usedByDate.set(date, (usedByDate.get(date) ?? 0) + minutes);
        free -= minutes;
        remaining -= minutes;
      }
    }
    if (remaining > 0) shortfalls.push({ assignmentId: assignment.id, minutes: remaining, reason: "capacity" });
  }

  return {
    sessions,
    shortfalls,
    backlog: backlog.map((assignment) => ({ ...assignment, remainingMinutes: remainingEffort(assignment) })),
  };
}

export function moveSession(
  sessions: StudySession[],
  sessionId: string,
  targetDate: string,
  availability: DailyAvailability[],
  assignments: Assignment[],
): { sessions: StudySession[]; error: string | null } {
  const target = sessions.find((session) => session.id === sessionId);
  if (!target) return { sessions, error: "That study block is no longer in this plan." };
  if (target.completed) return { sessions, error: "Completed study blocks stay where they are." };
  const assignment = assignments.find((item) => item.id === target.assignmentId);
  if (!assignment) return { sessions, error: "The assignment for this block could not be found." };
  if (targetDate > assignment.dueDate) return { sessions, error: "That would move the work past its due date." };
  const capacity = availability.find((day) => day.date === targetDate)?.minutes ?? 0;
  const alreadyUsed = sessions
    .filter((session) => session.date === targetDate && session.id !== sessionId)
    .reduce((total, session) => total + session.minutes, 0);
  if (alreadyUsed + target.minutes > capacity) return { sessions, error: "There is not enough free study time on that day." };
  return {
    sessions: sessions.map((session) => session.id === sessionId ? { ...session, date: targetDate } : session),
    error: null,
  };
}
