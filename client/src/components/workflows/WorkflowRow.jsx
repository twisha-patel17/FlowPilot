import { useState } from "react";
import {
  FiGithub,
  FiClock,
  FiLink,
  FiZap,
  FiMoreVertical,
} from "react-icons/fi";

import WorkflowMenu from "./WorkflowMenu";

const triggerIcons = {
  "GitHub Issue": FiGithub,
  Schedule: FiClock,
  Webhook: FiLink,
  HTTP: FiLink,
  Manual: FiZap,
};

const statusStyles = {
  Active:
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Degraded:
    "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Failing:
    "bg-red-500/10 text-red-400 border-red-500/20",
  Inactive:
    "bg-zinc-800/70 text-zinc-500 border-zinc-700/50",
};

const WorkflowRow = ({
  workflow,
  onMenuClick,
  onEdit,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const TriggerIcon =
    triggerIcons[workflow.trigger] || FiLink;

  const handleMenuClick = () => {
    setMenuOpen((current) => !current);

    if (onMenuClick) {
      onMenuClick(workflow);
    }
  };

  const handleEdit = (selectedWorkflow) => {
    setMenuOpen(false);

    if (onEdit) {
      onEdit(selectedWorkflow);
    }
  };

  return (
    <div className="group grid grid-cols-1 gap-4 border-b border-zinc-800/60 px-4 py-4 transition-colors hover:bg-zinc-900/40 md:grid-cols-[minmax(240px,2fr)_140px_110px_90px_90px_40px] md:items-center md:gap-3">

      {/* Name */}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-200">
          {workflow.name}
        </p>

        <p className="mt-1 truncate text-xs text-zinc-600">
          {workflow.description || "No description"}
        </p>
      </div>

      {/* Trigger */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <TriggerIcon className="h-3.5 w-3.5 shrink-0 text-zinc-600" />

        <span>{workflow.trigger}</span>
      </div>

      {/* Status */}
      <div>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium ${
            statusStyles[workflow.status] ||
            statusStyles.Inactive
          }`}
        >
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />

          {workflow.status}
        </span>
      </div>

      {/* Last Run */}
      <div className="text-xs text-zinc-500">
        <span className="md:hidden">
          Last run:{" "}
        </span>

        {workflow.lastRun}
      </div>

      {/* Success Rate */}
      <div className="text-xs font-medium text-zinc-300">
        <span className="md:hidden">
          Success:{" "}
        </span>

        {workflow.successRate}
      </div>

      {/* Menu */}
      <div className="relative flex justify-end">
        <button
          type="button"
          onClick={handleMenuClick}
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          aria-label={`Actions for ${workflow.name}`}
        >
          <FiMoreVertical className="h-4 w-4" />
        </button>

        <WorkflowMenu
          workflow={workflow}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onEdit={handleEdit}
          onDuplicate={(selectedWorkflow) =>
            console.log(
              "Duplicate:",
              selectedWorkflow
            )
          }
          onToggle={(selectedWorkflow) =>
            console.log(
              "Toggle:",
              selectedWorkflow
            )
          }
          onDelete={(selectedWorkflow) =>
            console.log(
              "Delete:",
              selectedWorkflow
            )
          }
        />
      </div>
    </div>
  );
};

export default WorkflowRow;