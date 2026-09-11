import { useQuery } from "@tanstack/react-query";

import { getWorkflows } from "../../api/workflowApi";
import { getExecutions } from "../../api/executionApi";
import { useWorkspace } from "../../context/WorkspaceContext";

const WorkflowStats = () => {
  const { currentWorkspace } = useWorkspace();

  const workspaceId = currentWorkspace?._id;

  const {
    data: workflowData,
    isLoading: workflowsLoading,
  } = useQuery({
    queryKey: ["workflows", workspaceId],
    queryFn: () => getWorkflows(workspaceId),
    enabled: !!workspaceId,
  });

  const {
    data: executionData,
    isLoading: executionsLoading,
  } = useQuery({
    queryKey: ["executions", workspaceId],
    queryFn: () => getExecutions(workspaceId),
    enabled: !!workspaceId,
  });

  const workflows = workflowData?.workflows || [];
  const executions = executionData?.executions || [];

  const activeWorkflows = workflows.filter(
    (workflow) => workflow.active
  ).length;

  const today = new Date();

  const executionsToday = executions.filter((execution) => {
    if (!execution.createdAt) return false;

    const date = new Date(execution.createdAt);

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  });

  const successfulExecutions = executions.filter(
    (execution) => execution.status === "success"
  ).length;

  const failedExecutions = executions.filter(
    (execution) => execution.status === "failed"
  ).length;

  const completedExecutions =
    successfulExecutions + failedExecutions;

  const successRate =
    completedExecutions > 0
      ? (
          (successfulExecutions / completedExecutions) *
          100
        ).toFixed(1)
      : "0.0";

  const stats = [
    {
      label: "Active Workflows",
      value: activeWorkflows,
      change: "Currently active",
      positive: true,
    },
    {
      label: "Executions Today",
      value: executionsToday.length,
      change: "Today",
      positive: true,
    },
    {
      label: "Success Rate",
      value: `${successRate}%`,
      change: "Completed executions",
      positive: true,
    },
    {
      label: "Failed Executions",
      value: failedExecutions,
      change: "Completed failures",
      positive: failedExecutions === 0,
    },
  ];

  const isLoading = workflowsLoading || executionsLoading;

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
              {isLoading ? "—" : stat.value}
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