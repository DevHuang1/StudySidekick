import type { Assignment, DailyAvailability, Shortfall, StudySession } from "@/lib/types";

export type ScheduleResult = {
  sessions: StudySession[];
  shortfalls: Shortfall[];
  backlog: Assignment[];
};

function makeSessionId(assignmentId: string, date: string, index: number): string {
  return `${assignmentId}-${date}-${index}`;
}

/** Deterministically schedules the earliest deadlines first without exceeding a day's capacity. */
export function buildSchedule(
  assignments: Assignment[],
  availability: DailyAvailability[],
  weekDates: string[],
  today: string,
): ScheduleResult {
  const capacityByDate = new Map(availability.map((day) => [day.date, Math.max(0, day.minutes)]));
  const usedByDate = new Map<string, number>();
  const sessions: StudySession[] = [];
  const shortfalls: Shortfall[] = [];
  const horizonEnd = weekDates.at(-1) ?? today;
  const backlog = assignments
    .filter((assignment) => assignment.dueDate > horizonEnd)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
  const eligible = assignments
    .filter((assignment) => assignment.dueDate <= horizonEnd)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate) || left.createdAt.localeCompare(right.createdAt));

  for (const assignment of eligible) {
    let remaining = assignment.estimateMinutes;
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
        sessions.push({
          id: makeSessionId(assignment.id, date, sessionIndex++),
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

  return { sessions, shortfalls, backlog };
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
