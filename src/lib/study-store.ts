import { getWeekDates } from "@/lib/date-utils";
import type { SetStateAction } from "react";
import type { Assignment, DailyAvailability, Reminder, StoredStudyData, StudyLogEntry, WeeklyPlan } from "@/lib/types";
import {
  LEGACY_REMINDERS_KEY,
  readStudySnapshot,
  rollForwardPlan,
  serverStudySnapshot,
  STORAGE_KEY,
  type StoredFocusSession,
  type StudySnapshot,
} from "@/lib/study-storage";

type Listener = () => void;

const listeners = new Set<Listener>();
let snapshot: StudySnapshot | null = null;

// The wall clock is shared external state, so it lives beside the study snapshot
// rather than in React state; a paused interval stops it entirely.
let clock = Date.now();
let clockTimer: number | null = null;
const clockListeners = new Set<Listener>();

function emitClock() {
  for (const listener of clockListeners) listener();
}

function setClock(next: number) {
  clock = next;
  emitClock();
}

function syncClockTimer() {
  // Keep the interval alive only while a session runs and someone is listening.
  const shouldRun = clockListeners.size > 0 && currentSnapshot().focusSession.endsAt !== null;
  if (shouldRun && clockTimer === null) {
    clockTimer = window.setInterval(() => setClock(Date.now()), 1000);
  } else if (!shouldRun && clockTimer !== null) {
    window.clearInterval(clockTimer);
    clockTimer = null;
  }
}

function subscribeToClock(listener: Listener): () => void {
  clockListeners.add(listener);
  syncClockTimer();
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0) syncClockTimer();
  };
}

function getClock(): number {
  return clock;
}

function emit() {
  for (const listener of listeners) listener();
}

/** Cached so getSnapshot returns a stable reference between writes. */
function currentSnapshot(): StudySnapshot {
  snapshot ??= readStudySnapshot();
  return snapshot;
}

function commit(next: StudySnapshot, persist: boolean) {
  snapshot = next;
  syncClockTimer();
  // Timer deadlines are absolute, so a write must not restart the countdown.
  if (next.focusSession.endsAt) setClock(Date.now());
  if (persist) {
    const data: StoredStudyData & { focusSession: StoredFocusSession } = {
      assignments: next.assignments,
      availability: next.availability,
      plan: next.plan,
      reminders: next.reminders,
      studyLog: next.studyLog,
      focusMinutes: next.focusMinutes,
      focusSession: next.focusSession,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Browser storage is unavailable; the page stays usable but changes will not survive a refresh.
    }
  }
  emit();
}

let storageListenerAttached = false;

/** Another tab wrote the same key; adopt its data so both views agree. */
function handleStorageEvent(event: StorageEvent) {
  if (event.key !== null && event.key !== STORAGE_KEY && event.key !== LEGACY_REMINDERS_KEY) return;
  snapshot = readStudySnapshot();
  syncClockTimer();
  emit();
}

export function attachCrossTabSync(): () => void {
  if (storageListenerAttached || typeof window === "undefined") return () => {};
  storageListenerAttached = true;
  window.addEventListener("storage", handleStorageEvent);
  return () => {
    window.removeEventListener("storage", handleStorageEvent);
    storageListenerAttached = false;
  };
}

export function subscribeToStudy(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getStudySnapshot(): StudySnapshot {
  return currentSnapshot();
}

// useSyncExternalStore requires a stable reference for the unhydrated render.
const serverSnapshot = serverStudySnapshot();

export function getServerStudySnapshot(): StudySnapshot {
  return serverSnapshot;
}

/** Apply a change to stored study data and notify subscribers. */
export function updateStudyData(updater: (current: StudySnapshot) => StudySnapshot) {
  commit(updater(currentSnapshot()), true);
}

/** Accept both a value and an updater, matching useState's calling convention. */
function resolve<T>(action: SetStateAction<T>, current: T): T {
  return typeof action === "function" ? (action as (previous: T) => T)(current) : action;
}

export function subscribeToClockSignal(listener: Listener): () => void {
  return subscribeToClock(listener);
}

export function getClockSignal(): number {
  return getClock();
}

export function updateAssignments(action: SetStateAction<Assignment[]>) {
  updateStudyData((current) => ({ ...current, assignments: resolve(action, current.assignments) }));
}

export function updateAvailability(action: SetStateAction<DailyAvailability[]>) {
  updateStudyData((current) => ({ ...current, availability: resolve(action, current.availability) }));
}

export function updatePlan(action: SetStateAction<WeeklyPlan | null>) {
  updateStudyData((current) => ({ ...current, plan: resolve(action, current.plan) }));
}

export function updateReminders(action: SetStateAction<Reminder[]>) {
  updateStudyData((current) => ({ ...current, reminders: resolve(action, current.reminders) }));
}

export function updateStudyLog(action: SetStateAction<StudyLogEntry[]>) {
  updateStudyData((current) => ({ ...current, studyLog: resolve(action, current.studyLog) }));
}

export function updateFocusMinutes(minutes: number) {
  updateStudyData((current) => ({ ...current, focusMinutes: minutes }));
}

export function updateFocusSession(focusSession: StoredFocusSession) {
  updateStudyData((current) => ({ ...current, focusSession }));
}

/** Advance the seven-day window when the calendar date changes. */
export function syncToday(today: string) {
  const current = currentSnapshot();
  if (current.today === today) return;
  const dates = getWeekDates(new Date(`${today}T12:00:00`));
  updateStudyData((state) => ({
    ...state,
    today,
    dates,
    availability: dates.map((date) => state.availability.find((day) => day.date === date) ?? { date, minutes: 120 }),
    plan: rollForwardPlan(state.plan, dates, today),
  }));
}

