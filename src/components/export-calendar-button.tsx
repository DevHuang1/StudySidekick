"use client";

import { useMemo } from "react";
import { useStudy } from "@/app/study-provider";
import { buildStudyCalendar, calendarFileName, countCalendarItems } from "@/lib/calendar";

export function ExportCalendarButton() {
  const { today, dates, plan, assignments, reminders, setToast } = useStudy();
  const counts = useMemo(
    () => countCalendarItems({ plan, assignments, reminders, dates }),
    [plan, assignments, reminders, dates],
  );

  function downloadCalendar() {
    if (!today || counts.total === 0) return;
    const calendar = buildStudyCalendar({ plan, assignments, reminders, dates });
    const blob = new Blob([calendar], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = calendarFileName(plan?.weekStart ?? dates[0] ?? today);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    const blockLabel = `${counts.studyBlocks} study block${counts.studyBlocks === 1 ? "" : "s"}`;
    const reminderLabel = counts.reminders
      ? ` and ${counts.reminders} dated reminder${counts.reminders === 1 ? "" : "s"}`
      : "";
    setToast(`Calendar downloaded with ${blockLabel}${reminderLabel}.`);
  }

  const disabled = counts.total === 0;
  const hint = disabled
    ? "Add a study plan or a dated reminder first."
    : "Download this week's blocks and active dated reminders as an .ics file.";

  return <button className="quiet-button export-calendar-button" type="button" onClick={downloadCalendar} disabled={disabled} title={hint} aria-label={hint}>
    <span aria-hidden="true">↓</span> Export .ics
  </button>;
}
