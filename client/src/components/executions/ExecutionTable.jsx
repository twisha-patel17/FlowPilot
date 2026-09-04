import { useQuery } from "@tanstack/react-query";

import { getExecutions } from "../../api/executionApi";
import ExecutionStatus from "./ExecutionStatus";

const ExecutionTable = () => {
  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["executions"],
    queryFn: getExecutions,
  });

  const executions = data?.executions || [];

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-800/70 bg-[#0d0d0f] px-5 py-12 text-center">
        <p className="text-sm text-zinc-500">
          Loading executions...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-5 py-12 text-center">
        <p className="text-sm text-red-400">
          Failed to load executions.
        </p>
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800/70 bg-[#0d0d0f] px-5 py-12 text-center">
        <p className="text-sm text-zinc-400">
          No executions yet.
        </p>

        <p className="mt-1 text-xs text-zinc-600">
          Run a workflow to see executions here.
        </p>
      </div>
    );
  }

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
            {executions.map((execution) => {
              const start = execution.startedAt
                ? new Date(execution.startedAt)
                : null;

              const end = execution.finishedAt
                ? new Date(execution.finishedAt)
                : null;

              const duration =
                start && end
                  ? `${(
                      (end - start) /
                      1000
                    ).toFixed(2)}s`
                  : "—";

              const started = start
                ? start.toLocaleString()
                : "—";

              return (
                <tr
                  key={execution._id}
                  className="border-b border-zinc-800/50 last:border-b-0 transition hover:bg-zinc-900/40"
                >
                  <td className="px-5 py-4 text-sm font-medium text-zinc-300">
                    #{execution._id.slice(-4)}
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-sm text-zinc-200">
                      {execution.workflow?.name ||
                        "Unknown workflow"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <ExecutionStatus
                      status={
                        execution.status === "success"
                          ? "Success"
                          : execution.status === "failed"
                          ? "Failed"
                          : execution.status === "running"
                          ? "Retrying"
                          : execution.status
                      }
                    />
                  </td>

                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {duration}
                  </td>

                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {started}
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

export default ExecutionTable;