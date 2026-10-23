import { addDays, localDateKey } from "@/lib/date-utils";
import { remainingEffort } from "@/lib/progress";
import type { Assignment, StudyLogEntry } from "@/lib/types";

export type DailyStudyTotal = {
  date: string;
  minutes: number;
  blocks: number;
};

export type CourseStudyTotal = {
  course: string;
  minutes: number;
  blocks: number;
};

export type StudyInsights = {
  totalMinutes: number;
  totalBlocks: number;
  currentStreak: number;
  bestStreak: number;
  assignmentsFinished: number;
  assignmentsTotal: number;
  lastSevenDays: DailyStudyTotal[];
  courseTotals: CourseStudyTotal[];
  lastThirtyDayMinutes: number;
};

/** The local calendar day a block was checked off, not its originally planned date. */
export function completedDateKey(entry: Pick<StudyLogEntry, "completedAt">): string | null {
  const parsed = new Date(entry.completedAt);
  return Number.isNaN(parsed.valueOf()) ? null : localDateKey(parsed);
}

function studyDateKeys(entries: StudyLogEntry[]): string[] {
  return [...new Set(entries
    .map(completedDateKey)
    .filter((key): key is string => key !== null))]
    .sort();
}

export function currentStudyStreak(entries: StudyLogEntry[], today: string): number {
  const activeDates = new Set(studyDateKeys(entries));
  let cursor = activeDates.has(today) ? today : addDays(today, -1);
  // A day that has not been studied yet should not erase yesterday's streak.
  if (!activeDates.has(cursor)) return 0;
  let streak = 0;
  while (activeDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function bestStudyStreak(entries: StudyLogEntry[]): number {
  const dates = studyDateKeys(entries);
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of dates) {
    run = previous && addDays(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}

export function buildStudyInsights(
  entries: StudyLogEntry[],
  assignments: Assignment[],
  today: string,
): StudyInsights {
  const dayWindow = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
  const dayTotals = new Map(dayWindow.map((date) => [date, { date, minutes: 0, blocks: 0 }]));
  const courseWindowStart = addDays(today, -29);
  const courseTotals = new Map<string, CourseStudyTotal>();

  let totalMinutes = 0;
  let totalBlocks = 0;
  let lastThirtyDayMinutes = 0;

  for (const entry of entries) {
    totalMinutes += entry.minutes;
    totalBlocks += 1;
    const date = completedDateKey(entry);
    if (!date) continue;
    const day = dayTotals.get(date);
    if (day) {
      day.minutes += entry.minutes;
      day.blocks += 1;
    }
    if (date >= courseWindowStart && date <= today) {
      lastThirtyDayMinutes += entry.minutes;
      const course = courseTotals.get(entry.course)
        ?? { course: entry.course, minutes: 0, blocks: 0 };
      course.minutes += entry.minutes;
      course.blocks += 1;
      courseTotals.set(entry.course, course);
    }
  }

  return {
    totalMinutes,
    totalBlocks,
    currentStreak: currentStudyStreak(entries, today),
    bestStreak: bestStudyStreak(entries),
    assignmentsFinished: assignments.filter((assignment) => assignment.estimateMinutes > 0 && remainingEffort(assignment) === 0).length,
    assignmentsTotal: assignments.length,
    lastSevenDays: [...dayTotals.values()],
    courseTotals: [...courseTotals.values()].sort((left, right) => right.minutes - left.minutes || left.course.localeCompare(right.course)),
    lastThirtyDayMinutes,
  };
}
