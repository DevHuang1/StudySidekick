"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useStudy } from "@/app/study-provider";
import { LoginGate } from "@/components/login-gate";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/lib/auth";
import { useAuth } from "@/lib/use-auth";

const pages = [
  { href: "/week", label: "Weekly plan", icon: "◉" },
  { href: "/sidekick", label: "Sidekick", icon: "✦" },
  { href: "/assignments", label: "Assignments", icon: "✎" },
  { href: "/focus", label: "Focus timer", icon: "◷" },
  { href: "/reminders", label: "Reminders", icon: "♧" },
  { href: "/insights", label: "Insights", icon: "◔" },
];

const standalonePages = new Set(["/", "/privacy", "/terms"]);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ready, toast } = useStudy();
  const { ready: authReady, session } = useAuth();

  if (standalonePages.has(pathname)) return <>{children}</>;

  if (!authReady) {
    return <div className="loading-shell" role="status"><span><i className="loading-dot" />Opening your study space…</span></div>;
  }

  if (!session) return <LoginGate />;

  return (
    <div className="app-shell min-h-screen">
      <aside className="sidebar" aria-label="App navigation">
        <Link className="brand" href="/week" aria-label="Study Sidekick weekly plan"><span className="brand-mark" aria-hidden="true">S</span><span className="brand-name">Study <span>Sidekick</span></span></Link>
        <nav className="sidebar-nav" aria-label="Study tools">
          {pages.map((page) => <Link className={`nav-link${pathname === page.href ? " active" : ""}`} href={page.href} key={page.href} aria-label={page.label} title={page.label} aria-current={pathname === page.href ? "page" : undefined}>
            <span className="nav-icon" aria-hidden="true">{page.icon}</span><span className="nav-copy">{page.label}</span>
          </Link>)}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-session">
            <span className="sidebar-avatar" aria-hidden="true">{session.username.charAt(0)}</span>
            <span className="sidebar-session-copy"><strong>{session.username}</strong><small>Demo session</small></span>
            <button className="sidebar-logout" type="button" onClick={signOut} aria-label={`Log out ${session.username}`}>Log out</button>
          </div>
          <ThemeToggle />
        </div>
      </aside>

      <main className="main-area">
        <div className="content-wrap">
          {ready ? children : <div className="loading-shell"><span><i className="loading-dot" />Opening your private study space…</span></div>}
          <p className="privacy-note">
            <span className="mobile-session">Signed in as {session.username} · <button className="inline-logout" type="button" onClick={signOut}>Log out</button> · </span>
            Your study data stays in this browser. No account or sync. <Link className="text-link" href="/privacy">Privacy</Link> · <Link className="text-link" href="/terms">Terms</Link>
          </p>
        </div>
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export function PageHeading({ title, description, aside }: { title: string; description: string; aside?: ReactNode }) {
  return <div className="page-heading"><div><h1>{title}<span style={{ color: "#a77e69" }}>.</span></h1><p>{description}</p></div>{aside}</div>;
}
