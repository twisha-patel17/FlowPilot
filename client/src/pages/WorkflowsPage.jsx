import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useExecutions } from "../hooks/useExecutions";
import { useWorkspace } from "../context/WorkspaceContext";
import { useWorkflows } from "../hooks/useWorkflows";

import WorkflowHeader from "../components/workflows/WorkflowHeader";
import WorkflowFilters from "../components/workflows/WorkflowFilters";
import WorkflowTable from "../components/workflows/WorkflowTable";

const WorkflowsPage = () => {
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] =
    useState("All");

  const [search, setSearch] =
    useState("");

  const {
    currentWorkspace,
    loading: workspaceLoading,
  } = useWorkspace();

  const workspaceId =
    currentWorkspace?._id;

  const {
    workflows,
    isLoading: workflowsLoading,
    isError: workflowsError,
    toggleWorkflow,
    isToggling,
    deleteWorkflow,
    isDeleting,
    createWorkflow,
    isCreating,
  } = useWorkflows();

  const {
    executions,
    isLoading: executionsLoading,
  } = useExecutions(workspaceId);

  const formattedWorkflows =
    useMemo(() => {
      return workflows.map((workflow) => {
        const workflowExecutions =
          executions.filter(
            (execution) => {
              const executionWorkflow =
                execution.workflow;

              const executionWorkflowId =
                executionWorkflow?._id ||
                executionWorkflow;

              return (
                executionWorkflowId ===
                workflow._id
              );
            }
          );

        const completedExecutions =
          workflowExecutions.filter(
            (execution) =>
              execution.status ===
                "success" ||
              execution.status ===
                "failed"
          );

        const successfulExecutions =
          completedExecutions.filter(
            (execution) =>
              execution.status ===
              "success"
          );

        const successRate =
          completedExecutions.length > 0
            ? `${(
                (successfulExecutions.length /
                  completedExecutions.length) *
                100
              ).toFixed(1)}%`
            : "-";

        const latestExecution =
          [...workflowExecutions].sort(
            (a, b) =>
              new Date(
                b.createdAt
              ) -
              new Date(
                a.createdAt
              )
          )[0];

        const lastRun =
          latestExecution
            ? formatLastRun(
                latestExecution.createdAt
              )
            : "Never";

        const isActive =
          workflow.status ===
          "active";

        return {
          ...workflow,

          id: workflow._id,

          trigger:
            workflow.trigger?.type ===
            "github"
              ? "GitHub Issue"
              : workflow.trigger?.type ===
                "schedule"
              ? "Schedule"
              : workflow.trigger?.type ===
                "webhook"
              ? "Webhook"
              : workflow.trigger?.type ===
                "http"
              ? "HTTP"
              : "Manual",

          status: isActive
            ? "Active"
            : "Inactive",

          lastRun,
          successRate,
        };
      });
    }, [workflows, executions]);

  const filteredWorkflows =
    useMemo(() => {
      const searchValue =
        search
          .toLowerCase()
          .trim();

      return formattedWorkflows.filter(
        (workflow) => {
          const matchesFilter =
            activeFilter === "All" ||
            (activeFilter ===
              "Active" &&
              workflow.status ===
                "Active") ||
            (activeFilter ===
              "Inactive" &&
              workflow.status ===
                "Inactive");

          const name =
            workflow.name?.toLowerCase() ||
            "";

          const description =
            workflow.description?.toLowerCase() ||
            "";

          const trigger =
            workflow.trigger?.toLowerCase() ||
            "";

          const matchesSearch =
            !searchValue ||
            name.includes(searchValue) ||
            description.includes(
              searchValue
            ) ||
            trigger.includes(searchValue);

          return (
            matchesFilter &&
            matchesSearch
          );
        }
      );
    }, [
      formattedWorkflows,
      activeFilter,
      search,
    ]);

  const handleCreateWorkflow =
    () => {
      navigate(
        "/app/workflows/new"
      );
    };

  const handleEditWorkflow =
    (workflow) => {
      navigate(
        `/app/workflows/${workflow._id}`
      );
    };

  const handleMenuClick =
    (workflow) => {
      console.log(
        "Workflow actions:",
        workflow.name
      );
    };

  const handleToggleWorkflow =
    async (workflow) => {
      if (
        !workspaceId ||
        !workflow?._id ||
        isToggling
      ) {
        return;
      }

      try {
        await toggleWorkflow({
          id: workflow._id,
        });
      } catch (error) {
        console.error(
          "Failed to toggle workflow:",
          error
        );
      }
    };

  const handleDeleteWorkflow =
    async (workflow) => {
      if (
        !workspaceId ||
        !workflow?._id ||
        isDeleting
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete "${
            workflow.name ||
            "Untitled Workflow"
          }"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        await deleteWorkflow({
          id: workflow._id,
        });
      } catch (error) {
        console.error(
          "Failed to delete workflow:",
          error
        );
      }
    };

  const handleDuplicateWorkflow =
    async (workflow) => {
      if (
        !workspaceId ||
        !workflow?._id ||
        isCreating
      ) {
        return;
      }

      const duplicateData = {
        name: `${
          workflow.name ||
          "Untitled Workflow"
        } (Copy)`,

        description:
          workflow.description || "",

        trigger: {
          type:
            workflow.trigger?.type ||
            "manual",

          config:
            workflow.trigger?.config ||
            {},
        },

        nodes:
          workflow.nodes || [],

        edges:
          workflow.edges || [],
      };

      try {
        await createWorkflow({
          workflowData:
            duplicateData,
        });
      } catch (error) {
        console.error(
          "Failed to duplicate workflow:",
          error
        );
      }
    };

  if (
    workspaceLoading ||
    !workspaceId
  ) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-zinc-500">
          Loading workspace...
        </p>
      </div>
    );
  }

  if (
    workflowsLoading ||
    executionsLoading
  ) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-zinc-500">
          Loading workflows...
        </p>
      </div>
    );
  }

  if (workflowsError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-red-400">
          Failed to load workflows.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <WorkflowHeader
        onCreate={
          handleCreateWorkflow
        }
      />

      <WorkflowFilters
        activeFilter={
          activeFilter
        }
        setActiveFilter={
          setActiveFilter
        }
        search={search}
        setSearch={setSearch}
      />

      <WorkflowTable
        workflows={
          filteredWorkflows
        }
        onMenuClick={
          handleMenuClick
        }
        onEdit={
          handleEditWorkflow
        }
        onDuplicate={
          handleDuplicateWorkflow
        }
        onToggle={
          handleToggleWorkflow
        }
        onDelete={
          handleDeleteWorkflow
        }
      />
    </div>
  );
};

const formatLastRun = (date) => {
  const timestamp =
    new Date(date).getTime();

  if (
    Number.isNaN(timestamp)
  ) {
    return "Unknown";
  }

  const diff =
    Date.now() - timestamp;

  if (diff < 0) {
    return "Scheduled";
  }

  const minutes =
    Math.floor(
      diff / 60000
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(
    date
  ).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};

export default WorkflowsPage;