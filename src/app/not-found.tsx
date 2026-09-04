import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="placeholder" aria-labelledby="not-found-title">
      <p className="eyebrow">404 · Not found</p>
      <h1 id="not-found-title">This space is not part of RX LifeOS.</h1>
      <p className="placeholder-copy">
        The page may have moved, or the address may be incomplete.
      </p>
      <Link className="back-link" href="/">
        Return to RX LifeOS
      </Link>
    </section>
  );
}
