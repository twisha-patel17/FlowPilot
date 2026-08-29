const DeveloperFeatures = () => {
  const features = [
    {
      number: "01",
      title: "Automatic retries",
      description:
        "Handle temporary failures automatically with configurable retry attempts and backoff strategies.",
      visual: (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2">
            <span className="font-mono text-[11px] text-zinc-500">
              Attempt 1
            </span>
            <span className="text-[11px] text-red-400">Failed</span>
          </div>

          <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2">
            <span className="font-mono text-[11px] text-zinc-500">
              Attempt 2
            </span>
            <span className="text-[11px] text-zinc-500">
              Retrying...
            </span>
          </div>

          <div className="flex items-center justify-between rounded-md border border-violet-500/20 bg-violet-500/5 px-3 py-2">
            <span className="font-mono text-[11px] text-zinc-400">
              Attempt 3
            </span>
            <span className="text-[11px] text-violet-400">
              Success
            </span>
          </div>
        </div>
      ),
    },

    {
      number: "02",
      title: "Execution history",
      description:
        "Every workflow run is recorded so you can inspect exactly what happened and where it failed.",
      visual: (
        <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="font-mono text-[10px] text-zinc-600">
              EXECUTION
            </span>

            <span className="font-mono text-[10px] text-zinc-600">
              STATUS
            </span>
          </div>

          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-zinc-500">
                #1042
              </span>

              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Success
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-zinc-500">
                #1041
              </span>

              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Success
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-zinc-500">
                #1040
              </span>

              <span className="flex items-center gap-1.5 text-[11px] text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Failed
              </span>
            </div>
          </div>
        </div>
      ),
    },

    {
      number: "03",
      title: "Workflow versioning",
      description:
        "Keep track of workflow changes and safely update your automations without losing previous configurations.",
      visual: (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between rounded-md border border-violet-500/20 bg-violet-500/5 px-3 py-2">
            <span className="font-mono text-[11px] text-zinc-400">
              v2.4
            </span>

            <span className="text-[10px] text-violet-400">
              CURRENT
            </span>
          </div>

          <div className="flex items-center justify-between px-3 py-1">
            <span className="font-mono text-[11px] text-zinc-600">
              v2.3
            </span>

            <span className="text-[10px] text-zinc-700">
              archived
            </span>
          </div>

          <div className="flex items-center justify-between px-3 py-1">
            <span className="font-mono text-[11px] text-zinc-600">
              v2.2
            </span>

            <span className="text-[10px] text-zinc-700">
              archived
            </span>
          </div>
        </div>
      ),
    },

    {
      number: "04",
      title: "Team workspaces",
      description:
        "Organize workflows inside shared workspaces and give your team a single place to build and manage automations.",
      visual: (
        <div className="mt-6">
          <div className="flex -space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0d0d0f] bg-zinc-700 text-[10px] font-semibold text-zinc-200">
              TS
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0d0d0f] bg-zinc-800 text-[10px] font-semibold text-zinc-300">
              AK
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0d0d0f] bg-zinc-700 text-[10px] font-semibold text-zinc-200">
              MR
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0d0d0f] bg-violet-500 text-[10px] font-semibold text-white">
              +
            </div>
          </div>

          <p className="mt-4 font-mono text-[10px] text-zinc-600">
            3 members · 12 workflows
          </p>
        </div>
      ),
    },
  ];

  return (
    <section
      id="developer"
      className="border-t border-zinc-900 bg-[#09090b] px-5 py-24 sm:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">

        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-violet-500">
            Built for engineers
          </p>

          <h2 className="text-3xl font-bold tracking-[-0.03em] text-zinc-100 sm:text-4xl lg:text-5xl">
            Automation without
            <br />
            <span className="text-zinc-500">
              giving up control.
            </span>
          </h2>

          <p className="mt-5 text-base leading-7 text-zinc-500">
            FlowPilot gives you the simplicity of visual automation with
            the reliability and visibility developers expect.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.number}
              className="group rounded-xl border border-zinc-800 bg-[#0d0d0f] p-6 transition duration-300 hover:border-violet-500/30 sm:p-7"
            >
              {/* Number */}
              <span className="font-mono text-[10px] tracking-wider text-zinc-600">
                {feature.number}
              </span>

              {/* Title */}
              <h3 className="mt-5 text-xl font-semibold text-zinc-100">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-500">
                {feature.description}
              </p>

              {/* Visual */}
              {feature.visual}
            </article>
          ))}
        </div>

      </div>
    </section>
  );
};

export default DeveloperFeatures;