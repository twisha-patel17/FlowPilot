const stats = [
  {
    label: "Active Workflows",
    value: "12",
    change: "↑ 2 this week",
    positive: true,
  },
  {
    label: "Executions Today",
    value: "1,284",
    change: "↑ 14% vs yesterday",
    positive: true,
  },
  {
    label: "Success Rate",
    value: "98.7%",
    change: "↑ 0.3%",
    positive: true,
  },
  {
    label: "Failed Executions",
    value: "17",
    change: "↓ 5 vs yesterday",
    positive: true,
  },
];

const WorkflowStats = () => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-zinc-800/70 bg-[#111113] p-4"
        >
          <p className="text-xs text-zinc-500">
            {stat.label}
          </p>

          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="text-2xl font-semibold tracking-tight text-zinc-100">
              {stat.value}
            </p>

            <span
              className={`text-[11px] ${
                stat.positive
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {stat.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkflowStats;