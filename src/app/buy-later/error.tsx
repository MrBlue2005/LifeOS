"use client";

export default function BuyLaterError({ reset }: Readonly<{ reset: () => void }>) {
  return <section className="empty-state prominent-empty find-it-error" role="alert"><p className="section-kicker">Buy Later</p><h1>Buy Later could not load</h1><p>Your data was not changed. Try loading this page again.</p><button className="primary-button" onClick={reset} type="button">Try again</button></section>;
}
