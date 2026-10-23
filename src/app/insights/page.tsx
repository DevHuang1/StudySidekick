"use client";

import Link from "next/link";
import { PageHeading } from "@/components/app-shell";
import { useStudy } from "@/app/study-provider";
import { formatDate } from "@/lib/date-utils";
import { formatMinutes } from "@/lib/format";
import { buildStudyInsights } from "@/lib/insights";

export default function InsightsPage() {
  const { today, dates, assignments, plan, studyLog } = useStudy();
  if (!today) return null;

  const insights = buildStudyInsights(studyLog, assignments, today);
  const visibleSessions = (plan?.sessions ?? []).filter((session) => dates.includes(session.date)
    && assignments.some((assignment) => assignment.id === session.assignmentId));
  const plannedMinutes = visibleSessions.reduce((total, session) => total + session.minutes, 0);
  const completedMinutes = visibleSessions.filter((session) => session.completed).reduce((total, session) => total + session.minutes, 0);
  const planProgress = plannedMinutes ? Math.floor((completedMinutes / plannedMinutes) * 100) : 0;
  const maxDayMinutes = Math.max(1, ...insights.lastSevenDays.map((day) => day.minutes));
  const maxCourseMinutes = Math.max(1, ...insights.courseTotals.map((course) => course.minutes));
  const lastSevenDayMinutes = insights.lastSevenDays.reduce((total, day) => total + day.minutes, 0);
  const dayLabel = (count: number) => `${count} day${count === 1 ? "" : "s"}`;

  return <>
    <PageHeading title="See what your effort adds up to" description="A quiet record of the study blocks you have checked off in this browser. Nothing here is uploaded." />

    <div className="insights-page">
      <section className="insights-stats" aria-label="Study summary">
        <article className="insight-stat">
          <span className="insight-stat-label">Recorded study</span>
          <b>{formatMinutes(insights.totalMinutes)}</b>
          <span>{insights.totalBlocks} block{insights.totalBlocks === 1 ? "" : "s"} checked off</span>
        </article>
        <article className="insight-stat">
          <span className="insight-stat-label">Current streak</span>
          <b>{dayLabel(insights.currentStreak)}</b>
          <span>{insights.bestStreak > 0 ? `Best streak: ${dayLabel(insights.bestStreak)}` : "Check off one block to begin"}</span>
        </article>
        <article className="insight-stat">
          <span className="insight-stat-label">Assignments finished</span>
          <b>{insights.assignmentsFinished}<span className="insight-stat-total"> / {insights.assignmentsTotal}</span></b>
          <span>{insights.assignmentsTotal - insights.assignmentsFinished} still in progress</span>
        </article>
        <article className="insight-stat">
          <span className="insight-stat-label">This plan</span>
          <b>{planProgress}<span className="insight-stat-total">%</span></b>
          <span>{plannedMinutes ? `${formatMinutes(completedMinutes)} of ${formatMinutes(plannedMinutes)} complete` : "Build a week to start a plan"}</span>
        </article>
      </section>

      {insights.totalBlocks === 0 && <section className="panel insights-empty" aria-labelledby="insights-empty-heading">
        <h2 id="insights-empty-heading">Your record starts with one block.</h2>
        <p>Check off a study block on the weekly plan and it will appear here, even after the week rolls forward.</p>
        <Link className="primary-button" href="/week">Open the weekly plan</Link>
      </section>}

      <section className="panel insights-panel" aria-labelledby="activity-heading">
        <div className="panel-header insights-panel-header">
          <div><h2 className="panel-title" id="activity-heading">Last seven days</h2><p className="panel-subtitle">Minutes from blocks you checked off, grouped by the day you finished them.</p></div>
          <span className="week-chip">{formatMinutes(lastSevenDayMinutes)}</span>
        </div>
        <ol className="insight-days">
          {insights.lastSevenDays.map((day) => {
            const height = day.minutes ? Math.max(6, Math.round((day.minutes / maxDayMinutes) * 100)) : 0;
            return <li className={`insight-day${day.date === today ? " today" : ""}`} key={day.date}>
              <span className="insight-day-value">{day.minutes ? formatMinutes(day.minutes) : "—"}</span>
              <div className="insight-day-track" role="img" aria-label={`${formatDate(day.date, { weekday: "long", month: "long", day: "numeric" })}: ${day.minutes ? formatMinutes(day.minutes) : "no study"}`}>
                <span className="insight-day-fill" style={{ height: `${height}%` }} />
              </div>
              <span className="insight-day-label">{formatDate(day.date, { weekday: "short" })}<small>{formatDate(day.date, { month: "numeric", day: "numeric" })}</small></span>
            </li>;
          })}
        </ol>
      </section>

      <div className="insights-grid">
        <section className="panel insights-panel" aria-labelledby="courses-heading">
          <div className="panel-header insights-panel-header">
            <div><h2 className="panel-title" id="courses-heading">Where the time went</h2><p className="panel-subtitle">Checked-off minutes by course over the last 30 days.</p></div>
            <span className="week-chip">{formatMinutes(insights.lastThirtyDayMinutes)}</span>
          </div>
          {insights.courseTotals.length ? <div className="insight-courses">
            {insights.courseTotals.map((course) => <div className="insight-course" key={course.course}>
              <div className="insight-course-copy"><strong>{course.course}</strong><span>{formatMinutes(course.minutes)} · {course.blocks} block{course.blocks === 1 ? "" : "s"}</span></div>
              <div className="insight-course-track" role="img" aria-label={`${course.course}: ${formatMinutes(course.minutes)} in the last 30 days`}><span style={{ width: `${Math.max(4, Math.round((course.minutes / maxCourseMinutes) * 100))}%` }} /></div>
            </div>)}
          </div> : <p className="insights-note">No checked-off blocks in the last 30 days.</p>}
        </section>

        <section className="panel insights-panel" aria-labelledby="current-plan-heading">
          <div className="panel-header insights-panel-header">
            <div><h2 className="panel-title" id="current-plan-heading">This week’s plan</h2><p className="panel-subtitle">The seven-day window currently saved in this browser.</p></div>
          </div>
          {visibleSessions.length ? <div className="insight-plan">
            <div className="insight-plan-progress" role="progressbar" aria-label="Current plan progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={planProgress}><span style={{ width: `${planProgress}%` }} /></div>
            <div className="insight-plan-rows">
              <p><span>Blocks complete</span><strong>{visibleSessions.filter((session) => session.completed).length} of {visibleSessions.length}</strong></p>
              <p><span>Time complete</span><strong>{formatMinutes(completedMinutes)}</strong></p>
              <p><span>Time remaining</span><strong>{formatMinutes(plannedMinutes - completedMinutes)}</strong></p>
            </div>
            <Link className="quiet-button insight-plan-link" href="/week">Review the week</Link>
          </div> : <div className="insights-note"><p>No saved plan for this window yet.</p><Link className="text-link" href="/week">Build your week</Link></div>}
        </section>
      </div>

      <p className="panel-footnote insights-footnote">History lives only in this browser and is included when you clear site data. Assignment titles and courses are copied into the record so edits do not rewrite the past.</p>
    </div>
  </>;
}
