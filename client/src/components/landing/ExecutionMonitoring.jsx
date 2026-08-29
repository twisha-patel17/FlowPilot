const ExecutionMonitoring = () => {
  const executions = [
    {
      id: "#1042",
      workflow: "High Priority GitHub Issues",
      status: "Success",
      duration: "1.2s",
      time: "2 min ago",
    },
    {
      id: "#1041",
      workflow: "Daily Task Reminder",
      status: "Success",
      duration: "0.8s",
      time: "18 min ago",
    },
    {
      id: "#1040",
      workflow: "Issue Notification",
      status: "Failed",
      duration: "2.3s",
      time: "42 min ago",
    },
    {
      id: "#1039",
      workflow: "Database Sync",
      status: "Success",
      duration: "1.1s",
      time: "1 hr ago",
    },
  ];

  return (
    <section className="border-t border-zinc-900 bg-[#09090b] px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-6xl">

        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-violet-500">
            Execution monitoring
          </p>

          <h2 className="text-3xl font-bold tracking-[-0.03em] text-zinc-100 sm:text-4xl lg:text-5xl">
            See exactly what happened,
            <br />
            <span className="text-zinc-500">every run.</span>
          </h2>

          <p className="mt-5 text-base leading-7 text-zinc-500">
            Every workflow execution is tracked from trigger to completion.
            Inspect failures, timing, retries, and individual steps.
          </p>
        </div>

        {/* Execution Dashboard */}
        <div className="mx-auto mt-16 max-w-5xl overflow-hidden rounded-xl border border-zinc-800 bg-[#0d0d0f]">

          {/* Dashboard Header */}
          <div className="flex flex-col gap-4 border-b border-zinc-800 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-sm font-semibold text-zinc-100">
                Executions
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                Recent workflow activity
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-500" />

              <span className="font-mono text-xs text-zinc-500">
                4 executions
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">

              {/* Table Header */}
              <div className="grid grid-cols-[90px_1fr_110px_100px_110px] border-b border-zinc-800/70 px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                <span>ID</span>
                <span>Workflow</span>
                <span>Status</span>
                <span>Duration</span>
                <span>Time</span>
              </div>

              {/* Rows */}
              {executions.map((execution) => (
                <div
                  key={execution.id}
                  className="grid grid-cols-[90px_1fr_110px_100px_110px] items-center border-b border-zinc-800/60 px-6 py-5 transition hover:bg-zinc-900/40"
                >
                  {/* ID */}
                  <span className="font-mono text-xs text-zinc-500">
                    {execution.id}
                  </span>

                  {/* Workflow */}
                  <span className="text-sm font-medium text-zinc-300">
                    {execution.workflow}
                  </span>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        execution.status === "Success"
                          ? "bg-emerald-400"
                          : "bg-red-400"
                      }`}
                    />

                    <span
                      className={`text-xs font-medium ${
                        execution.status === "Success"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {execution.status}
                    </span>
                  </div>

                  {/* Duration */}
                  <span className="font-mono text-xs text-zinc-500">
                    {execution.duration}
                  </span>

                  {/* Time */}
                  <span className="text-xs text-zinc-600">
                    {execution.time}
                  </span>
                </div>
              ))}

            </div>
          </div>

          {/* Dashboard Footer */}
          <div className="flex items-center justify-between px-6 py-4">
            <span className="font-mono text-[11px] text-zinc-600">
              Showing recent executions
            </span>

            <button className="text-xs font-medium text-violet-400 transition hover:text-violet-300">
              View all executions →
            </button>
          </div>
        </div>

        {/* Execution Detail */}
        <div className="mx-auto mt-5 grid max-w-5xl gap-5 md:grid-cols-2">

          {/* Step Timeline */}
          <div className="rounded-xl border border-zinc-800 bg-[#0d0d0f] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-100">
                  Execution #1040
                </p>

                <p className="mt-1 font-mono text-xs text-zinc-600">
                  Issue Notification
                </p>
              </div>

              <span className="rounded-md border border-red-500/20 bg-red-500/5 px-2 py-1 text-[10px] font-medium text-red-400">
                FAILED
              </span>
            </div>

            <div className="mt-7 space-y-5">

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="mt-1 h-8 w-px bg-zinc-800" />
                </div>

                <div>
                  <p className="text-xs font-medium text-zinc-300">
                    GitHub Trigger
                  </p>

                  <p className="mt-1 font-mono text-[10px] text-zinc-600">
                    completed · 0.2s
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="mt-1 h-8 w-px bg-zinc-800" />
                </div>

                <div>
                  <p className="text-xs font-medium text-zinc-300">
                    Priority Filter
                  </p>

                  <p className="mt-1 font-mono text-[10px] text-zinc-600">
                    matched · 0.1s
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                </div>

                <div>
                  <p className="text-xs font-medium text-zinc-300">
                    Discord Notification
                  </p>

                  <p className="mt-1 font-mono text-[10px] text-red-400/80">
                    request failed · 2.0s
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Retry Information */}
          <div className="rounded-xl border border-zinc-800 bg-[#0d0d0f] p-6">
            <p className="text-sm font-semibold text-zinc-100">
              Automatic retries
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              When an action fails, FlowPilot can retry it automatically
              using configurable backoff strategies.
            </p>

            <div className="mt-7 space-y-3">

              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
                <span className="font-mono text-xs text-zinc-500">
                  Attempt 1
                </span>

                <span className="text-xs text-red-400">
                  Failed
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
                <span className="font-mono text-xs text-zinc-500">
                  Attempt 2
                </span>

                <span className="text-xs text-zinc-500">
                  Retrying...
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3">
                <span className="font-mono text-xs text-zinc-400">
                  Attempt 3
                </span>

                <span className="text-xs text-violet-400">
                  Ready
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default ExecutionMonitoring;