import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import ScheduleCard from "../components/schedules/ScheduleCard";

import {
  getWorkflows,
  toggleWorkflow,
} from "../api/workflowApi";

import { getExecutions } from "../api/executionApi";

const SchedulesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["workflows"],
    queryFn: getWorkflows,
  });

  const {
    data: executionData,
    isLoading: executionsLoading,
  } = useQuery({
    queryKey: ["executions"],
    queryFn: getExecutions,
  });

  const toggleMutation = useMutation({
    mutationFn: toggleWorkflow,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workflows"],
      });
    },
  });

  const workflows = data?.workflows || [];
  const executions = executionData?.executions || [];

console.log(
  "Workflow triggers:",
  workflows.map((workflow) => ({
    id: workflow._id,
    name: workflow.name,
    status: workflow.status,
    trigger: workflow.trigger,
    triggerType: workflow.trigger?.type,
  }))
);

const schedules = workflows.filter(
  (workflow) =>
    workflow.trigger?.type === "schedule"
);

console.log("Scheduled workflows:", schedules);

  const handleToggle = (workflowId) => {
    toggleMutation.mutate(workflowId);
  };

  const handleOpen = (workflowId) => {
    navigate(`/app/workflows/${workflowId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
            Schedules
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Workflows that run automatically on a
            time-based trigger.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/70 bg-[#0d0d0f] p-6 text-sm text-zinc-500">
          Loading schedules...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
            Schedules
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Workflows that run automatically on a
            time-based trigger.
          </p>
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-400">
          Failed to load schedules.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
          Schedules
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Workflows that run automatically on a
          time-based trigger.
        </p>
      </div>

      {schedules.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/70 bg-[#0d0d0f] p-8 text-center">
          <h2 className="text-sm font-semibold text-zinc-200">
            No scheduled workflows
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            Create a workflow with a schedule trigger
            to see it here.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/app/workflows/new")
            }
            className="mt-4 rounded-md bg-violet-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-violet-400"
          >
            Create Workflow
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((workflow) => (
            <ScheduleCard
              key={workflow._id}
              name={workflow.name}
              schedule={formatSchedule(
                workflow.trigger?.config
              )}
              nextRun={getNextRun(workflow)}
              lastRun={
                executionsLoading
                  ? "Loading..."
                  : getLastRun(
                      workflow._id,
                      executions
                    )
              }
              active={
                workflow.status === "active"
              }
              onToggle={() =>
                handleToggle(workflow._id)
              }
              onOpen={() =>
                handleOpen(workflow._id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

const formatSchedule = (config = {}) => {
  const { frequency, time } = config;

  if (!frequency && !time) {
    return "Schedule configured";
  }

  if (frequency && time) {
    const frequencyLabels = {
      daily: "Every day",
      weekday: "Every weekday",
      weekly: "Every week",
      custom: "Custom",
    };

    const frequencyLabel =
      frequencyLabels[frequency] || frequency;

    return `${frequencyLabel} at ${time}`;
  }

  return frequency || time;
};

const getLastRun = (
  workflowId,
  executions
) => {
  const workflowExecutions = executions
    .filter((execution) => {
      const executionWorkflow =
        execution.workflow;

      if (!executionWorkflow) {
        return false;
      }

      if (
        typeof executionWorkflow === "object"
      ) {
        return (
          executionWorkflow._id === workflowId
        );
      }

      return executionWorkflow === workflowId;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );

  if (workflowExecutions.length === 0) {
    return "Not available";
  }

  const lastExecution =
    workflowExecutions[0];

  if (!lastExecution.createdAt) {
    return "Not available";
  }

  return formatDate(
    lastExecution.createdAt
  );
};

const getNextRun = (workflow) => {
  if (workflow.status !== "active") {
    return "Inactive";
  }

  const config =
    workflow.trigger?.config || {};

  const { frequency, time } = config;

  if (!time) {
    return "Not scheduled";
  }

  const [hours, minutes] = time
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return "Not scheduled";
  }

  const now = new Date();

  const next = new Date(now);

  next.setHours(
    hours,
    minutes,
    0,
    0
  );

  if (next <= now) {
    next.setDate(
      next.getDate() + 1
    );
  }

  if (frequency === "weekday") {
    while (
      next.getDay() === 0 ||
      next.getDay() === 6
    ) {
      next.setDate(
        next.getDate() + 1
      );
    }
  }

  if (frequency === "weekly") {
    const daysUntilMonday =
      (1 - next.getDay() + 7) % 7;

    if (daysUntilMonday > 0) {
      next.setDate(
        next.getDate() +
          daysUntilMonday
      );
    }
  }

  return formatDate(next);
};

const formatDate = (date) => {
  return new Date(date).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

export default SchedulesPage;