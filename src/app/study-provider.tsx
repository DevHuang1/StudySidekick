"use client";

import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { getWeekDates, localDateKey } from "@/lib/date-utils";
import type { Assignment, DailyAvailability, Reminder, StoredStudyData, WeeklyPlan } from "@/lib/types";

const STORAGE_KEY = "study-sidekick.next.v1";
const LEGACY_REMINDERS_KEY = "study-sidekick.reminders.v1";

type StudyContextValue = {
  today: string | null;
  dates: string[];
  ready: boolean;
  assignments: Assignment[];
  setAssignments: Dispatch<SetStateAction<Assignment[]>>;
  availability: DailyAvailability[];
  setAvailability: Dispatch<SetStateAction<DailyAvailability[]>>;
  plan: WeeklyPlan | null;
  setPlan: Dispatch<SetStateAction<WeeklyPlan | null>>;
  reminders: Reminder[];
  setReminders: Dispatch<SetStateAction<Reminder[]>>;
  focusMinutes: number;
  setFocusMinutes: Dispatch<SetStateAction<number>>;
  secondsRemaining: number;
  setSecondsRemaining: Dispatch<SetStateAction<number>>;
  timerRunning: boolean;
  setTimerRunning: Dispatch<SetStateAction<boolean>>;
  startTimer: (minutes?: number) => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  toast: string;
  setToast: Dispatch<SetStateAction<string>>;
};

const StudyContext = createContext<StudyContextValue | null>(null);

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultAvailability(dates: string[]): DailyAvailability[] {
  return dates.map((date) => ({ date, minutes: 120 }));
}

function loadSavedData(dates: string[]): StoredStudyData {
  const initial: StoredStudyData = {
    assignments: [], availability: defaultAvailability(dates), plan: null,
    reminders: [], focusMinutes: 25,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<StoredStudyData>;
      const savedAvailability = Array.isArray(saved.availability) ? saved.availability : [];
      return {
        assignments: Array.isArray(saved.assignments)
          ? saved.assignments.filter((item) => item && typeof item.id === "string" && typeof item.title === "string" && typeof item.course === "string" && typeof item.dueDate === "string" && typeof item.estimateMinutes === "number")
          : [],
        availability: dates.map((date) => {
          const matching = savedAvailability.find((item) => item?.date === date);
          return { date, minutes: typeof matching?.minutes === "number" ? Math.max(0, Math.min(720, matching.minutes)) : 120 };
        }),
        plan: saved.plan && Array.isArray(saved.plan.sessions) && typeof saved.plan.generatedAt === "string" ? saved.plan : null,
        reminders: Array.isArray(saved.reminders) ? saved.reminders.filter((item) => item && typeof item.id === "string" && typeof item.text === "string") : [],
        focusMinutes: typeof saved.focusMinutes === "number" ? Math.max(1, Math.min(180, saved.focusMinutes)) : 25,
      };
    }

    // Preserve reminders from the original static prototype.
    const legacy = localStorage.getItem(LEGACY_REMINDERS_KEY);
    if (legacy) {
      const reminders = JSON.parse(legacy) as Array<{ id?: string; text?: string; due?: string; done?: boolean }>;
      if (Array.isArray(reminders)) {
        initial.reminders = reminders
          .filter((item) => typeof item.text === "string")
          .map((item) => ({ id: item.id || newId(), text: item.text!, dueAt: item.due || null, done: Boolean(item.done) }));
      }
    }
  } catch {
    // Invalid browser data should not stop the planner from opening.
  }
  return initial;
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState<string | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availability, setAvailability] = useState<DailyAvailability[]>([]);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const currentDate = localDateKey(new Date());
    const nextDates = getWeekDates(new Date(`${currentDate}T12:00:00`));
    const saved = loadSavedData(nextDates);
    setToday(currentDate);
    setDates(nextDates);
    setAssignments(saved.assignments);
    setAvailability(saved.availability);
    setPlan(saved.plan);
    setReminders(saved.reminders);
    setFocusMinutes(saved.focusMinutes);
    setSecondsRemaining(saved.focusMinutes * 60);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const saved: StoredStudyData = { assignments, availability, plan, reminders, focusMinutes };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      setToast("Browser storage is unavailable. Your latest changes may not survive a refresh.");
    }
  }, [ready, assignments, availability, plan, reminders, focusMinutes]);

  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => setSecondsRemaining((remaining) => Math.max(0, remaining - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning]);

  useEffect(() => {
    if (timerRunning && secondsRemaining === 0) {
      setTimerRunning(false);
      setToast("Focus session complete — nice work. Take a short break before the next block.");
    }
  }, [timerRunning, secondsRemaining]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 4400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function startTimer(minutes = focusMinutes) {
    const safeMinutes = Math.max(1, Math.min(180, minutes));
    setFocusMinutes(safeMinutes);
    setSecondsRemaining(safeMinutes * 60);
    setTimerRunning(true);
  }

  function pauseTimer() { setTimerRunning(false); }
  function resetTimer() { setTimerRunning(false); setSecondsRemaining(focusMinutes * 60); }

  const value = useMemo<StudyContextValue>(() => ({
    today, dates, ready, assignments, setAssignments, availability, setAvailability,
    plan, setPlan, reminders, setReminders, focusMinutes, setFocusMinutes,
    secondsRemaining, setSecondsRemaining, timerRunning, setTimerRunning,
    startTimer, pauseTimer, resetTimer, toast, setToast,
  }), [today, dates, ready, assignments, availability, plan, reminders, focusMinutes, secondsRemaining, timerRunning, toast]);

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) throw new Error("useStudy must be used inside StudyProvider");
  return context;
}
