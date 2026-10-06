"use client";

import { useEffect } from "react";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    // Surfaces the cause in the browser console without leaking it into the UI.
    console.error(error);
  }, [error]);

  return (
    <section className="panel" role="alert">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">This page could not open</h2>
          <p className="panel-subtitle">Your saved study data is still in this browser. Try again, or reload the page.</p>
        </div>
      </div>
      <div className="proposal-actions">
        <button className="primary-button" type="button" onClick={() => retry()}>Try again</button>
        <button className="quiet-button" type="button" onClick={() => window.location.reload()}>Reload</button>
      </div>
    </section>
  );
}
