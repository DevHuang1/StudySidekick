import Link from "next/link";

export default function NotFound() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">That page is not here</h2>
          <p className="panel-subtitle">The link may be out of date. Your saved study data is untouched.</p>
        </div>
      </div>
      <div className="proposal-actions">
        <Link className="primary-button" href="/week">Open the weekly plan</Link>
        <Link className="quiet-button" href="/">Back to the start</Link>
      </div>
    </section>
  );
}
