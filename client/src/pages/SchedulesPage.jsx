import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import ScheduleCard from "../components/schedules/ScheduleCard";
import {
  getWorkflows,
  toggleWorkflow,
} from "../api/workflowApi";

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

  const toggleMutation = useMutation({
    mutationFn: toggleWorkflow,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workflows"],
      });
    },
  });

  const workflows = data?.workflows || [];

  const schedules = workflows.filter(
    (workflow) => workflow.trigger?.type === "schedule"
  );

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
            Workflows that run automatically on a time-based trigger.
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
            Workflows that run automatically on a time-based trigger.
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

      {/* Header */}

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
          Schedules
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Workflows that run automatically on a time-based trigger.
        </p>
      </div>

      {/* Empty state */}

      {schedules.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/70 bg-[#0d0d0f] p-8 text-center">
          <h2 className="text-sm font-semibold text-zinc-200">
            No scheduled workflows
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            Create a workflow with a schedule trigger to see it here.
          </p>

          <button
            type="button"
            onClick={() => navigate("/app/workflows/new")}
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
              schedule={formatSchedule(workflow.trigger?.config)}
              nextRun="Not scheduled"
              lastRun="Not available"
              active={workflow.status === "active"}
              onToggle={() => handleToggle(workflow._id)}
              onOpen={() => handleOpen(workflow._id)}
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
    return `${frequency} at ${time}`;
  }

  return frequency || time;
};

export default SchedulesPage;