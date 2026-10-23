import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What Study Sidekick stores in your browser and what the optional AI features send.",
};

export default function PrivacyPage() {
  return (
    <main className="landing-page legal-page">
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link className="landing-brand" href="/" aria-label="Study Sidekick home">
            <span className="landing-brand-mark" aria-hidden="true">S</span>
            <span>Study Sidekick</span>
          </Link>
          <nav className="landing-nav" aria-label="Main navigation">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/week">Open the planner</Link>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <article className="legal-body">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: October 23, 2026</p>

        <section>
          <h2>The short version</h2>
          <ul>
            <li>Your study data is saved in your own browser. There is no account and no cloud sync.</li>
            <li>The app uses no advertising or analytics cookies and does not track you across sites.</li>
            <li>AI features are optional. Guided mode works without any external service.</li>
          </ul>
        </section>

        <section>
          <h2>Data saved in your browser</h2>
          <p>The planner keeps the following in this browser&rsquo;s local storage so it is there the next time you open the app:</p>
          <ul>
            <li>assignments, due dates, and effort estimates;</li>
            <li>your available study hours and saved weekly plans;</li>
            <li>completion state and your focus-length preference;</li>
            <li>a history of checked-off study blocks used by Insights;</li>
            <li>reminders you add;</li>
            <li>an in-progress focus timer deadline.</li>
          </ul>
          <p>This data stays on your device. Clearing this browser&rsquo;s site data removes it, and the app never uploads it on its own. Calendar files are generated in your browser and are only saved when you download them.</p>
        </section>

        <section>
          <h2>Optional AI features</h2>
          <p>Sidekick can send one request at a time to an AI provider. Nothing is sent until you ask for a reply.</p>
          <ul>
            <li><strong>Guided mode (fallback):</strong> no request leaves the app; simple requests are matched locally.</li>
            <li><strong>Ollama &middot; local:</strong> when you run the app on your own computer with Ollama installed, prompts go to Ollama on that computer. They do not reach this site or any hosted provider. On the hosted deployment, local Ollama is not reachable.</li>
            <li><strong>Groq &middot; cloud (opt in per request):</strong> after you confirm the notice, your prompt, the current date, and up to 10 recent chat messages are sent to Groq, L.P. Saved assignments and study hours are included only if you tick the separate checkbox for that request. Groq&rsquo;s handling of the request is governed by <a className="text-link" href="https://groq.com/privacy-policy/" target="_blank" rel="noreferrer">Groq&rsquo;s privacy policy</a>.</li>
          </ul>
        </section>

        <section>
          <h2>Hosting and server logs</h2>
          <p>The hosted version runs on Vercel. Like most hosting providers, Vercel processes request metadata such as IP address, user agent, and timestamps in operational and security logs. The app does not store your study data on the server. A short-lived, in-memory request counter limits abuse of the assistant endpoint; it is not tied to your identity and disappears when the server instance recycles.</p>
        </section>

        <section>
          <h2>Children</h2>
          <p>Study Sidekick is a general study tool and is not directed at children under 13. Do not enter personal information about yourself or others that you would not want stored on your device.</p>
        </section>

        <section>
          <h2>Changes</h2>
          <p>If this policy changes in a way that affects what is sent to third parties, the updated policy will appear here with a new date above.</p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>Questions or concerns: open an issue at <a className="text-link" href="https://github.com/DevHuang1/StudySidekick/issues" target="_blank" rel="noreferrer">github.com/DevHuang1/StudySidekick/issues</a>. This project is open source under the MIT License. See also the <Link className="text-link" href="/terms">Terms of Service</Link>.</p>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
