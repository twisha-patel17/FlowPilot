const FinalCTA = () => {
  return (
    <section
      id="cta"
      className="relative overflow-hidden border-t border-zinc-900 bg-[#09090b] px-5 py-24 sm:px-8 lg:py-32"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

      <div className="relative mx-auto max-w-4xl text-center">

        {/* Small Label */}
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-500">
          Start building
        </p>

        {/* Heading */}
        <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-[-0.04em] text-zinc-100 sm:text-5xl lg:text-6xl">
          Turn repetitive work into
          <br />
          <span className="text-zinc-500">automated workflows.</span>
        </h2>

        {/* Description */}
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-zinc-500 sm:text-lg">
          Build your first workflow, connect your tools, and let FlowPilot
          handle the repetitive work for you.
        </p>

        {/* CTA */}
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">

          <a
            href="/signup"
            className="rounded-lg bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
          >
            Create your first workflow
          </a>

          <a
            href="#docs"
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
          >
            Read the docs
          </a>

        </div>

        {/* Bottom note */}
        <p className="mt-6 font-mono text-[11px] text-zinc-700">
          No credit card required · Start building in minutes
        </p>

      </div>
    </section>
  );
};

export default FinalCTA;