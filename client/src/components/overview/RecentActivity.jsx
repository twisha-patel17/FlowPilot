import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
} from "react-icons/fi";

import { getExecutions } from "../../api/executionApi";
import { useWorkspace } from "../../context/WorkspaceContext";

const statusConfig = {
  success: {
    label: "Success",
    icon: FiCheckCircle,
    className: "text-emerald-400",
  },
  failed: {
    label: "Failed",
    icon: FiXCircle,
    className: "text-red-400",
  },
  pending: {
    label: "Pending",
    icon: FiRefreshCw,
    className: "text-amber-400",
  },
  running: {
    label: "Running",
    icon: FiRefreshCw,
    className: "text-violet-400",
  },
};

const formatDuration = (execution) => {
  if (!execution.startedAt || !execution.finishedAt) {
    return "—";
  }

  const duration =
    new Date(execution.finishedAt) -
    new Date(execution.startedAt);

  return `${(duration / 1000).toFixed(1)}s`;
};

const formatTimeAgo = (date) => {
  if (!date) return "—";

  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );

  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  return `${days}d ago`;
};

const RecentActivity = () => {
  const { currentWorkspace } = useWorkspace();

  const workspaceId = currentWorkspace?._id;

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["executions", workspaceId],
    queryFn: () => getExecutions(workspaceId),
    enabled: !!workspaceId,
  });

  const executions = data?.executions || [];

  const recentExecutions = executions.slice(0, 5);

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

      {/* Loading */}
      {isLoading && (
        <div className="px-4 py-6 text-center text-xs text-zinc-600">
          Loading executions...
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="px-4 py-6 text-center text-xs text-red-400">
          Failed to load recent executions.
        </div>
      )}

      {/* Empty */}
      {!isLoading &&
        !isError &&
        recentExecutions.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-zinc-600">
            No executions yet.
          </div>
        )}

      {/* Desktop table */}
      {!isLoading &&
        !isError &&
        recentExecutions.length > 0 && (
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
                {recentExecutions.map((execution) => {
                  const config =
                    statusConfig[execution.status] ||
                    statusConfig.pending;

                  const Icon = config.icon;

                  return (
                    <tr
                      key={execution._id}
                      className="transition-colors hover:bg-zinc-900/50"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm text-zinc-300">
                          {execution.workflow?.name ||
                            "Untitled Workflow"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div
                          className={`flex items-center gap-1.5 text-xs ${config.className}`}
                        >
                          <Icon className="h-3.5 w-3.5" />

                          <span>{config.label}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {formatDuration(execution)}
                      </td>

                      <td className="px-4 py-3 text-right text-xs text-zinc-600">
                        {formatTimeAgo(execution.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      {/* Mobile */}
      {!isLoading &&
        !isError &&
        recentExecutions.length > 0 && (
          <div className="divide-y divide-zinc-800/50 sm:hidden">
            {recentExecutions.map((execution) => {
              const config =
                statusConfig[execution.status] ||
                statusConfig.pending;

              const Icon = config.icon;

              return (
                <div
                  key={execution._id}
                  className="px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm text-zinc-300">
                      {execution.workflow?.name ||
                        "Untitled Workflow"}
                    </p>

                    <div
                      className={`flex shrink-0 items-center gap-1.5 text-xs ${config.className}`}
                    >
                      <Icon className="h-3.5 w-3.5" />

                      {config.label}
                    </div>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-600">
                    <span>{formatDuration(execution)}</span>

                    <span>
                      {formatTimeAgo(execution.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </section>
  );
};

export default RecentActivity;