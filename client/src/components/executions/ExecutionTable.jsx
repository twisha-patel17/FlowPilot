import { useNavigate } from "react-router-dom";

import ExecutionStatus from "./ExecutionStatus";

const ExecutionTable = ({
  executions = [],
  isLoading = false,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-800/70 bg-[#0d0d0f] px-5 py-12 text-center">
        <p className="text-sm text-zinc-500">
          Loading executions...
        </p>
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800/70 bg-[#0d0d0f] px-5 py-12 text-center">
        <p className="text-sm text-zinc-400">
          No executions found.
        </p>

        <p className="mt-1 text-xs text-zinc-600">
          Try changing your filters or run a workflow.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800/70 bg-[#0d0d0f]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
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
                Trigger
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
            {executions.map((execution) => {
              const start = execution.startedAt
                ? new Date(execution.startedAt)
                : null;

              const end = execution.finishedAt
                ? new Date(execution.finishedAt)
                : null;

              const duration =
                start && end
                  ? formatDuration(
                      end.getTime() -
                        start.getTime()
                    )
                  : "—";

              const started = start
                ? formatRelativeTime(start)
                : "—";

              return (
                <tr
                  key={execution._id}
                  onClick={() =>
                    navigate(
                      `/app/executions/${execution._id}`
                    )
                  }
                  className="cursor-pointer border-b border-zinc-800/50 last:border-b-0 transition hover:bg-zinc-900/40"
                >
                  {/* ID */}
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs font-medium text-zinc-400">
                      #
                      {execution._id
                        ? execution._id.slice(-4)
                        : "----"}
                    </span>
                  </td>

                  {/* Workflow */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-zinc-200">
                      {execution.workflow?.name ||
                        "Unknown workflow"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <ExecutionStatus
                      status={formatStatus(
                        execution.status
                      )}
                    />
                  </td>

                  {/* Trigger */}
                  <td className="px-5 py-4">
                    <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] font-medium text-zinc-500">
                      {capitalize(
                        execution.trigger ||
                          "manual"
                      )}
                    </span>
                  </td>

                  {/* Duration */}
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-zinc-500">
                      {duration}
                    </span>
                  </td>

                  {/* Started */}
                  <td className="px-5 py-4">
                    <span className="text-xs text-zinc-500">
                      {started}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const formatStatus = (status) => {
  switch (status) {
    case "success":
      return "Success";

    case "failed":
      return "Failed";

    case "running":
      return "Running";

    case "pending":
      return "Pending";

    default:
      return "Pending";
  }
};

const capitalize = (value) => {
  if (!value) return "";

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
};

const formatDuration = (milliseconds) => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  return `${(
    milliseconds / 1000
  ).toFixed(2)}s`;
};

const formatRelativeTime = (date) => {
  const seconds = Math.floor(
    (Date.now() - date.getTime()) / 1000
  );

  if (seconds < 60) {
    return `${Math.max(seconds, 0)}s ago`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days}d ago`;
};

export default ExecutionTable;