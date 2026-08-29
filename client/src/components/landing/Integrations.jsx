const Integrations = () => {
  const integrations = [
    {
      name: "GitHub",
      description: "Issues, pull requests & events",
      icon: "GH",
    },
    {
      name: "Discord",
      description: "Messages & notifications",
      icon: "DS",
    },
    {
      name: "Email",
      description: "Automated email delivery",
      icon: "@",
    },
    {
      name: "HTTP",
      description: "Connect any API",
      icon: "↗",
    },
    {
      name: "MongoDB",
      description: "Store workflow data",
      icon: "DB",
    },
    {
      name: "Webhooks",
      description: "Receive external events",
      icon: "⚡",
    },
  ];

  return (
    <section
      id="integrations"
      className="border-t border-zinc-900 bg-[#09090b] px-5 py-24 sm:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">

        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-violet-500">
            Integrations
          </p>

          <h2 className="text-3xl font-bold tracking-[-0.03em] text-zinc-100 sm:text-4xl lg:text-5xl">
            Works with the tools
            <br />
            <span className="text-zinc-500">you already run.</span>
          </h2>

          <p className="mt-5 text-base leading-7 text-zinc-500">
            Connect FlowPilot to your existing stack and move data between
            services without writing repetitive glue code.
          </p>
        </div>

        {/* Integration Grid */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="group rounded-xl border border-zinc-800 bg-[#0d0d0f] p-5 transition duration-300 hover:border-violet-500/30 hover:bg-zinc-900/60"
            >
              <div className="flex items-center gap-4">

                {/* Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 font-mono text-xs font-bold text-zinc-300 transition group-hover:border-violet-500/30 group-hover:text-violet-400">
                  {integration.icon}
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    {integration.name}
                  </h3>

                  <p className="mt-1 text-xs text-zinc-600">
                    {integration.description}
                  </p>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* HTTP / Custom API Callout */}
        <div className="mx-auto mt-5 max-w-5xl rounded-xl border border-zinc-800 bg-[#0d0d0f] p-6 sm:p-8">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">

            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-violet-500">
                Developer friendly
              </p>

              <h3 className="mt-3 text-xl font-semibold text-zinc-100">
                Connect anything with HTTP.
              </h3>

              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                Don't see an integration you need? Use FlowPilot's HTTP
                action to connect virtually any API or internal service.
              </p>
            </div>

            {/* API Preview */}
            <div className="w-full rounded-lg border border-zinc-800 bg-[#09090b] p-4 font-mono text-xs md:w-72">
              <div className="flex items-center gap-2">
                <span className="rounded bg-violet-500/10 px-2 py-1 text-violet-400">
                  POST
                </span>

                <span className="truncate text-zinc-500">
                  /api/notify
                </span>
              </div>

              <div className="mt-4 space-y-1 text-zinc-600">
                <p>{"{"}</p>
                <p className="pl-4 text-zinc-500">
                  "event": "issue.created",
                </p>
                <p className="pl-4 text-zinc-500">
                  "priority": "high"
                </p>
                <p>{"}"}</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default Integrations;