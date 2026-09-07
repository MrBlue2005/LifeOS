"use client";

export default function FindItError({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <section className="empty-state prominent-empty find-it-error" role="alert">
      <p className="section-kicker">Find It</p>
      <h1>Find It could not load</h1>
      <p>Your data was not changed. Try loading this page again.</p>
      <button className="primary-button" onClick={reset} type="button">
        Try again
      </button>
    </section>
  );
}
