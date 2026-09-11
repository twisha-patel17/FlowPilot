import { useQuery } from "@tanstack/react-query";
import { getWorkflows } from "../../api/workflowApi";
import { getExecutions } from "../../api/executionApi";
import { useWorkspace } from "../../context/WorkspaceContext";

const ActiveWorkflows = () => {
  const { currentWorkspace } = useWorkspace();

  const workspaceId = currentWorkspace?._id;

  const { data: workflowData, isLoading: workflowsLoading } = useQuery({
    queryKey: ["workflows", workspaceId],
    queryFn: () => getWorkflows(workspaceId),
    enabled: !!workspaceId,
  });

  const { data: executionData, isLoading: executionsLoading } = useQuery({
    queryKey: ["executions", workspaceId],
    queryFn: () => getExecutions(workspaceId),
    enabled: !!workspaceId,
  });

  const workflows = workflowData?.workflows || [];
  const executions = executionData?.executions || [];

  const activeWorkflows = workflows
    .filter((workflow) => workflow.active)
    .slice(0, 5);

  const getWorkflowExecutions = (workflowId) => {
    return executions.filter(
      (execution) =>
        execution.workflow?._id === workflowId ||
        execution.workflow === workflowId
    );
  };

  const getSuccessRate = (workflowId) => {
    const workflowExecutions = getWorkflowExecutions(workflowId);

    const completed = workflowExecutions.filter(
      (execution) =>
        execution.status === "success" ||
        execution.status === "failed"
    );

    if (completed.length === 0) {
      return "No runs yet";
    }

    const successful = completed.filter(
      (execution) => execution.status === "success"
    ).length;

    return `${((successful / completed.length) * 100).toFixed(1)}% success`;
  };

  const getLastRun = (workflowId) => {
    const workflowExecutions = getWorkflowExecutions(workflowId);

    if (workflowExecutions.length === 0) {
      return "no runs yet";
    }

    const latest = [...workflowExecutions].sort(
      (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    )[0];

    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - new Date(latest.createdAt).getTime();

    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) {
      return "last run just now";
    }

    if (minutes < 60) {
      return `last run ${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `last run ${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    return `last run ${days}d ago`;
  };

  if (workflowsLoading || executionsLoading) {
    return (
      <section className="rounded-lg border border-zinc-800/70 bg-[#111113]">
        <div className="border-b border-zinc-800/70 px-4 py-3">
          <h2 className="text-sm font-medium text-zinc-200">
            Active Workflows
          </h2>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="h-4 w-40 animate-pulse rounded bg-zinc-800" />

              <div className="space-y-1 text-right">
                <div className="ml-auto h-3 w-20 animate-pulse rounded bg-zinc-800" />
                <div className="ml-auto h-2 w-14 animate-pulse rounded bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-zinc-800/70 bg-[#111113]">
      <div className="border-b border-zinc-800/70 px-4 py-3">
        <h2 className="text-sm font-medium text-zinc-200">
          Active Workflows
        </h2>
      </div>

      {activeWorkflows.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-zinc-500">
            No active workflows
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/60">
          {activeWorkflows.map((workflow) => (
            <div
              key={workflow._id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <p className="truncate text-sm text-zinc-300">
                {workflow.name || "Untitled Workflow"}
              </p>

              <div className="shrink-0 text-right">
                <p className="text-[11px] text-emerald-400">
                  {getSuccessRate(workflow._id)}
                </p>

                <p className="mt-0.5 text-[10px] text-zinc-600">
                  {getLastRun(workflow._id)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ActiveWorkflows;