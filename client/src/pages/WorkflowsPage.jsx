import { useMemo, useState } from "react";

import WorkflowHeader from "../components/workflows/WorkflowHeader";
import WorkflowFilters from "../components/workflows/WorkflowFilters";
import WorkflowTable from "../components/workflows/WorkflowTable";

const mockWorkflows = [
  {
    id: 1,
    name: "High Priority GitHub Issues",
    description:
      "Notify Discord when high priority issues are created",
    trigger: "GitHub Issue",
    status: "Active",
    lastRun: "2m ago",
    successRate: "99.2%",
  },
  {
    id: 2,
    name: "Daily Standup Reminder",
    description:
      "Post a reminder to Discord every weekday morning",
    trigger: "Schedule",
    status: "Active",
    lastRun: "8h ago",
    successRate: "100%",
  },
  {
    id: 3,
    name: "Issue Auto-Triage",
    description:
      "Route new issues to the right channel based on labels",
    trigger: "GitHub Issue",
    status: "Degraded",
    lastRun: "21m ago",
    successRate: "94.1%",
  },
  {
    id: 4,
    name: "New User Welcome Email",
    description:
      "Send a welcome email when a user signs up",
    trigger: "Webhook",
    status: "Active",
    lastRun: "3h ago",
    successRate: "100%",
  },
  {
    id: 5,
    name: "Prod Error Alerts",
    description:
      "Alert the team the moment a production error is thrown",
    trigger: "Webhook",
    status: "Failing",
    lastRun: "1m ago",
    successRate: "88.4%",
  },
  {
    id: 6,
    name: "Weekly Report Export",
    description:
      "Export weekly metrics and email them to the team",
    trigger: "Schedule",
    status: "Inactive",
    lastRun: "4d ago",
    successRate: "100%",
  },
];

const WorkflowsPage = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filteredWorkflows = useMemo(() => {
    return mockWorkflows.filter((workflow) => {
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
        workflow.description.toLowerCase().includes(searchValue) ||
        workflow.trigger.toLowerCase().includes(searchValue);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, search]);

  const handleCreateWorkflow = () => {
    console.log("Create workflow");
  };

  const handleMenuClick = (workflow) => {
    console.log("Menu clicked:", workflow);
  };

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
      />
    </div>
  );
};

export default WorkflowsPage;