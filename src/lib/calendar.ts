import { addDays } from "@/lib/date-utils";
import type { Assignment, Reminder, WeeklyPlan } from "@/lib/types";

type CalendarSource = {
  plan: WeeklyPlan | null;
  assignments: Assignment[];
  reminders: Reminder[];
  dates: string[];
  generatedAt?: Date;
};

type CalendarEvent = {
  uid: string;
  lines: string[];
};

const encoder = new TextEncoder();
const REMINDER_DURATION_MINUTES = 15;
const MAX_LINE_OCTETS = 75;

export function calendarFileName(weekStart: string | undefined): string {
  return `study-sidekick-${weekStart ?? "week"}.ics`;
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function byteLength(value: string): number {
  return encoder.encode(value).length;
}

/** RFC 5545 folds long lines at 75 octets, with each continuation starting with a space. */
export function foldCalendarLine(line: string): string {
  if (byteLength(line) <= MAX_LINE_OCTETS) return line;
  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  let first = true;
  for (const character of line) {
    const characterBytes = byteLength(character);
    const limit = first ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1;
    if (currentBytes + characterBytes > limit) {
      parts.push(current);
      current = " ";
      currentBytes = 1;
      first = false;
    }
    current += character;
    currentBytes += characterBytes;
  }
  if (current) parts.push(current);
  return parts.join("\r\n");
}

function compactUtc(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function dateValue(key: string): string {
  return key.replace(/-/g, "");
}

function studyEvents(source: CalendarSource): CalendarEvent[] {
  if (!source.plan) return [];
  const dates = new Set(source.dates);
  const assignmentById = new Map(source.assignments.map((assignment) => [assignment.id, assignment]));
  const usedUids = new Set<string>();
  const events: CalendarEvent[] = [];

  for (const session of source.plan.sessions) {
    if (!dates.has(session.date)) continue;
    const assignment = assignmentById.get(session.assignmentId);
    if (!assignment) continue;
    const baseUid = `study-${session.id}@study-sidekick.local`;
    let uid = baseUid;
    let suffix = 2;
    while (usedUids.has(uid)) uid = `${baseUid}-${suffix++}`;
    usedUids.add(uid);
    const description = `${assignment.course} · ${session.minutes} min planned${session.completed ? " · completed" : ""} · Study Sidekick`;
    events.push({
      uid,
      lines: [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${compactUtc(source.generatedAt ?? new Date())}`,
        `DTSTART;VALUE=DATE:${dateValue(session.date)}`,
        `DTEND;VALUE=DATE:${dateValue(addDays(session.date, 1))}`,
        `SUMMARY:${escapeText(assignment.title)}`,
        `DESCRIPTION:${escapeText(description)}`,
        "TRANSP:TRANSPARENT",
        "CATEGORIES:Study",
        "END:VEVENT",
      ],
    });
  }

  return events.sort((left, right) => left.lines[3].localeCompare(right.lines[3]));
}

function reminderEvents(source: CalendarSource): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const usedUids = new Set<string>();
  for (const reminder of source.reminders) {
    if (reminder.done || !reminder.dueAt) continue;
    const start = new Date(reminder.dueAt);
    if (Number.isNaN(start.valueOf())) continue;
    const end = new Date(start.getTime() + REMINDER_DURATION_MINUTES * 60_000);
    const baseUid = `reminder-${reminder.id}@study-sidekick.local`;
    let uid = baseUid;
    let suffix = 2;
    while (usedUids.has(uid)) uid = `${baseUid}-${suffix++}`;
    usedUids.add(uid);
    events.push({
      uid,
      lines: [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${compactUtc(source.generatedAt ?? new Date())}`,
        `DTSTART:${compactUtc(start)}`,
        `DTEND:${compactUtc(end)}`,
        `SUMMARY:${escapeText(`Reminder · ${reminder.text}`)}`,
        `DESCRIPTION:${escapeText("From Study Sidekick. The app itself does not send notifications.")}`,
        "TRANSP:TRANSPARENT",
        "CATEGORIES:Reminder",
        "END:VEVENT",
      ],
    });
  }
  return events.sort((left, right) => left.lines[3].localeCompare(right.lines[3]));
}

export function countCalendarItems(source: Omit<CalendarSource, "generatedAt">): { studyBlocks: number; reminders: number; total: number } {
  const studyBlocks = studyEvents(source).length;
  const reminders = reminderEvents(source).length;
  return { studyBlocks, reminders, total: studyBlocks + reminders };
}

/** Build a standards-compliant calendar without sending any study data to a server. */
export function buildStudyCalendar(source: CalendarSource): string {
  const events = [...studyEvents(source), ...reminderEvents(source)];
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Study Sidekick//Study Week//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Study Sidekick",
    "X-WR-CALDESC:Study blocks and reminders from Study Sidekick",
    ...events.flatMap((event) => event.lines),
    "END:VCALENDAR",
  ];
  return `${lines.map(foldCalendarLine).join("\r\n")}\r\n`;
}
