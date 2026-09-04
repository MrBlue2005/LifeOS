export function ConfigurationRequired() {
  return (
    <section className="panel" aria-labelledby="configuration-title">
      <p className="eyebrow">Setup required</p>
      <h1 id="configuration-title">Connect RX LifeOS to Supabase</h1>
      <p className="placeholder-copy">
        Create <code>.env.local</code> beside <code>package.json</code>, add the
        two public Supabase values described in the project README, then restart
        the development server.
      </p>
    </section>
  );
}
