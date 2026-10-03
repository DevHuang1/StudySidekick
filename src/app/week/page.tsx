"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeading } from "@/components/app-shell";
import { useStudy } from "@/app/study-provider";
import { formatDate, formatDueDate } from "@/lib/date-utils";
import { buildSchedule, moveSession } from "@/lib/scheduler";
import type { Assignment } from "@/lib/types";

type PendingMove = { sessionId: string; date: string } | null;

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function minuteLabel(minutes: number) {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

function signatureFor(assignments: Assignment[], availability: { date: string; minutes: number }[]) {
  return JSON.stringify({ assignments, availability });
}

export default function HomePage() {
  const { today, dates, assignments, setAssignments, availability, setAvailability, plan, setPlan, setToast } = useStudy();
  const [pendingMove, setPendingMove] = useState<PendingMove>(null);
  const [moveError, setMoveError] = useState("");

  const horizonEnd = dates.at(-1) ?? "";
  const capacitySignature = useMemo(() => signatureFor(assignments, availability), [assignments, availability]);
  const planIsStale = Boolean(plan && plan.inputSignature !== capacitySignature);
  const schedulePreview = useMemo(() => today ? buildSchedule(assignments, availability, dates, today) : { sessions: [], shortfalls: [], backlog: [] }, [assignments, availability, dates, today]);
  const sessions = plan?.sessions.filter((session) => assignments.some((assignment) => assignment.id === session.assignmentId)) ?? [];
  const plannedMinutes = sessions.reduce((total, session) => total + session.minutes, 0);
  const completedMinutes = sessions.filter((session) => session.completed).reduce((total, session) => total + session.minutes, 0);
  const progress = plannedMinutes ? Math.floor((completedMinutes / plannedMinutes) * 100) : 0;
  const shortfallMinutes = schedulePreview.shortfalls.reduce((total, item) => total + item.minutes, 0);
  const completedBlockCount = sessions.filter((session) => session.completed).length;
  const capacityExceededDates = dates.filter((date) => sessions.filter((session) => session.date === date).reduce((sum, session) => sum + session.minutes, 0) > (availability.find((item) => item.date === date)?.minutes ?? 0));

  function updateAvailability(date: string, hours: number) {
    const minutes = Math.max(0, Math.min(720, Math.round(hours * 60)));
    setAvailability((current) => current.map((day) => day.date === date ? { ...day, minutes } : day));
  }

  function createPlan() {
    if (!today) return;
    if (!assignments.length) {
      setToast("Add an assignment first, then build a useful week plan.");
      return;
    }
    const result = buildSchedule(assignments, availability, dates, today);
    const previous = new Map((plan?.sessions ?? []).map((session) => [session.id, session]));
    const nextSessions = result.sessions.map((session) => {
      const old = previous.get(session.id);
      return old && old.assignmentId === session.assignmentId && old.date === session.date && old.minutes === session.minutes
        ? { ...session, completed: old.completed }
        : session;
    });
    setPlan({ sessions: nextSessions, generatedAt: new Date().toISOString(), inputSignature: capacitySignature });
    setPendingMove(null);
    setToast(result.shortfalls.length ? "Week built. I flagged the work that cannot fit before its deadline." : "Your seven-day plan is ready. Check off or move each block as needed.");
  }

  function toggleSession(sessionId: string, completed: boolean) {
    setPlan((current) => current ? { ...current, sessions: current.sessions.map((session) => session.id === sessionId ? { ...session, completed } : session) } : current);
  }

  function confirmMove() {
    if (!pendingMove || !today) return;
    const moved = moveSession(sessions, pendingMove.sessionId, pendingMove.date, availability, assignments);
    if (moved.error) {
      setMoveError(moved.error);
      return;
    }
    setPlan((current) => current ? { ...current, sessions: current.sessions.map((session) => moved.sessions.find((item) => item.id === session.id) ?? session) } : current);
    setMoveError("");
    setPendingMove(null);
    setToast(`Moved that study block to ${formatDate(pendingMove.date)}.`);
  }

  const milestone = progress === 100 && plannedMinutes > 0
    ? "You kept a promise to yourself. That counts."
    : progress >= 75 ? "Home stretch. One block at a time."
      : progress >= 50 ? "Halfway there. Your effort is adding up."
        : progress >= 25 ? "You’re underway. Keep it small."
          : plannedMinutes > 0 ? "Start with one small block." : "Let’s make a week that fits.";
  const nextSession = sessions.find((session) => !session.completed);
  const nextStepProgress = nextSession && plannedMinutes > 0 ? Math.min(100, Math.floor(((completedMinutes + nextSession.minutes) / plannedMinutes) * 100)) : progress;
  const goalHint = !plannedMinutes ? "Add your first assignment to begin." : progress >= 100 ? "Your planned study time is complete. Take the win." : nextSession ? `Next win: one ${formatMinutes(nextSession.minutes)} block brings you to ${nextStepProgress}%.` : "Your next study block will move the bar forward.";
  const progressPhase = progress >= 100 ? "complete" : progress >= 75 ? "near" : progress >= 50 ? "middle" : progress >= 25 ? "start" : "beginning";

  return <>
    <PageHeading title="A week you can breathe through" description="Turn due dates into small, realistic study blocks. You choose the hours; your plan stays adjustable." aside={<div className="week-chip">{formatDate(today!, { month: "long", day: "numeric" })} — {formatDate(horizonEnd, { month: "long", day: "numeric" })}</div>} />

    <div className="weekly-page">
    <section className="hero-card" aria-label="Weekly progress">
      <div className="hero-copy"><h2>{milestone}</h2><p>{plannedMinutes ? progress === 100 ? "That’s enough for today. Let yourself feel good about it." : "No need to do it all at once. Pick the next block that feels manageable." : "Add your assignments and available hours. We’ll shape them into a week that feels doable."}</p><div className="hero-stat"><span>{completedBlockCount} block{completedBlockCount === 1 ? "" : "s"} checked off</span></div></div>
      <div className={`goal-progress phase-${progressPhase}`}>
        <div className="goal-progress-top"><div className="goal-percent">{progress}<span>%</span></div><div className="goal-copy"><b>Study progress</b><span>{goalHint}</span></div></div>
        <div className="goal-track" role="progressbar" aria-label="Weekly study progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={`${formatMinutes(completedMinutes)} of ${formatMinutes(plannedMinutes)} planned study time complete`}><span className="goal-fill" style={{ width: `${progress}%` }} />{[25, 50, 75, 100].map((target) => <i className={progress >= target ? "goal-marker reached" : "goal-marker"} key={target} style={{ left: `${target}%` }} aria-hidden="true" />)}</div>
        <div className="goal-meta"><span>{formatMinutes(completedMinutes)} done</span><span>{formatMinutes(plannedMinutes)} planned</span></div>
      </div>
    </section>

    <section className="panel week-panel" aria-labelledby="plan-heading">
      <div className="panel-header"><div><h2 className="panel-title" id="plan-heading">Your study week</h2><p className="panel-subtitle">{plan ? `Built ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(plan.generatedAt))}` : "Set your daily hours, then build the week."}{planIsStale ? " · Rebuild to apply changes." : ""}</p></div><button className="build-button" type="button" onClick={createPlan}>{plan ? "Rebuild week" : "Build my week"}</button></div>
      {!assignments.length && <div className="plan-alert"><span className="alert-icon" aria-hidden="true">↗</span><span>Start by adding a deadline and an estimate for the work.</span><Link className="text-link" href="/assignments">Go to assignments</Link></div>}
      <div className="availability-strip" aria-label="Available study hours for each day">{dates.map((date) => {
        const hours = (availability.find((item) => item.date === date)?.minutes ?? 120) / 60;
        return <label className={`availability-item${date === today ? " today" : ""}`} key={date}><span className="availability-day">{formatDate(date, { weekday: "short" })}</span><span className="availability-date">{formatDate(date, { month: "numeric", day: "numeric" })}</span><span className="sr-only">Hours available on {formatDate(date)}</span><input className="availability-input" type="number" min="0" max="12" step="0.5" value={hours} onChange={(event) => updateAvailability(date, Number(event.target.value) || 0)} aria-label={`Available study hours on ${formatDate(date)}`} /><span className="availability-unit">hours</span></label>;
      })}</div>
      {planIsStale && <div className="plan-alert"><span className="alert-icon" aria-hidden="true">↻</span><span>Your assignments or available hours changed after this plan was built. The saved sessions stay unchanged until you choose <strong>Rebuild my week</strong>.</span></div>}
      {shortfallMinutes > 0 && <div className="plan-alert overload"><span className="alert-icon" aria-hidden="true">!</span><span><strong>{formatMinutes(shortfallMinutes)} will not fit before the due date{schedulePreview.shortfalls.length === 1 ? "" : "s"}.</strong> Consider adding study time, starting earlier, reducing scope, or asking for an extension. The plan does not move deadlines or overbook a day.</span></div>}
      {capacityExceededDates.length > 0 && <div className="plan-alert overload"><span className="alert-icon" aria-hidden="true">!</span><span>Some saved blocks exceed the updated daily hours. Rebuild your week to fit the new capacity.</span></div>}
      {moveError && <div className="plan-alert overload" role="alert"><span className="alert-icon" aria-hidden="true">!</span><span>{moveError}</span></div>}
      {pendingMove && <div className="plan-alert"><span className="alert-icon" aria-hidden="true">↗</span><span>Preview: move {formatMinutes(sessions.find((session) => session.id === pendingMove.sessionId)?.minutes ?? 0)} to <strong>{formatDate(pendingMove.date)}</strong>? This saves only when you confirm.</span><div className="inline-actions"><button className="quiet-button" type="button" onClick={confirmMove}>Confirm</button><button className="quiet-button" type="button" onClick={() => { setPendingMove(null); setMoveError(""); }}>Cancel</button></div></div>}
      <div className="day-grid">{dates.map((date, index) => {
        const daySessions = sessions.filter((session) => session.date === date);
        const available = availability.find((item) => item.date === date)?.minutes ?? 0;
        const planned = daySessions.reduce((total, session) => total + session.minutes, 0);
        const pct = available ? Math.min(100, planned / available * 100) : planned > 0 ? 100 : 0;
        return <article className={`day-card${date === today ? " today" : ""}${planned > available ? " overbooked" : ""}`} key={date}>
          <div className="day-head"><div className="day-name"><strong>{index === 0 ? "Today" : formatDate(date, { weekday: "short" })}</strong><span>{formatDate(date, { month: "short", day: "numeric" })}</span></div></div>
          <div className="load-bar" aria-label={`${formatMinutes(planned)} planned out of ${formatMinutes(available)} available`}><span style={{ width: `${pct}%` }} /></div>
          {daySessions.length ? <div className="session-list">{daySessions.map((session) => {
            const assignment = assignments.find((item) => item.id === session.assignmentId);
            if (!assignment) return null;
            const selectedMove = pendingMove?.sessionId === session.id ? pendingMove.date : "";
            const moveOptions = dates.filter((candidate) => candidate >= today! && candidate <= assignment.dueDate && candidate !== session.date);
            return <div className={`session-row${session.completed ? " session-done" : ""}`} key={session.id}><input className="session-check" type="checkbox" checked={session.completed} onChange={(event) => toggleSession(session.id, event.target.checked)} aria-label={`${session.completed ? "Mark incomplete" : "Complete"}: ${assignment.title}, ${formatMinutes(session.minutes)}`} /><div className="session-main"><span className="session-title">{assignment.title}</span><span className="session-course">{assignment.course} · {formatDueDate(assignment.dueDate, today!)}</span></div><span className="session-duration">{formatMinutes(session.minutes)}</span><div className="move-control"><label htmlFor={`move-${session.id}`}>Move:</label><select id={`move-${session.id}`} className="move-select" value={selectedMove} onChange={(event) => { setMoveError(""); setPendingMove(event.target.value ? { sessionId: session.id, date: event.target.value } : null); }} aria-label={`Preview a new date for ${assignment.title}`}><option value="">Choose a day</option>{moveOptions.map((candidate) => <option key={candidate} value={candidate}>{formatDate(candidate)}</option>)}</select></div></div>;
          })}</div> : <div className="empty-day"><strong>{available ? "Open study time" : "A day off"}</strong>{available ? "No blocks scheduled yet." : "No hours set aside."}</div>}
          <div className="day-available"><span>Planned <b>{formatMinutes(planned)}</b></span><span>Available <b>{minuteLabel(available)}</b></span></div>
        </article>;
      })}</div>
      <div className="panel-footnote">Larger assignments are split into short blocks (usually 25–60 minutes). Due dates come first; study blocks never exceed the daily hours you set.</div>
    </section>

    <section className="panel subsection" aria-labelledby="backlog-heading"><div className="subsection-heading"><h3 id="backlog-heading">Coming up after this week</h3></div>{schedulePreview.backlog.length ? <div className="backlog-list">{schedulePreview.backlog.map((assignment) => <div className="backlog-row" key={assignment.id}><div className="backlog-copy"><strong>{assignment.title}</strong><span>{assignment.course} · {formatDueDate(assignment.dueDate, today!)}</span></div><span className="backlog-minutes">{formatMinutes(assignment.estimateMinutes)}</span></div>)}</div> : <div className="empty-list">Assignments due after the next seven days will appear here.</div>}</section>
    </div>
  </>;
}
