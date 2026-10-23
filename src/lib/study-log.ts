import type { Assignment, StudyLogEntry, StudySession } from "@/lib/types";

/** Keep browser storage bounded even after years of checked-off blocks. */
export const MAX_STUDY_LOG_ENTRIES = 2_000;

const MAX_ENTRY_MINUTES = 24 * 60;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function isUsableEntry(entry: StudyLogEntry): boolean {
  return Boolean(entry.id)
    && Boolean(entry.assignmentId)
    && Boolean(entry.title.trim())
    && Boolean(entry.course.trim())
    && DATE_KEY.test(entry.date)
    && Number.isFinite(entry.minutes)
    && entry.minutes > 0
    && entry.minutes <= MAX_ENTRY_MINUTES
    && !Number.isNaN(Date.parse(entry.completedAt));
}

/** Validate untrusted storage and keep the newest entries, one per session. */
export function normalizeStudyLog(value: unknown): StudyLogEntry[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const entries: StudyLogEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<StudyLogEntry>;
    if (
      typeof candidate.id !== "string"
      || typeof candidate.assignmentId !== "string"
      || typeof candidate.title !== "string"
      || typeof candidate.course !== "string"
      || typeof candidate.date !== "string"
      || typeof candidate.minutes !== "number"
      || typeof candidate.completedAt !== "string"
    ) continue;
    const entry: StudyLogEntry = {
      id: candidate.id,
      assignmentId: candidate.assignmentId,
      title: candidate.title,
      course: candidate.course,
      date: candidate.date,
      minutes: Math.floor(candidate.minutes),
      completedAt: candidate.completedAt,
    };
    if (!isUsableEntry(entry) || seen.has(entry.id)) continue;
    seen.add(entry.id);
    entries.push(entry);
  }
  return entries
    .sort((left, right) => Date.parse(right.completedAt) - Date.parse(left.completedAt))
    .slice(0, MAX_STUDY_LOG_ENTRIES);
}

export function createStudyLogEntry(
  session: Pick<StudySession, "id" | "assignmentId" | "date" | "minutes">,
  assignment: Pick<Assignment, "id" | "title" | "course">,
  completedAt = new Date(),
): StudyLogEntry {
  return {
    id: session.id,
    assignmentId: assignment.id,
    title: assignment.title,
    course: assignment.course,
    date: session.date,
    minutes: session.minutes,
    completedAt: completedAt.toISOString(),
  };
}

/** Add or replace one entry, keeping the newest first. */
export function addStudyLogEntry(entries: StudyLogEntry[], entry: StudyLogEntry): StudyLogEntry[] {
  return [entry, ...entries.filter((item) => item.id !== entry.id)]
    .slice(0, MAX_STUDY_LOG_ENTRIES);
}

export function removeStudyLogEntry(entries: StudyLogEntry[], sessionId: string): StudyLogEntry[] {
  return entries.filter((entry) => entry.id !== sessionId);
}

/**
 * Older browser records predate the log. Use their checked plan sessions once so
 * Insights opens with the work already visible; the next write persists the log.
 */
export function studyLogFromCompletedSessions(
  sessions: StudySession[],
  assignments: Assignment[],
): StudyLogEntry[] {
  const assignmentById = new Map(assignments.map((assignment) => [assignment.id, assignment]));
  const entries: StudyLogEntry[] = [];
  for (const session of sessions) {
    if (!session.completed) continue;
    const assignment = assignmentById.get(session.assignmentId);
    if (!assignment || session.minutes <= 0) continue;
    const completedAt = new Date(`${session.date}T12:00:00`);
    if (Number.isNaN(completedAt.valueOf())) continue;
    entries.push(createStudyLogEntry(session, assignment, completedAt));
  }
  return normalizeStudyLog(entries);
}
