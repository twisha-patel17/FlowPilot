import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import ExecutionFilters from "../components/executions/ExecutionFilters";
import ExecutionTable from "../components/executions/ExecutionTable";

import { useExecutions } from "../hooks/useExecutions";
import { getWorkflows } from "../api/workflowApi";

import { useWorkspace } from "../context/WorkspaceContext";

const ExecutionsPage = () => {
  const [search, setSearch] = useState("");
  const [workflow, setWorkflow] = useState("all");
  const [status, setStatus] = useState("all");
  const [time, setTime] = useState("24h");
  const [trigger, setTrigger] = useState("all");

  const {
    currentWorkspace,
    loading: workspaceLoading,
  } = useWorkspace();

  const workspaceId = currentWorkspace?._id;

  const {
    data: executionData,
    isLoading: executionsLoading,
  } = useExecutions(workspaceId);

  const {
    data: workflowData,
  } = useQuery({
    queryKey: ["workflows", workspaceId],
    queryFn: () => getWorkflows(workspaceId),
    enabled: !!workspaceId,
  });

  const executions =
    executionData?.executions || [];

  const workflows =
    workflowData?.workflows || [];

  const filteredExecutions = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();

    const timeLimits = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    return executions.filter((execution) => {
      /* Search */
      if (searchValue) {
        const workflowName =
          execution.workflow?.name?.toLowerCase() || "";

        const executionId =
          execution._id?.toLowerCase() || "";

        if (
          !workflowName.includes(searchValue) &&
          !executionId.includes(searchValue)
        ) {
          return false;
        }
      }

      /* Workflow */
      if (
        workflow !== "all" &&
        execution.workflow?._id !== workflow
      ) {
        return false;
      }

      /* Status */
      if (
        status !== "all" &&
        execution.status !== status
      ) {
        return false;
      }

      /* Trigger */
      if (
        trigger !== "all" &&
        execution.trigger !== trigger
      ) {
        return false;
      }

      /* Time */
      if (time !== "all") {
        if (!execution.startedAt) {
          return false;
        }

        const started =
          new Date(
            execution.startedAt
          ).getTime();

        const limit =
          timeLimits[time];

        if (now - started > limit) {
          return false;
        }
      }

      return true;
    });
  }, [
    executions,
    search,
    workflow,
    status,
    time,
    trigger,
  ]);

  if (workspaceLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-zinc-500">
          Loading workspace...
        </p>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-zinc-500">
          No workspace selected.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
          Executions
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Monitor every workflow execution.
        </p>
      </div>

      {/* Filters */}
      <ExecutionFilters
        search={search}
        setSearch={setSearch}
        workflow={workflow}
        setWorkflow={setWorkflow}
        status={status}
        setStatus={setStatus}
        time={time}
        setTime={setTime}
        trigger={trigger}
        setTrigger={setTrigger}
        workflows={workflows}
      />

      {/* Results */}
      <ExecutionTable
        executions={filteredExecutions}
        isLoading={executionsLoading}
      />
    </div>
  );
};

export default ExecutionsPage;