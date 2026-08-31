const workflows = [
  {
    name: "High Priority GitHub Issues",
    success: "99.2% success",
    lastRun: "last run 2m ago",
  },
  {
    name: "Daily Standup Reminder",
    success: "100% success",
    lastRun: "last run 8h ago",
  },
  {
    name: "Issue Auto-Triage",
    success: "94.1% success",
    lastRun: "last run 21m ago",
  },
  {
    name: "New User Welcome Email",
    success: "100% success",
    lastRun: "last run 3h ago",
  },
  {
    name: "Prod Error Alerts",
    success: "88.4% success",
    lastRun: "last run 1m ago",
  },
];

const ActiveWorkflows = () => {
  return (
    <section className="rounded-lg border border-zinc-800/70 bg-[#111113]">
      <div className="border-b border-zinc-800/70 px-4 py-3">
        <h2 className="text-sm font-medium text-zinc-200">
          Active Workflows
        </h2>
      </div>

      <div className="divide-y divide-zinc-800/60">
        {workflows.map((workflow) => (
          <div
            key={workflow.name}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <p className="truncate text-sm text-zinc-300">
              {workflow.name}
            </p>

            <div className="shrink-0 text-right">
              <p className="text-[11px] text-emerald-400">
                {workflow.success}
              </p>

              <p className="mt-0.5 text-[10px] text-zinc-600">
                {workflow.lastRun}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ActiveWorkflows;