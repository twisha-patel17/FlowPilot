import ExecutionStatus from "./ExecutionStatus";

const executions = [
  {
    id: "#1042",
    workflow: "High Priority Issues",
    status: "Success",
    duration: "1.2s",
    started: "2m ago",
  },
  {
    id: "#1041",
    workflow: "High Priority Issues",
    status: "Success",
    duration: "0.8s",
    started: "8m ago",
  },
  {
    id: "#1040",
    workflow: "Issue Auto-Triage",
    status: "Failed",
    duration: "2.3s",
    started: "14m ago",
  },
  {
    id: "#1039",
    workflow: "Prod Error Alerts",
    status: "Retrying",
    duration: "—",
    started: "19m ago",
  },
  {
    id: "#1038",
    workflow: "Daily Standup Reminder",
    status: "Success",
    duration: "0.6s",
    started: "8h ago",
  },
  {
    id: "#1037",
    workflow: "New User Welcome Email",
    status: "Success",
    duration: "1.9s",
    started: "3h ago",
  },
  {
    id: "#1036",
    workflow: "Issue Auto-Triage",
    status: "Failed",
    duration: "3.4s",
    started: "6h ago",
  },
];

const ExecutionTable = () => {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800/70 bg-[#0d0d0f]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left">
          <thead>
            <tr className="border-b border-zinc-800/70">
              <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                ID
              </th>

              <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                Workflow
              </th>

              <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                Status
              </th>

              <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                Duration
              </th>

              <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                Started
              </th>
            </tr>
          </thead>

          <tbody>
            {executions.map((execution) => (
              <tr
                key={execution.id}
                className="border-b border-zinc-800/50 last:border-b-0 transition hover:bg-zinc-900/40"
              >
                <td className="px-5 py-4 text-sm font-medium text-zinc-300">
                  {execution.id}
                </td>

                <td className="px-5 py-4">
                  <span className="text-sm text-zinc-200">
                    {execution.workflow}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <ExecutionStatus status={execution.status} />
                </td>

                <td className="px-5 py-4 text-sm text-zinc-500">
                  {execution.duration}
                </td>

                <td className="px-5 py-4 text-sm text-zinc-500">
                  {execution.started}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExecutionTable;