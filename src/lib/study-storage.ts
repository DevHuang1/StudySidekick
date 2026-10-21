import { getWeekDates, localDateKey } from "@/lib/date-utils";
import { newId } from "@/lib/format";
import { normalizeAssignmentProgress } from "@/lib/progress";
import type {
  Assignment,
  DailyAvailability,
  Reminder,
  StoredFocusSession,
  StoredStudyData,
  WeeklyPlan,
} from "@/lib/types";

export const STORAGE_KEY = "study-sidekick.next.v1";
export const LEGACY_REMINDERS_KEY = "study-sidekick.reminders.v1";

/** A focus session that survives a reload, driven by the wall clock rather than a tick counter. */
export type { StoredFocusSession };

export type StudySnapshot = {
  /** False during server rendering and the first client paint before storage is read. */
  hydrated: boolean;
  today: string;
  dates: string[];
  assignments: Assignment[];
  availability: DailyAvailability[];
  plan: WeeklyPlan | null;
  reminders: Reminder[];
  focusMinutes: number;
  focusSession: StoredFocusSession;
};

function clampMinutes(value: unknown, fallback: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(max, Math.floor(value)))
    : fallback;
}

function defaultAvailability(dates: string[]): DailyAvailability[] {
  return dates.map((date) => ({ date, minutes: 120 }));
}

function readFocusSession(value: unknown): StoredFocusSession | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<StoredFocusSession>;
  // A session without a usable duration is treated as absent, so the saved
  // preference applies. An explicit 25-minute session is kept exactly.
  const durationMinutes = clampMinutes(candidate.durationMinutes, 0, 180);
  if (durationMinutes <= 0) return null;
  const endsAt = typeof candidate.endsAt === "string" && !Number.isNaN(Date.parse(candidate.endsAt))
    ? candidate.endsAt
    : null;
  const pausedSeconds = typeof candidate.pausedSeconds === "number" && Number.isFinite(candidate.pausedSeconds)
    ? Math.max(0, Math.min(durationMinutes * 60, Math.round(candidate.pausedSeconds)))
    : null;
  return {
    endsAt,
    // A stale deadline from a previous session must not read as a running timer.
    pausedSeconds: endsAt ? null : pausedSeconds,
    durationMinutes,
    sessionId: typeof candidate.sessionId === "string" && candidate.sessionId ? candidate.sessionId : null,
  };
}

/**
 * Older records saved a locale display string instead of an ISO instant;
 * convert what can be parsed so due times stay sortable.
 */
function migrateDueAt(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value.trim())) return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function parseReminders(value: unknown): Reminder[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === "object")
    .map((item) => {
      const reminder = item as { id?: unknown; text?: unknown; dueAt?: unknown; done?: unknown };
      if (typeof reminder.text !== "string" || !reminder.text.trim()) return null;
      return {
        id: typeof reminder.id === "string" && reminder.id ? reminder.id : newId(),
        text: reminder.text,
        dueAt: migrateDueAt(reminder.dueAt),
        done: Boolean(reminder.done),
      };
    })
    .filter((reminder): reminder is Reminder => reminder !== null);
}

/**
 * Turn untrusted browser storage into a usable snapshot.
 *
 * Anything unreadable is dropped rather than thrown on, so a corrupted key can
 * never stop the planner from opening.
 */
/** Parsed storage always yields a focus session, even when the record predates it. */
export type ParsedStudyData = Omit<StoredStudyData, "focusSession"> & { focusSession: StoredFocusSession };

export function parseStoredStudyData(raw: string | null, dates: string[], today: string): ParsedStudyData {
  const empty: ParsedStudyData = {
    assignments: [],
    availability: defaultAvailability(dates),
    plan: null,
    reminders: [],
    focusMinutes: 25,
    focusSession: { endsAt: null, pausedSeconds: null, durationMinutes: 25, sessionId: null },
  };
  if (!raw) return empty;

  let saved: Partial<StoredStudyData> & Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return empty;
    saved = parsed as Partial<StoredStudyData> & Record<string, unknown>;
  } catch {
    return empty;
  }

  const savedAvailability = Array.isArray(saved.availability) ? saved.availability : [];
  const savedPlan = saved.plan && typeof saved.plan === "object"
    && Array.isArray((saved.plan as WeeklyPlan).sessions)
    && typeof (saved.plan as WeeklyPlan).generatedAt === "string"
    ? {
      ...(saved.plan as WeeklyPlan),
      weekStart: typeof (saved.plan as WeeklyPlan).weekStart === "string" ? (saved.plan as WeeklyPlan).weekStart : today,
    }
    : null;

  const savedAssignments = Array.isArray(saved.assignments)
    ? saved.assignments.filter((item): item is Assignment => Boolean(item)
      && typeof item.id === "string" && typeof item.title === "string"
      && typeof item.course === "string" && typeof item.dueDate === "string"
      && typeof item.estimateMinutes === "number")
    : [];

  const focusMinutes = clampMinutes(saved.focusMinutes, 25, 180) || 25;
  // Fall back to the saved preference only when no usable session was stored,
  // so a real 25-minute session is never rewritten to the default length.
  const focusSession = readFocusSession(saved.focusSession)
    ?? { endsAt: null, pausedSeconds: null, durationMinutes: focusMinutes, sessionId: null };

  return {
    assignments: normalizeAssignmentProgress(savedAssignments, savedPlan?.sessions ?? []),
    availability: dates.map((date) => {
      const matching = savedAvailability.find((item) => item && typeof item === "object" && (item as DailyAvailability).date === date);
      return { date, minutes: clampMinutes((matching as DailyAvailability | undefined)?.minutes, 120, 720) };
    }),
    plan: savedPlan,
    reminders: parseReminders(saved.reminders),
    focusMinutes,
    focusSession,
  };
}

/** Preserve reminders from the original static prototype, whose shape differed. */
export function parseLegacyReminders(raw: string | null): Reminder[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const legacy = item as { id?: unknown; text?: unknown; due?: unknown; done?: unknown };
      if (typeof legacy.text !== "string" || !legacy.text.trim()) return [];
      return [{
        id: typeof legacy.id === "string" && legacy.id ? legacy.id : newId(),
        text: legacy.text,
        dueAt: migrateDueAt(legacy.due),
        done: Boolean(legacy.done),
      }];
    });
  } catch {
    return [];
  }
}

/** The snapshot used for server rendering, before any browser storage is available. */
export function serverStudySnapshot(): StudySnapshot {
  const today = "1970-01-01";
  return {
    hydrated: false,
    today,
    dates: [],
    assignments: [],
    availability: [],
    plan: null,
    reminders: [],
    focusMinutes: 25,
    focusSession: { endsAt: null, pausedSeconds: null, durationMinutes: 25, sessionId: null },
  };
}

export function readStudySnapshot(): StudySnapshot {
  const currentDate = localDateKey(new Date());
  const dates = getWeekDates(new Date(`${currentDate}T12:00:00`));

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }

  const data = raw
    ? parseStoredStudyData(raw, dates, currentDate)
    : (() => {
      let legacy: string | null = null;
      try {
        legacy = window.localStorage.getItem(LEGACY_REMINDERS_KEY);
      } catch {
        legacy = null;
      }
      const base = parseStoredStudyData(null, dates, currentDate);
      return { ...base, reminders: parseLegacyReminders(legacy) };
    })();

  return {
    hydrated: true,
    today: currentDate,
    dates,
    assignments: data.assignments,
    availability: data.availability,
    plan: data.plan,
    reminders: data.reminders,
    focusMinutes: data.focusMinutes,
    focusSession: data.focusSession,
  };
}

/** Re-roll the seven-day window onto a new day, keeping assignment-level credit. */
export function rollForwardPlan(plan: WeeklyPlan | null, dates: string[], today: string): WeeklyPlan | null {
  if (!plan || plan.weekStart === today) return plan;
  const activeDates = new Set(dates);
  return {
    ...plan,
    weekStart: today,
    sessions: plan.sessions.filter((session) => activeDates.has(session.date)),
  };
}
