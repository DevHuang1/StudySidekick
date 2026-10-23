"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AUTH_USERNAMES, signIn, type AuthUsername } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export function LoginGate() {
  const usernameId = useId();
  const passwordId = useId();
  const errorId = useId();
  const usernameRef = useRef<HTMLSelectElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState<AuthUsername>("User");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = signIn(username, password);

    if (!result.ok) {
      setError(result.error);
      setPassword("");
      passwordRef.current?.focus();
      return;
    }

    setError("");
  }

  return (
    <main className="login-page">
      <header className="login-topbar">
        <Link className="brand login-brand" href="/" aria-label="Study Sidekick home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span className="brand-name">Study <span>Sidekick</span></span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="login-stage">
        <section className="login-card" aria-labelledby="login-title">
          <p className="login-eyebrow">Demo access</p>
          <h1 id="login-title">Open your study space</h1>
          <p className="login-intro">Choose who is signing in. Your assignments and plan are waiting in this browser.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor={usernameId}>Sign in as</label>
              <select
                id={usernameId}
                ref={usernameRef}
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value as AuthUsername);
                  setError("");
                }}
              >
                {AUTH_USERNAMES.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>

            <div className="field">
              <label htmlFor={passwordId}>Password</label>
              <input
                id={passwordId}
                ref={passwordRef}
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="Enter demo password"
                autoComplete="current-password"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
              />
            </div>

            {error && <p className="login-error" id={errorId} role="alert">{error}</p>}

            <button className="primary-button login-submit" type="submit" disabled={!password}>
              Enter study space
            </button>
          </form>

          <p className="login-hint">Password is <strong>&quot;DEVPOST&quot;</strong> for judges.</p>
        </section>

        <p className="login-footnote">Your study data stays in this browser. No account is created.</p>
      </div>
    </main>
  );
}
