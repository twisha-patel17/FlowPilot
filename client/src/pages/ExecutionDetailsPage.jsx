import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiCopy,
  FiRefreshCw,
  FiX,
  FiAlertCircle,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";

import { getExecution } from "../api/executionApi";

const ExecutionDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [expandedStep, setExpandedStep] = useState(null);
  const [activeTab, setActiveTab] = useState("output");

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["execution", id],
    queryFn: () => getExecution(id),
    enabled: !!id,
  });

  const execution = data?.execution;

  const retryMutation = useMutation({
    mutationFn: async () => {
    
      throw new Error(
        "Retry functionality is not connected yet."
      );
    },

    onError: (error) => {
      alert(error.message);
    },
  });

  const totalDuration = useMemo(() => {
    if (
      !execution?.startedAt ||
      !execution?.finishedAt
    ) {
      return "—";
    }

    const duration =
      new Date(execution.finishedAt).getTime() -
      new Date(execution.startedAt).getTime();

    return formatDuration(duration);
  }, [execution]);

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <FiRefreshCw className="h-4 w-4 animate-spin" />
          Loading execution...
        </div>
      </div>
    );
  }

  if (isError || !execution) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
            <FiAlertCircle className="h-5 w-5 text-red-400" />
          </div>

          <h1 className="mt-4 text-sm font-semibold text-zinc-200">
            Execution not found
          </h1>

          <p className="mt-1 text-xs text-zinc-500">
            We couldn't load this execution.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/app/executions")
            }
            className="mt-5 inline-flex h-8 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800"
          >
            <FiArrowLeft className="h-3.5 w-3.5" />
            Back to Executions
          </button>
        </div>
      </div>
    );
  }

  const executionNumber = execution._id
    ? execution._id.slice(-4)
    : "----";

  const status = formatStatus(
    execution.status
  );

  const workflowName =
    execution.workflow?.name ||
    "Unknown Workflow";

  const startedAt = execution.startedAt
    ? new Date(execution.startedAt)
    : null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">

      <button
        type="button"
        onClick={() =>
          navigate("/app/executions")
        }
        className="inline-flex items-center gap-2 text-xs text-zinc-500 transition hover:text-zinc-200"
      >
        <FiArrowLeft className="h-3.5 w-3.5" />
        Back to Executions
      </button>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span>Executions</span>
            <span>/</span>
            <span className="text-zinc-500">
              #{executionNumber}
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
            Execution #{executionNumber}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <ExecutionStatus
              status={status}
            />

            <span className="text-xs text-zinc-500">
              Duration: {totalDuration}
            </span>

            <span className="text-zinc-700">
              •
            </span>

            <span className="text-xs text-zinc-500">
              Started{" "}
              {startedAt
                ? formatRelativeTime(startedAt)
                : "—"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            retryMutation.mutate()
          }
          disabled={retryMutation.isPending}
          className="inline-flex h-9 items-center gap-2 self-start rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiRefreshCw
            className={`h-3.5 w-3.5 ${
              retryMutation.isPending
                ? "animate-spin"
                : ""
            }`}
          />

          Retry from step
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">

        <InfoCard
          label="Workflow"
          value={workflowName}
        />

        <InfoCard
          label="Trigger"
          value={capitalize(
            execution.trigger || "manual"
          )}
        />

        <InfoCard
          label="Steps"
          value={`${execution.steps?.length || 0}`}
        />

      </div>

      {/* EXECUTION STEPS */}
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-zinc-200">
            Execution Steps
          </h2>

          <p className="mt-1 text-xs text-zinc-600">
            Each step represents one node executed in the workflow.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-800/70 bg-[#0d0d0f]">
          {execution.steps?.length > 0 ? (
            <div className="p-4 sm:p-6">
              {execution.steps.map(
                (step, index) => {
                  const isExpanded =
                    expandedStep === index;

                  const isLast =
                    index ===
                    execution.steps.length - 1;

                  return (
                    <ExecutionStep
                      key={`${step.nodeId || "step"}-${index}`}
                      step={step}
                      index={index}
                      isLast={isLast}
                      isExpanded={isExpanded}
                      onToggle={() => {
                        setExpandedStep(
                          isExpanded
                            ? null
                            : index
                        );
                        setActiveTab(
                          step.error
                            ? "error"
                            : "output"
                        );
                      }}
                      activeTab={activeTab}
                      onTabChange={setActiveTab}
                    />
                  );
                }
              )}
            </div>
          ) : (
            <EmptySteps />
          )}
        </div>
      </section>

      {/* EXECUTION ERROR */}
      {execution.status === "failed" &&
        execution.error && (
          <div className="overflow-hidden rounded-xl border border-red-500/20 bg-red-500/[0.04]">
            <div className="flex items-start gap-3 p-4 sm:p-5">

              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                <FiX className="h-3.5 w-3.5 text-red-400" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-400">
                  Execution failed
                </p>

                <p className="mt-1 text-xs leading-5 text-red-300/60">
                  {execution.error}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-red-500/10 px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={() =>
                  retryMutation.mutate()
                }
                className="inline-flex h-8 items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
              >
                <FiRefreshCw className="h-3.5 w-3.5" />
                Retry Step
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/app/executions")
                }
                className="text-xs text-zinc-500 transition hover:text-zinc-300"
              >
                View Logs
              </button>
            </div>
          </div>
        )}
    </div>
  );
};

const ExecutionStep = ({
  step,
  index,
  isLast,
  isExpanded,
  onToggle,
  activeTab,
  onTabChange,
}) => {
  const failed = step.status === "failed";

  return (
    <div className="relative">

      {!isLast && (
        <div className="absolute bottom-0 left-[11px] top-8 w-px bg-zinc-800" />
      )}

      <div className="relative">

        {/* STEP ROW */}
        <button
          type="button"
          onClick={onToggle}
          className={`group flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition ${
            isExpanded
              ? "bg-zinc-900/60"
              : "hover:bg-zinc-900/40"
          }`}
        >

          {/* STATUS ICON */}
          <StepStatusIcon
            status={step.status}
          />

          {/* STEP NAME */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-200">
              {formatNodeName(step.type)}
            </p>

            {step.nodeId && (
              <p className="mt-0.5 truncate font-mono text-[10px] text-zinc-700">
                {step.nodeId}
              </p>
            )}
          </div>

          {/* DURATION */}
          <span className="shrink-0 font-mono text-xs text-zinc-600">
            {formatDuration(
              step.duration
            )}
          </span>

          {/* CHEVRON */}
          <span className="flex h-6 w-6 shrink-0 items-center justify-center text-zinc-600 transition group-hover:text-zinc-400">
            {isExpanded ? (
              <FiChevronDown className="h-3.5 w-3.5" />
            ) : (
              <FiChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
        </button>

        {/* STEP DETAILS */}
        {isExpanded && (
          <div className="mb-3 ml-9 mt-1 overflow-hidden rounded-lg border border-zinc-800/70 bg-[#111113]">

            {/* TABS */}
            <div className="flex items-center gap-5 border-b border-zinc-800/70 px-4 pt-3">

              <StepTab
                active={activeTab === "input"}
                onClick={() =>
                  onTabChange("input")
                }
              >
                Input
              </StepTab>

              <StepTab
                active={activeTab === "output"}
                onClick={() =>
                  onTabChange("output")
                }
              >
                Output
              </StepTab>

              <StepTab
                active={activeTab === "error"}
                onClick={() =>
                  onTabChange("error")
                }
                danger={!!step.error}
              >
                Error
              </StepTab>

            </div>

            {/* CONTENT */}
            <StepContent
              step={step}
              activeTab={activeTab}
            />

            {/* STEP META */}
            <div className="flex items-center justify-between border-t border-zinc-800/70 px-4 py-2.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                Step {index + 1}
              </span>

              <span className="font-mono text-[10px] text-zinc-600">
                {formatDuration(
                  step.duration
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StepContent = ({
  step,
  activeTab,
}) => {
  let value;

  if (activeTab === "input") {
    value = step.input || {};
  } else if (activeTab === "error") {
    value = step.error || null;
  } else {
    value = step.output || {};
  }

  if (
    activeTab === "error" &&
    !step.error
  ) {
    return (
      <div className="flex min-h-[120px] items-center justify-center px-4 py-8">
        <div className="text-center">
          <FiCheck className="mx-auto h-5 w-5 text-emerald-400" />

          <p className="mt-2 text-xs text-zinc-500">
            No error for this step.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative p-4">

      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
          {activeTab}
        </p>

        <CopyButton value={value} />
      </div>

      <pre
        className={`max-h-80 overflow-auto rounded-lg bg-[#0d0d0f] p-4 font-mono text-xs leading-5 ${
          activeTab === "error"
            ? "text-red-300"
            : "text-zinc-400"
        }`}
      >
        {formatJSON(value)}
      </pre>
    </div>
  );
};

const StepStatusIcon = ({
  status,
}) => {
  if (status === "failed") {
    return (
      <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-[#0d0d0f]">
        <FiX className="h-3 w-3 text-red-400" />
      </span>
    );
  }

  if (status === "running") {
    return (
      <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-[#0d0d0f]">
        <FiRefreshCw className="h-3 w-3 animate-spin text-blue-400" />
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-[#0d0d0f]">
        <FiClock className="h-3 w-3 text-amber-400" />
      </span>
    );
  }

  return (
    <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-[#0d0d0f]">
      <FiCheck className="h-3 w-3 text-emerald-400" />
    </span>
  );
};

const ExecutionStatus = ({
  status,
}) => {
  const config = {
    Success: {
      wrapper:
        "bg-emerald-500/10 text-emerald-400",
      dot: "bg-emerald-400",
    },

    Failed: {
      wrapper:
        "bg-red-500/10 text-red-400",
      dot: "bg-red-400",
    },

    Running: {
      wrapper:
        "bg-blue-500/10 text-blue-400",
      dot: "bg-blue-400",
    },

    Pending: {
      wrapper:
        "bg-amber-500/10 text-amber-400",
      dot: "bg-amber-400",
    },
  };

  const current =
    config[status] || config.Pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${current.wrapper}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${current.dot}`}
      />

      {status}
    </span>
  );
};
const InfoCard = ({
  label,
  value,
}) => {
  return (
    <div className="rounded-lg border border-zinc-800/70 bg-[#0d0d0f] px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
        {label}
      </p>

      <p className="mt-1.5 truncate text-xs font-medium text-zinc-300">
        {value}
      </p>
    </div>
  );
};

const StepTab = ({
  active,
  onClick,
  children,
  danger,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative pb-2.5 text-xs font-medium transition ${
        active
          ? danger
            ? "text-red-400"
            : "text-zinc-100"
          : "text-zinc-600 hover:text-zinc-400"
      }`}
    >
      {children}

      {active && (
        <span
          className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
            danger
              ? "bg-red-500"
              : "bg-violet-500"
          }`}
        />
      )}
    </button>
  );
};

const CopyButton = ({
  value,
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        formatJSON(value)
      );
    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded p-1.5 text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
      aria-label="Copy value"
    >
      <FiCopy className="h-3 w-3" />
    </button>
  );
};

const EmptySteps = () => {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900">
        <FiClock className="h-4 w-4 text-zinc-600" />
      </div>

      <p className="mt-3 text-sm text-zinc-400">
        No execution steps
      </p>

      <p className="mt-1 text-xs text-zinc-600">
        This execution hasn't recorded any steps yet.
      </p>
    </div>
  );
};

const formatStatus = (
  status
) => {
  switch (status) {
    case "success":
      return "Success";

    case "failed":
      return "Failed";

    case "running":
      return "Running";

    case "pending":
      return "Pending";

    default:
      return "Pending";
  }
};

const formatNodeName = (
  type
) => {
  if (!type) {
    return "Unknown Step";
  }

  return type
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

const capitalize = (
  value
) => {
  if (!value) return "";

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
};

const formatDuration = (
  milliseconds
) => {
  if (
    milliseconds === null ||
    milliseconds === undefined
  ) {
    return "—";
  }

  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  return `${(
    milliseconds / 1000
  ).toFixed(2)}s`;
};

const formatJSON = (
  value
) => {
  if (typeof value === "string") {
    return value;
  }

  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  try {
    return JSON.stringify(
      value,
      null,
      2
    );
  } catch {
    return String(value);
  }
};

const formatRelativeTime = (
  date
) => {
  const seconds = Math.floor(
    (Date.now() -
      date.getTime()) /
      1000
  );

  if (seconds < 60) {
    return `${Math.max(
      seconds,
      0
    )}s ago`;
  }

  const minutes = Math.floor(
    seconds / 60
  );

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  return `${days}d ago`;
};

export default ExecutionDetailsPage;