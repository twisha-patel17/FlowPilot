const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Triggers",
      description:
        "Start workflows automatically when an event happens.",
      icon: "⚡",
      examples: ["GitHub event", "Webhook", "Schedule"],
    },
    {
      number: "02",
      title: "Logic",
      description:
        "Control what happens next with conditions and filters.",
      icon: "◇",
      examples: ["Conditions", "Filters", "Branches"],
    },
    {
      number: "03",
      title: "Actions",
      description:
        "Connect your favorite tools and execute tasks automatically.",
      icon: "→",
      examples: ["Discord", "HTTP Request", "Database"],
    },
  ];

  return (
    <section
      id="product"
      className="border-t border-zinc-900 bg-[#09090b] px-5 py-24 sm:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">

        {/* Section Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-violet-500">
            How it works
          </p>

          <h2 className="text-3xl font-bold tracking-[-0.03em] text-zinc-100 sm:text-4xl lg:text-5xl">
            From trigger to action,
            <br />
            <span className="text-zinc-500">in one canvas.</span>
          </h2>

          <p className="mt-5 text-base leading-7 text-zinc-500">
            Every workflow is built from three simple primitives.
            Connect them visually and let FlowPilot handle the execution.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-[#0d0d0f] p-6 transition duration-300 hover:border-violet-500/30"
            >
              {/* Top glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-violet-500/5 blur-3xl transition group-hover:bg-violet-500/10" />

              {/* Number */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-600">
                  {step.number}
                </span>

                <span className="text-lg text-violet-500">
                  {step.icon}
                </span>
              </div>

              {/* Title */}
              <h3 className="mt-10 text-xl font-semibold text-zinc-100">
                {step.title}
              </h3>

              {/* Description */}
              <p className="mt-3 min-h-[48px] text-sm leading-6 text-zinc-500">
                {step.description}
              </p>

              {/* Examples */}
              <div className="mt-7 space-y-2 border-t border-zinc-800/80 pt-5">
                {step.examples.map((example) => (
                  <div
                    key={example}
                    className="flex items-center gap-2 text-xs text-zinc-500"
                  >
                    <span className="h-1 w-1 rounded-full bg-zinc-700" />
                    {example}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Connecting line */}
        <div className="mt-10 hidden items-center justify-center md:flex">
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

          <span className="mx-3 text-xs font-mono text-zinc-700">
            CONNECT
          </span>

          <div className="h-px w-32 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;