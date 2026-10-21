"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type SetStateAction,
} from "react";
import { localDateKey } from "@/lib/date-utils";
import {
  attachCrossTabSync,
  getClockSignal,
  getServerStudySnapshot,
  getStudySnapshot,
  subscribeToClockSignal,
  subscribeToStudy,
  syncToday,
  updateAssignments as storeUpdateAssignments,
  updateAvailability as storeUpdateAvailability,
  updateFocusMinutes as storeUpdateFocusMinutes,
  updateFocusSession as storeUpdateFocusSession,
  updatePlan as storeUpdatePlan,
  updateReminders as storeUpdateReminders,
} from "@/lib/study-store";
import type { Assignment, DailyAvailability, Reminder, WeeklyPlan } from "@/lib/types";

export type StudyContextValue = {
  today: string | null;
  dates: string[];
  ready: boolean;
  assignments: Assignment[];
  setAssignments: (action: SetStateAction<Assignment[]>) => void;
  availability: DailyAvailability[];
  setAvailability: (action: SetStateAction<DailyAvailability[]>) => void;
  plan: WeeklyPlan | null;
  setPlan: (action: SetStateAction<WeeklyPlan | null>) => void;
  reminders: Reminder[];
  setReminders: (action: SetStateAction<Reminder[]>) => void;
  focusMinutes: number;
  setFocusLength: (minutes: number) => void;
  timerDurationMinutes: number;
  secondsRemaining: number;
  timerRunning: boolean;
  activeFocusSessionId: string | null;
  clearFocusSession: () => void;
  startTimer: (minutes?: number) => void;
  startPlannedFocus: (sessionId: string, minutes: number) => boolean;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  toast: string;
  setToast: (message: string) => void;
};

const StudyContext = createContext<StudyContextValue | null>(null);

function safeDuration(minutes: number): number {
  return Math.max(1, Math.min(180, Math.round(minutes)));
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const { hydrated, today, dates, assignments, availability, plan, reminders, focusMinutes, focusSession } =
    useSyncExternalStore(subscribeToStudy, getStudySnapshot, getServerStudySnapshot);

  // Subscribing only while a timer is running keeps the clock store idle otherwise.
  const endsAt = focusSession.endsAt;
  const now = useSyncExternalStore(subscribeToClockSignal, getClockSignal, getClockSignal);

  const [toast, setToastState] = useState("");
  const announcedRun = useRef<string | null>(null);

  const setAssignments = useCallback((action: SetStateAction<Assignment[]>) => storeUpdateAssignments(action), []);
  const setAvailability = useCallback((action: SetStateAction<DailyAvailability[]>) => storeUpdateAvailability(action), []);
  const setPlan = useCallback((action: SetStateAction<WeeklyPlan | null>) => storeUpdatePlan(action), []);
  const setReminders = useCallback((action: SetStateAction<Reminder[]>) => storeUpdateReminders(action), []);
  const setToast = useCallback((message: string) => setToastState(message), []);

  const endsAtMs = endsAt ? Date.parse(endsAt) : null;
  const secondsRemaining = endsAtMs !== null
    ? Math.max(0, Math.ceil((endsAtMs - now) / 1000))
    : focusSession.pausedSeconds ?? focusSession.durationMinutes * 60;
  const timerRunning = endsAtMs !== null && secondsRemaining > 0;

  // Adopt writes made by other open tabs.
  useEffect(() => attachCrossTabSync(), []);

  // Roll the seven-day window forward when the calendar date changes, even when
  // a tab stays open past midnight.
  useEffect(() => {
    if (!hydrated) return;
    const checkDate = () => {
      const currentDate = localDateKey(new Date());
      if (currentDate !== today) syncToday(currentDate);
    };
    checkDate();
    const interval = window.setInterval(checkDate, 60_000);
    window.addEventListener("visibilitychange", checkDate);
    window.addEventListener("focus", checkDate);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("visibilitychange", checkDate);
      window.removeEventListener("focus", checkDate);
    };
  }, [hydrated, today]);

  // Stop the clock at zero and report completion once per run.
  useEffect(() => {
    if (endsAt === null || secondsRemaining > 0) return;
    if (announcedRun.current === endsAt) return;
    announcedRun.current = endsAt;
    storeUpdateFocusSession({ ...focusSession, endsAt: null, pausedSeconds: 0 });
    setToastState(focusSession.sessionId
      ? "Focus block finished — confirm it below to record the time."
      : "Focus session complete — nice work. Take a short break before the next block.");
  }, [endsAt, secondsRemaining, focusSession]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToastState(""), 4400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const startTimer = useCallback((minutes = focusMinutes) => {
    const duration = safeDuration(minutes);
    // Deliberately leaves the saved focusMinutes preference untouched, so an
    // assistant-requested length cannot overwrite the user's chosen default.
    storeUpdateFocusSession({
      endsAt: new Date(Date.now() + duration * 60_000).toISOString(),
      pausedSeconds: null,
      durationMinutes: duration,
      sessionId: null,
    });
  }, [focusMinutes]);

  const startPlannedFocus = useCallback((sessionId: string, minutes: number) => {
    const duration = safeDuration(minutes);
    storeUpdateFocusSession({
      endsAt: new Date(Date.now() + duration * 60_000).toISOString(),
      pausedSeconds: null,
      durationMinutes: duration,
      sessionId,
    });
    return true;
  }, []);

  const pauseTimer = useCallback(() => {
    storeUpdateFocusSession({
      endsAt: null,
      pausedSeconds: Math.max(0, secondsRemaining),
      durationMinutes: focusSession.durationMinutes,
      sessionId: focusSession.sessionId,
    });
  }, [secondsRemaining, focusSession]);

  const resumeTimer = useCallback(() => {
    const remaining = focusSession.pausedSeconds ?? secondsRemaining;
    if (remaining <= 0) return;
    storeUpdateFocusSession({
      endsAt: new Date(Date.now() + remaining * 1000).toISOString(),
      pausedSeconds: null,
      durationMinutes: focusSession.durationMinutes,
      sessionId: focusSession.sessionId,
    });
  }, [focusSession, secondsRemaining]);

  const resetTimer = useCallback(() => {
    storeUpdateFocusSession({ endsAt: null, pausedSeconds: null, durationMinutes: focusMinutes, sessionId: null });
  }, [focusMinutes]);

  const clearFocusSession = useCallback(() => {
    storeUpdateFocusSession({ ...focusSession, sessionId: null });
  }, [focusSession]);

  const setFocusLength = useCallback((minutes: number) => {
    const duration = safeDuration(minutes);
    storeUpdateFocusMinutes(duration);
    storeUpdateFocusSession({ endsAt: null, pausedSeconds: null, durationMinutes: duration, sessionId: null });
  }, []);

  const value = useMemo<StudyContextValue>(() => ({
    today: hydrated ? today : null,
    dates,
    ready: hydrated,
    assignments,
    setAssignments,
    availability,
    setAvailability,
    plan,
    setPlan,
    reminders,
    setReminders,
    focusMinutes,
    setFocusLength,
    timerDurationMinutes: focusSession.durationMinutes,
    secondsRemaining,
    timerRunning,
    activeFocusSessionId: focusSession.sessionId,
    clearFocusSession,
    startTimer,
    startPlannedFocus,
    pauseTimer,
    resumeTimer,
    resetTimer,
    toast,
    setToast,
  }), [hydrated, today, dates, assignments, setAssignments, availability, setAvailability, plan, setPlan,
    reminders, setReminders, focusMinutes, setFocusLength, focusSession, secondsRemaining, timerRunning,
    clearFocusSession, startTimer, startPlannedFocus, pauseTimer, resumeTimer, resetTimer, toast, setToast]);

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) throw new Error("useStudy must be used inside StudyProvider");
  return context;
}
