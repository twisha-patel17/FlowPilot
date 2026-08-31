import { Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
} from "react-icons/fi";

const executions = [
  {
    workflow: "GitHub → Discord",
    status: "Success",
    duration: "1.2s",
    time: "2m ago",
  },
  {
    workflow: "Daily Reminder",
    status: "Success",
    duration: "0.8s",
    time: "12m ago",
  },
  {
    workflow: "Issue Processor",
    status: "Failed",
    duration: "2.3s",
    time: "21m ago",
  },
  {
    workflow: "Slack Digest",
    status: "Success",
    duration: "3.1s",
    time: "40m ago",
  },
  {
    workflow: "DB Backup Check",
    status: "Retrying",
    duration: "—",
    time: "1h ago",
  },
];

const statusConfig = {
  Success: {
    icon: FiCheckCircle,
    className: "text-emerald-400",
  },
  Failed: {
    icon: FiXCircle,
    className: "text-red-400",
  },
  Retrying: {
    icon: FiRefreshCw,
    className: "text-amber-400",
  },
};

const RecentActivity = () => {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-800/70 bg-[#111113]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/70 px-4 py-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-200">
            Recent Executions
          </h2>

          <p className="mt-0.5 text-xs text-zinc-600">
            Latest workflow activity
          </p>
        </div>

        <Link
          to="/app/executions"
          className="text-xs text-zinc-500 transition-colors hover:text-violet-400"
        >
          View all
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800/60 text-left">
              <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                Workflow
              </th>

              <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                Status
              </th>

              <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                Duration
              </th>

              <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                Time
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/50">
            {executions.map((execution) => {
              const config = statusConfig[execution.status];
              const Icon = config.icon;

              return (
                <tr
                  key={`${execution.workflow}-${execution.time}`}
                  className="transition-colors hover:bg-zinc-900/50"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm text-zinc-300">
                      {execution.workflow}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div
                      className={`flex items-center gap-1.5 text-xs ${config.className}`}
                    >
                      <Icon className="h-3.5 w-3.5" />

                      <span>{execution.status}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {execution.duration}
                  </td>

                  <td className="px-4 py-3 text-right text-xs text-zinc-600">
                    {execution.time}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="divide-y divide-zinc-800/50 sm:hidden">
        {executions.map((execution) => {
          const config = statusConfig[execution.status];
          const Icon = config.icon;

          return (
            <div
              key={`${execution.workflow}-${execution.time}`}
              className="px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm text-zinc-300">
                  {execution.workflow}
                </p>

                <div
                  className={`flex shrink-0 items-center gap-1.5 text-xs ${config.className}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {execution.status}
                </div>
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-600">
                <span>{execution.duration}</span>
                <span>{execution.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default RecentActivity;