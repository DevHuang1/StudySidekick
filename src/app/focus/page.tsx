"use client";

import { useMemo, useState } from "react";
import { PageHeading } from "@/components/app-shell";
import { useStudy } from "@/app/study-provider";
import { formatDate } from "@/lib/date-utils";
import { completePlannedSession } from "@/lib/progress";

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export default function FocusPage() {
  const {
    dates, assignments, setAssignments, plan, setPlan,
    focusMinutes, setFocusLength, timerDurationMinutes, secondsRemaining,
    timerRunning, setTimerRunning, activeFocusSessionId, clearFocusSession,
    startTimer, startPlannedFocus, pauseTimer, resetTimer, setToast,
  } = useStudy();
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const focusableSessions = useMemo(() => (plan?.sessions ?? [])
    .filter((session) => !session.completed
      && dates.includes(session.date)
      && assignments.some((assignment) => assignment.id === session.assignmentId))
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date)), [plan, dates, assignments]);
  const selectedSession = focusableSessions.find((session) => session.id === selectedSessionId);
  const activeSession = plan?.sessions.find((session) => session.id === activeFocusSessionId) ?? null;
  const activeAssignment = activeSession
    ? assignments.find((assignment) => assignment.id === activeSession.assignmentId) ?? null
    : null;
  const timerClock = `${String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:${String(secondsRemaining % 60).padStart(2, "0")}`;
  const paused = secondsRemaining > 0 && secondsRemaining < timerDurationMinutes * 60;
  const timerFinished = secondsRemaining === 0 && !timerRunning;
  const linkedTargetChanged = Boolean(activeFocusSessionId
    && (!activeSession || !activeAssignment || activeSession.minutes !== timerDurationMinutes));
  const linkedTargetAlreadyDone = Boolean(activeSession?.completed);

  function startOrToggleTimer() {
    if (timerRunning) {
      pauseTimer();
      return;
    }
    if (paused) {
      setTimerRunning(true);
      return;
    }
    if (activeFocusSessionId && secondsRemaining === 0) return;
    if (selectedSession) {
      if (!startPlannedFocus(selectedSession.id, selectedSession.minutes)) {
        setToast("A focus session is already running. Open it before starting another.");
        return;
      }
      setSelectedSessionId("");
      return;
    }
    startTimer();
  }

  function markBlockComplete() {
    if (!activeFocusSessionId) return;
    const assignmentTitle = activeAssignment?.title ?? "Study block";
    const result = completePlannedSession(plan, assignments, activeFocusSessionId, timerDurationMinutes);
    if (result.completed) {
      setPlan(result.plan);
      setAssignments(result.assignments);
      setToast(`Marked “${assignmentTitle}” complete.`);
    } else {
      setToast("That block has already changed in your plan.");
    }
    clearFocusSession();
  }

  function leaveBlockOpen() {
    clearFocusSession();
    setSelectedSessionId("");
    setToast("Left the study block open for later.");
  }

  function dismissChangedBlock() {
    clearFocusSession();
    setToast("The timer finished; your updated plan was left unchanged.");
  }

  const timerButtonLabel = timerRunning
    ? "Pause focus"
    : paused ? "Resume focus"
      : activeFocusSessionId && timerFinished ? "Block timer complete"
        : selectedSession ? "Start this block" : timerFinished ? "Start again" : "Start focus";

  return <>
    <PageHeading title="Make room to focus" description="Set aside a small stretch for one task. The timer keeps going if you visit another page." />
    <div className="focus-layout">
      <section className="panel focus-card" aria-labelledby="focus-heading">
        <h2 className="sr-only" id="focus-heading">Focus timer</h2>
        {activeFocusSessionId && <div className="focus-linked-block" aria-live="polite">
          {activeSession && activeAssignment
            ? <><span>Planned block</span><strong>{activeAssignment.title}</strong><small>{activeAssignment.course} · {formatDate(activeSession.date, { weekday: "short", month: "short", day: "numeric" })} · {formatMinutes(activeSession.minutes)}</small></>
            : <span>This block changed in your plan. The timer won’t update it.</span>}
        </div>}
        <div className="timer-face focus-timer-face" aria-live="off">{timerClock.slice(0, 2)}<span>:</span>{timerClock.slice(3)}</div>
        <div className="timer-state" aria-live="polite">{timerRunning ? "Focus session in progress" : timerFinished ? activeFocusSessionId ? "Block timer complete — your progress is ready to confirm" : "Session complete — nice work" : paused ? "Paused" : `${timerDurationMinutes}-minute session ready`}</div>
        <div className="timer-controls"><button className="primary-button" type="button" onClick={startOrToggleTimer} disabled={Boolean(activeFocusSessionId && timerFinished)}>{timerButtonLabel}</button><button className="timer-reset" type="button" onClick={() => { resetTimer(); setSelectedSessionId(""); }} aria-label="Reset focus timer">↻</button></div>

        {timerFinished && activeFocusSessionId && <div className="focus-completion" role="status">
          {linkedTargetChanged
            ? <><p>This block no longer exists in the plan, so no progress was changed.</p><button className="quiet-button" type="button" onClick={dismissChangedBlock}>Dismiss</button></>
            : linkedTargetAlreadyDone
              ? <><p>This block is already marked complete in your week.</p><button className="quiet-button" type="button" onClick={dismissChangedBlock}>Done</button></>
              : <><p>Did you finish <strong>{activeAssignment?.title}</strong>?</p><div className="focus-completion-actions"><button className="primary-button" type="button" onClick={markBlockComplete}>Mark block complete</button><button className="quiet-button" type="button" onClick={leaveBlockOpen}>Leave open</button></div></>}
        </div>}

        <div className="field focus-block-picker"><label htmlFor="focus-block">Planned study block</label><select id="focus-block" value={selectedSessionId} disabled={timerRunning || Boolean(activeFocusSessionId) || paused} onChange={(event) => setSelectedSessionId(event.target.value)}>
          <option value="">No block · {focusMinutes}-minute timer</option>
          {focusableSessions.map((session) => {
            const assignment = assignments.find((item) => item.id === session.assignmentId)!;
            return <option key={session.id} value={session.id}>{formatDate(session.date, { weekday: "short", month: "short", day: "numeric" })} · {assignment.title} · {formatMinutes(session.minutes)}</option>;
          })}
        </select></div>
        {activeFocusSessionId || selectedSession
          ? <div className="focus-duration-note"><span>Planned block length</span><strong>{formatMinutes(activeFocusSessionId ? timerDurationMinutes : (selectedSession?.minutes ?? 0))}</strong></div>
          : <div className="field focus-duration"><label htmlFor="focus-duration">Focus length</label><select id="focus-duration" value={focusMinutes} disabled={timerRunning} onChange={(event) => setFocusLength(Number(event.target.value))}><option value={15}>15 minutes</option><option value={25}>25 minutes</option><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option></select></div>}
      </section>
    </div>
  </>;
}
