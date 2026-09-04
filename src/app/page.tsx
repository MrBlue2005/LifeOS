import { ModuleLauncher } from "@/core/components/module-launcher";

export default function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="home-title">
        <p className="eyebrow">A calmer home for everyday life</p>
        <h1 id="home-title">Your everyday operating system.</h1>
        <p className="hero-copy">
          Focused tools that help you remember what matters and make more
          deliberate everyday decisions.
        </p>
      </section>

      <section className="module-section" aria-labelledby="modules-title">
        <div className="section-heading">
          <p className="eyebrow">Modules</p>
          <h2 id="modules-title">Start with one useful thing</h2>
        </div>
        <ModuleLauncher />
      </section>
    </>
  );
}
