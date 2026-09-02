import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getWorkflows } from "../api/workflowApi";

import WorkflowHeader from "../components/workflows/WorkflowHeader";
import WorkflowFilters from "../components/workflows/WorkflowFilters";
import WorkflowTable from "../components/workflows/WorkflowTable";

const WorkflowsPage = () => {
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["workflows"],
    queryFn: getWorkflows,
  });

  const workflows = data?.workflows || [];

  const formattedWorkflows = useMemo(() => {
    return workflows.map((workflow) => ({
      ...workflow,

      // Convert backend values for the existing UI
      id: workflow._id,

      trigger:
        workflow.trigger?.type === "github"
          ? "GitHub Issue"
          : workflow.trigger?.type === "schedule"
          ? "Schedule"
          : workflow.trigger?.type === "webhook"
          ? "Webhook"
          : workflow.trigger?.type === "http"
          ? "HTTP"
          : "Manual",

      status:
        workflow.status === "active"
          ? "Active"
          : "Inactive",

      lastRun: "Never",

      successRate: "-",
    }));
  }, [workflows]);

  const filteredWorkflows = useMemo(() => {
    return formattedWorkflows.filter((workflow) => {
      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Active" &&
          workflow.status === "Active") ||
        (activeFilter === "Inactive" &&
          workflow.status === "Inactive");

      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        workflow.name.toLowerCase().includes(searchValue) ||
        workflow.description
          .toLowerCase()
          .includes(searchValue) ||
        workflow.trigger.toLowerCase().includes(searchValue);

      return matchesFilter && matchesSearch;
    });
  }, [formattedWorkflows, activeFilter, search]);

  const handleCreateWorkflow = () => {
    navigate("/app/workflows/new");
  };

  const handleEditWorkflow = (workflow) => {
    navigate(`/app/workflows/${workflow._id}`);
  };

  const handleMenuClick = (workflow) => {
    console.log("Menu clicked:", workflow);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-zinc-500">
          Loading workflows...
        </p>
      </div>
    );
  }

  if (isError) {
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
      {/* Header */}
      <WorkflowHeader onCreate={handleCreateWorkflow} />

      {/* Filters */}
      <WorkflowFilters
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        search={search}
        setSearch={setSearch}
      />

      {/* Table */}
      <WorkflowTable
        workflows={filteredWorkflows}
        onMenuClick={handleMenuClick}
        onEdit={handleEditWorkflow}
      />
    </div>
  );
};

export default WorkflowsPage;