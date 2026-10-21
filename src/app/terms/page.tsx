import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use Study Sidekick.",
};

export default function TermsPage() {
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
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: October 12, 2026</p>

        <section>
          <h2>Acceptance</h2>
          <p>By using Study Sidekick you agree to these terms. If you do not agree, do not use the app.</p>
        </section>

        <section>
          <h2>What this is</h2>
          <p>Study Sidekick is a free, open-source study planner. It turns assignment due dates and the study hours you enter into a suggested schedule. It is a hackathon project and is not affiliated with Amazon, Alexa, or any third-party AI provider.</p>
        </section>

        <section>
          <h2>Not professional advice</h2>
          <p>The planner is an organizational tool. It does not provide academic, legal, medical, or professional advice. Always confirm deadlines, requirements, and instructions with your school, instructor, or course materials. You are responsible for your own schedule and coursework.</p>
        </section>

        <section>
          <h2>AI features and your review</h2>
          <p>Sidekick can propose changes, such as adding an assignment or starting a focus timer, but nothing is saved until you review and confirm it. AI-generated text can be wrong or incomplete; proposals are checked against your saved data, but you should still review them. The optional Groq Cloud provider is subject to Groq&rsquo;s own terms and policies, and local Ollama is subject to the terms of the software you install. See the <Link className="text-link" href="/privacy">Privacy Policy</Link> for what is sent.</p>
        </section>

        <section>
          <h2>Acceptable use</h2>
          <p>When using the hosted app, do not:</p>
          <ul>
            <li>disrupt or overload the assistant endpoint, or otherwise abuse rate limits;</li>
            <li>attempt to extract server credentials or access data belonging to others;</li>
            <li>use the app for unlawful purposes.</li>
          </ul>
          <p>Requests that violate these terms may be limited or blocked.</p>
        </section>

        <section>
          <h2>License and source code</h2>
          <p>The source code is available at <a className="text-link" href="https://github.com/DevHuang1/StudySidekick" target="_blank" rel="noreferrer">github.com/DevHuang1/StudySidekick</a> and licensed under the <a className="text-link" href="https://github.com/DevHuang1/StudySidekick/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT License</a>. You may use, copy, modify, and distribute the software under those terms.</p>
        </section>

        <section>
          <h2>Disclaimer of warranties</h2>
          <p>Study Sidekick is provided &ldquo;as is&rdquo;, without warranty of any kind, express or implied, including fitness for a particular purpose and non-infringement. The app may be unavailable, browser-saved data is lost if you clear site storage, and output may be inaccurate.</p>
        </section>

        <section>
          <h2>Limitation of liability</h2>
          <p>To the maximum extent permitted by law, the authors or copyright holders are not liable for any claim, damages, or other liability arising from the software or its use. This mirrors the MIT License.</p>
        </section>

        <section>
          <h2>Changes to these terms</h2>
          <p>Updated terms will be posted on this page with a new date above. Continued use after a change means you accept the updated terms.</p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>Questions: open an issue at <a className="text-link" href="https://github.com/DevHuang1/StudySidekick/issues" target="_blank" rel="noreferrer">github.com/DevHuang1/StudySidekick/issues</a>.</p>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
