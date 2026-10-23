import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";

const exampleDays = [
  { day: "Mon", title: "Read chapter 4", detail: "Biology · 35 min", tone: "mauve" },
  { day: "Wed", title: "Outline lab report", detail: "Chemistry · 45 min", tone: "clay" },
  { day: "Fri", title: "Practice problems", detail: "Biology · 30 min", tone: "plum" },
];

const features = [
  { title: "A week that fits", text: "Turn deadlines into short sessions around the hours you have. Export the week to your calendar.", href: "/week", link: "Open planner" },
  { title: "A guided sidekick", text: "Describe what changed and review the actions before saving anything.", href: "/sidekick", link: "Ask Sidekick" },
  { title: "Assignments in one place", text: "Keep due dates and total effort together, with done and remaining time.", href: "/assignments", link: "View assignments" },
  { title: "A simple focus timer", text: "Give one task your attention, one session at a time.", href: "/focus", link: "Open timer" },
  { title: "Reminders, kept here", text: "A browser-only checklist. It does not send notifications.", href: "/reminders", link: "View reminders" },
  { title: "Progress you can see", text: "Check off blocks and watch a seven-day record add up by day and course.", href: "/insights", link: "View insights" },
];

export default function LandingPage() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link className="landing-brand" href="/" aria-label="Study Sidekick home">
            <span className="landing-brand-mark" aria-hidden="true">S</span>
            <span>Study Sidekick</span>
          </Link>
          <nav className="landing-nav" aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#your-tools">Tools</a>
            <a href="#privacy">Privacy</a>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <h1 id="landing-title">A study week that fits your <span>actual life.</span></h1>
          <p>Turn due dates into doable study sessions, shaped around the time you really have.</p>
          <div className="landing-hero-actions">
            <Link className="landing-button" href="/week">Plan my week <span aria-hidden="true">→</span></Link>
          </div>
        </div>

        <div className="sample-wrap" aria-label="Sample study schedule">
          <article className="sample-card">
            <div className="sample-topline"><span className="sample-label">Sample week</span></div>
            <div className="sample-title-row"><h2>Your study week</h2></div>
            <div className="sample-summary"><span>3 sessions · this week</span></div>
            <div className="sample-schedule">
              {exampleDays.map((item) => <div className="sample-day" key={item.day}>
                <div className="sample-day-date"><strong>{item.day}</strong></div>
                <div className={`sample-session ${item.tone}`}><strong>{item.title}</strong><span>{item.detail}</span></div>
              </div>)}
            </div>
          </article>
        </div>
      </section>

      <section className="landing-steps" id="how-it-works" aria-labelledby="steps-title">
        <div className="section-intro"><h2 id="steps-title">A clearer week in three steps.</h2></div>
        <div className="step-grid">
          <article className="step-item"><h3>Add assignments</h3><p>Note what’s due and how much work it needs.</p></article>
          <article className="step-item"><h3>Set your available hours</h3><p>Choose time that fits around the rest of your week.</p></article>
          <article className="step-item"><h3>Build your week</h3><p>Get short sessions you can adjust as plans change.</p></article>
        </div>
      </section>

      <section className="landing-tools" id="your-tools" aria-labelledby="tools-title">
        <div className="tools-heading"><h2 id="tools-title">The essentials.</h2><p>Simple tools for the parts of studying that need a little structure.</p></div>
        <div className="feature-grid">
          {features.map((feature) => <article className="feature-card" key={feature.title}>
            <h3>{feature.title}</h3><p>{feature.text}</p><Link href={feature.href}>{feature.link}<span aria-hidden="true"> →</span></Link>
          </article>)}
        </div>
      </section>

      <section className="landing-privacy" id="privacy" aria-labelledby="privacy-title">
        <div><h2 id="privacy-title">Your study data stays in this browser.</h2><p>No account or cloud sync. Assignments, plans, and study history are saved on this device. Saved reminders are a checklist, not push notifications. <Link className="text-link" href="/privacy">Read the full privacy policy</Link>.</p></div>
        <Link href="/week" className="privacy-link">Make a plan <span aria-hidden="true">→</span></Link>
      </section>

      <section className="landing-last-call" aria-labelledby="last-call-title">
        <h2 id="last-call-title">One deadline is enough to begin.</h2>
        <p>Add one assignment and see what fits.</p>
        <Link className="landing-button" href="/week">Build my week <span aria-hidden="true">→</span></Link>
      </section>

      <SiteFooter />
    </main>
  );
}
