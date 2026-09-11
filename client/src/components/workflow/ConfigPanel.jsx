import {
  FiX,
  FiZap,
  FiLink,
  FiGithub,
  FiClock,
  FiFilter,
  FiGitBranch,
  FiShuffle,
  FiPause,
  FiMessageCircle,
  FiMail,
  FiGlobe,
  FiDatabase,
} from "react-icons/fi";

const nodeIcons = {
  manual: FiZap,
  webhook: FiLink,
  github: FiGithub,
  schedule: FiClock,
  filter: FiFilter,
  condition: FiGitBranch,
  switch: FiShuffle,
  delay: FiPause,
  discord: FiMessageCircle,
  email: FiMail,
  http: FiGlobe,
  mongodb: FiDatabase,
};

// eslint-disable-next-line no-unused-vars
const supportedNodeTypes = [
  "github",
  "webhook",
  "schedule",
  "manual",
  "filter",
  "condition",
  "switch",
  "delay",
  "discord",
  "email",
  "http",
  "mongodb",
];

import { useWorkspace } from "../../context/WorkspaceContext";
import { useQuery } from "@tanstack/react-query";
import { getIntegrations } from "../../api/integrationApi";

const ConfigPanel = ({
  selectedNode,
  onClose,
  onNodeUpdate,
}) => {
  if (!selectedNode) {
    return (
      <aside className="flex h-full w-full flex-col border-l border-zinc-800/70 bg-[#0d0d0f]">
        <div className="flex h-full items-center justify-center px-6 text-center">
          <div>
            <p className="text-sm font-medium text-zinc-300">
              Select a node
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-600">
              Select a node from the canvas to configure it.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const nodeType =
    selectedNode.data?.type ||
    selectedNode.data?.nodeType ||
    selectedNode.type;

  const Icon = nodeIcons[nodeType] || FiZap;

  const config = selectedNode.data?.config || {};

  const updateConfig = (key, value) => {
    if (!onNodeUpdate) return;

    const updatedNode = {
      ...selectedNode,

      data: {
        ...selectedNode.data,

        type: nodeType,

        config: {
          ...config,
          [key]: value,
        },
      },
    };

    onNodeUpdate(updatedNode);
  };

  const renderConfig = () => {
    switch (nodeType) {
      case "github":
        return (
          <GithubConfig
            config={config}
            onChange={updateConfig}
          />
        );

      case "webhook":
        return (
          <WebhookConfig
            config={config}
            onChange={updateConfig}
          />
        );

      case "schedule":
        return (
          <ScheduleConfig
            config={config}
            onChange={updateConfig}
          />
        );

      case "manual":
        return <ManualConfig />;

      case "filter":
        return (
          <FilterConfig
            config={config}
            onChange={updateConfig}
          />
        );

      case "condition":
        return (
          <ConditionConfig
            config={config}
            onChange={updateConfig}
          />
        );

      case "switch":
        return (
          <SwitchConfig
            config={config}
            onChange={updateConfig}
          />
        );

      case "delay":
        return (
          <DelayConfig
            config={config}
            onChange={updateConfig}
          />
        );

      case "discord":
        return (
          <DiscordConfig
            config={config}
            onChange={updateConfig}
          />
        );

      case "email":
        return (
          <EmailConfig
            config={config}
            onChange={updateConfig}
          />
        );

      case "http":
        return (
          <HttpConfig
            config={config}
            onChange={updateConfig}
          />
        );

      case "mongodb":
        return (
          <MongoConfig
            config={config}
            onChange={updateConfig}
          />
        );

      default:
        return (
          <GenericConfig
            selectedNode={selectedNode}
          />
        );
    }
  };

  return (
    <aside className="flex h-full w-full flex-col border-l border-zinc-800/70 bg-[#0d0d0f]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/70 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-violet-400">
            <Icon className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
              Node configuration
            </p>

            <h2 className="mt-0.5 truncate text-sm font-semibold text-zinc-100">
              {selectedNode.data?.label || "Node"}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
          aria-label="Close configuration"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>

      {/* Configuration */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderConfig()}
      </div>
    </aside>
  );
};
const GithubConfig = ({ config, onChange }) => {
  const { currentWorkspace } = useWorkspace();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["integrations", currentWorkspace?._id],
    queryFn: () => getIntegrations(currentWorkspace._id),
    enabled: !!currentWorkspace?._id,
  });

  const githubIntegrations =
    data?.integrations?.filter(
      (integration) =>
        integration.provider === "github" &&
        integration.status === "connected"
    ) || [];

  const connectionOptions = [
    {
      value: "",
      label: isLoading
        ? "Loading GitHub connections..."
        : githubIntegrations.length === 0
        ? "No GitHub connections"
        : "Select GitHub connection",
    },
    ...githubIntegrations.map((integration) => ({
      value: integration._id,
      label: integration.name || "GitHub Connection",
    })),
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        label="Trigger configuration"
        title="GitHub"
      />

      <Field
        label="Connection"
        type="select"
        value={config.integrationId || ""}
        onChange={(value) =>
          onChange("integrationId", value)
        }
        options={connectionOptions}
      />

      {isError && (
        <p className="text-[11px] text-red-400">
          Failed to load GitHub connections.
        </p>
      )}

      {!isLoading &&
        !isError &&
        githubIntegrations.length === 0 && (
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-amber-500/70">
              No connection
            </p>

            <p className="mt-1 text-[11px] leading-5 text-zinc-500">
              Connect a GitHub integration from the
              Integrations page before using this trigger.
            </p>
          </div>
        )}

      <Field
        label="Repository"
        value={config.repository || ""}
        onChange={(value) =>
          onChange("repository", value)
        }
        placeholder="owner/repository"
      />

      <Field
        label="Event"
        type="select"
        value={config.event || "issues"}
        onChange={(value) =>
          onChange("event", value)
        }
        options={[
          {
            value: "issues",
            label: "Issues",
          },
          {
            value: "pull_request",
            label: "Pull Request",
          },
          {
            value: "push",
            label: "Push",
          },
          {
            value: "release",
            label: "Release",
          },
        ]}
      />

      <Field
        label="Action"
        type="select"
        value={config.action || "opened"}
        onChange={(value) =>
          onChange("action", value)
        }
        options={[
          {
            value: "opened",
            label: "Opened",
          },
          {
            value: "closed",
            label: "Closed",
          },
          {
            value: "edited",
            label: "Edited",
          },
          {
            value: "reopened",
            label: "Reopened",
          },
        ]}
      />

      <TestButton />
    </div>
  );
};

const WebhookConfig = ({ config, onChange }) => {
  return (
    <div className="space-y-5">
      <SectionTitle
        label="Trigger configuration"
        title="Webhook"
      />

      <Field
        label="HTTP Method"
        type="select"
        value={config.method || "POST"}
        onChange={(value) =>
          onChange("method", value)
        }
        options={[
          {
            value: "POST",
            label: "POST",
          },
          {
            value: "GET",
            label: "GET",
          },
        ]}
      />

      <Field
        label="Path"
        value={config.path || ""}
        onChange={(value) =>
          onChange("path", value)
        }
        placeholder="/webhooks/..."
      />

      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-400">
          Webhook URL
        </label>

        <div className="rounded-md border border-zinc-800 bg-[#111114] px-3 py-2.5 text-[11px] text-zinc-500">
          Generated after saving the workflow.
        </div>
      </div>
    </div>
  );
};
const ScheduleConfig = ({ config, onChange }) => {
  const selectedDays = config.days || [];

  const days = [
    { value: "Mon", label: "Monday" },
    { value: "Tue", label: "Tuesday" },
    { value: "Wed", label: "Wednesday" },
    { value: "Thu", label: "Thursday" },
    { value: "Fri", label: "Friday" },
    { value: "Sat", label: "Saturday" },
    { value: "Sun", label: "Sunday" },
  ];

  const handleDayToggle = (day) => {
    const updatedDays = selectedDays.includes(day)
      ? selectedDays.filter((item) => item !== day)
      : [...selectedDays, day];

    onChange("days", updatedDays);
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        label="Trigger configuration"
        title="Schedule"
      />

      <Field
        label="Frequency"
        type="select"
        value={config.frequency || "daily"}
        onChange={(value) =>
          onChange("frequency", value)
        }
        options={[
          {
            value: "daily",
            label: "Every day",
          },
          {
            value: "weekday",
            label: "Every weekday",
          },
          {
            value: "weekly",
            label: "Every week",
          },
          {
            value: "custom",
            label: "Custom",
          },
        ]}
      />

      {/* Custom days */}
      {config.frequency === "custom" && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400">
            Days
          </label>

          <div className="space-y-2">
            {days.map((day) => {
              const selected =
                selectedDays.includes(day.value);

              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() =>
                    handleDayToggle(day.value)
                  }
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition ${
                    selected
                      ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  <span>{day.label}</span>

                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                      selected
                        ? "border-violet-500 bg-violet-500 text-white"
                        : "border-zinc-700"
                    }`}
                  >
                    {selected ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedDays.length === 0 && (
            <p className="text-[11px] text-amber-400">
              Select at least one day.
            </p>
          )}
        </div>
      )}

      <Field
        label="Time"
        type="time"
        value={config.time || "20:00"}
        onChange={(value) =>
          onChange("time", value)
        }
      />

      <Field
        label="Timezone"
        type="select"
        value={
          config.timezone || "Asia/Kolkata"
        }
        onChange={(value) =>
          onChange("timezone", value)
        }
        options={[
          {
            value: "Asia/Kolkata",
            label: "Asia/Kolkata",
          },
          {
            value: "UTC",
            label: "UTC",
          },
          {
            value: "America/New_York",
            label: "America/New_York",
          },
          {
            value: "Europe/London",
            label: "Europe/London",
          },
        ]}
      />
    </div>
  );
};
const ManualConfig = () => {
  return (
    <div className="space-y-5">
      <SectionTitle
        label="Trigger configuration"
        title="Manual Trigger"
      />

      <p className="text-xs leading-5 text-zinc-500">
        This workflow can be started manually from
        the workflow page or through the API.
      </p>
    </div>
  );
};

const FilterConfig = ({ config, onChange }) => {
  return (
    <div className="space-y-5">
      <SectionTitle
        label="Logic configuration"
        title="Filter"
      />

      <Field
        label="Field"
        value={config.field || ""}
        onChange={(value) =>
          onChange("field", value)
        }
        placeholder="issue.priority"
      />

      <Field
        label="Operator"
        type="select"
        value={config.operator || "equals"}
        onChange={(value) =>
          onChange("operator", value)
        }
        options={[
          {
            value: "equals",
            label: "Equals",
          },
          {
            value: "not_equals",
            label: "Not equals",
          },
          {
            value: "contains",
            label: "Contains",
          },
          {
            value: "starts_with",
            label: "Starts with",
          },
          {
            value: "exists",
            label: "Exists",
          },
        ]}
      />

      <Field
        label="Value"
        value={config.value || ""}
        onChange={(value) =>
          onChange("value", value)
        }
        placeholder="Enter value"
      />
    </div>
  );
};

const ConditionConfig = ({ config, onChange }) => {
  return (
    <div className="space-y-5">
      <SectionTitle
        label="Logic configuration"
        title="Condition"
      />

      <Field
        label="Field"
        value={config.field || ""}
        onChange={(value) =>
          onChange("field", value)
        }
        placeholder="issue.status"
      />

      <Field
        label="Operator"
        type="select"
        value={config.operator || "equals"}
        onChange={(value) =>
          onChange("operator", value)
        }
        options={[
          {
            value: "equals",
            label: "Equals",
          },
          {
            value: "not_equals",
            label: "Not equals",
          },
          {
            value: "contains",
            label: "Contains",
          },
        ]}
      />

      <Field
        label="Value"
        value={config.value || ""}
        onChange={(value) =>
          onChange("value", value)
        }
        placeholder="Enter value"
      />
    </div>
  );
};

const SwitchConfig = ({ config, onChange }) => {
  return (
    <div className="space-y-5">
      <SectionTitle
        label="Logic configuration"
        title="Switch"
      />

      <Field
        label="Field"
        value={config.field || ""}
        onChange={(value) =>
          onChange("field", value)
        }
        placeholder="issue.label"
      />

      <Field
        label="Cases"
        value={config.cases || ""}
        onChange={(value) =>
          onChange("cases", value)
        }
        placeholder="bug, feature, docs"
      />
    </div>
  );
};

const DelayConfig = ({ config, onChange }) => {
  return (
    <div className="space-y-5">
      <SectionTitle
        label="Logic configuration"
        title="Delay"
      />

      <Field
        label="Duration"
        type="number"
        value={config.duration || "5"}
        onChange={(value) =>
          onChange("duration", value)
        }
        placeholder="5"
      />

      <Field
        label="Unit"
        type="select"
        value={config.unit || "minutes"}
        onChange={(value) =>
          onChange("unit", value)
        }
        options={[
          {
            value: "seconds",
            label: "Seconds",
          },
          {
            value: "minutes",
            label: "Minutes",
          },
          {
            value: "hours",
            label: "Hours",
          },
        ]}
      />
    </div>
  );
};
const DiscordConfig = ({ config, onChange }) => {
  const { currentWorkspace } = useWorkspace();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["integrations", currentWorkspace?._id],
    queryFn: () => getIntegrations(currentWorkspace._id),
    enabled: !!currentWorkspace?._id,
  });

  const discordIntegrations =
    data?.integrations?.filter(
      (integration) =>
        integration.provider === "discord" &&
        integration.status === "connected"
    ) || [];

  const connectionOptions = [
    {
      value: "",
      label: isLoading
        ? "Loading Discord connections..."
        : discordIntegrations.length === 0
        ? "No Discord connections"
        : "Select Discord connection",
    },
    ...discordIntegrations.map((integration) => ({
      value: integration._id,
      label: integration.name || "Discord Connection",
    })),
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        label="Action configuration"
        title="Discord"
      />

      <Field
        label="Connection"
        type="select"
        value={config.integrationId || ""}
        onChange={(value) =>
          onChange("integrationId", value)
        }
        options={connectionOptions}
      />

      {isError && (
        <p className="text-[11px] text-red-400">
          Failed to load Discord connections.
        </p>
      )}

      {!isLoading &&
        !isError &&
        discordIntegrations.length === 0 && (
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-amber-500/70">
              No connection
            </p>

            <p className="mt-1 text-[11px] leading-5 text-zinc-500">
              Connect a Discord integration from the
              Integrations page before using this node.
            </p>
          </div>
        )}

      <Field
        label="Channel"
        type="select"
        value={config.channel || "#development"}
        onChange={(value) =>
          onChange("channel", value)
        }
        options={[
          {
            value: "#development",
            label: "#development",
          },
          {
            value: "#general",
            label: "#general",
          },
          {
            value: "#alerts",
            label: "#alerts",
          },
        ]}
      />

      <TextareaField
        label="Message"
        value={config.message || ""}
        onChange={(value) =>
          onChange("message", value)
        }
        placeholder="Enter message"
        rows={4}
      />

      <div className="rounded-md border border-zinc-800/70 bg-zinc-900/50 px-3 py-2.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
          Discord connection
        </p>

        <p className="mt-1 text-[11px] leading-5 text-zinc-500">
          Select a connected Discord integration to
          send this message.
        </p>
      </div>
    </div>
  );
};
const EmailConfig = ({ config, onChange }) => {
  const { currentWorkspace } = useWorkspace();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["integrations", currentWorkspace?._id],
    queryFn: () => getIntegrations(currentWorkspace._id),
    enabled: !!currentWorkspace?._id,
  });

  const emailIntegrations =
    data?.integrations?.filter(
      (integration) =>
        integration.provider === "email" &&
        integration.status === "connected"
    ) || [];

  const connectionOptions = [
    {
      value: "",
      label: isLoading
        ? "Loading email connections..."
        : emailIntegrations.length === 0
        ? "No email connections"
        : "Select email connection",
    },
    ...emailIntegrations.map((integration) => ({
      value: integration._id,
      label: integration.name || "Email Connection",
    })),
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        label="Action configuration"
        title="Email"
      />

      <Field
        label="Connection"
        type="select"
        value={config.integrationId || ""}
        onChange={(value) =>
          onChange("integrationId", value)
        }
        options={connectionOptions}
      />

      {isError && (
        <p className="text-[11px] text-red-400">
          Failed to load email connections.
        </p>
      )}

      {!isLoading &&
        !isError &&
        emailIntegrations.length === 0 && (
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-amber-500/70">
              No connection
            </p>

            <p className="mt-1 text-[11px] leading-5 text-zinc-500">
              Connect an email integration from the
              Integrations page before using this node.
            </p>
          </div>
        )}

      <Field
        label="To"
        value={config.to || ""}
        onChange={(value) =>
          onChange("to", value)
        }
        placeholder="recipient@example.com"
      />

      <Field
        label="Subject"
        value={config.subject || ""}
        onChange={(value) =>
          onChange("subject", value)
        }
        placeholder="Email subject"
      />

      <TextareaField
        label="Message"
        value={config.message || ""}
        onChange={(value) =>
          onChange("message", value)
        }
        placeholder="Write your email..."
        rows={5}
      />
    </div>
  );
};

const HttpConfig = ({ config, onChange }) => {
  return (
    <div className="space-y-5">
      <SectionTitle
        label="Action configuration"
        title="HTTP Request"
      />

      <Field
        label="Method"
        type="select"
        value={config.method || "GET"}
        onChange={(value) =>
          onChange("method", value)
        }
        options={[
          {
            value: "GET",
            label: "GET",
          },
          {
            value: "POST",
            label: "POST",
          },
          {
            value: "PUT",
            label: "PUT",
          },
          {
            value: "PATCH",
            label: "PATCH",
          },
          {
            value: "DELETE",
            label: "DELETE",
          },
        ]}
      />

      <Field
        label="URL"
        value={config.url || ""}
        onChange={(value) =>
          onChange("url", value)
        }
        placeholder="https://example.com/api"
      />

      <TextareaField
        label="Request Body"
        value={config.body || ""}
        onChange={(value) =>
          onChange("body", value)
        }
        placeholder='{"message":"Hello"}'
        rows={6}
        mono
      />

      <div className="rounded-md border border-zinc-800/70 bg-zinc-900/50 px-3 py-2.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
          Tip
        </p>

        <p className="mt-1 text-[11px] leading-5 text-zinc-500">
          Use GET for APIs that only retrieve data.
          Use POST, PUT, or PATCH when sending data.
        </p>
      </div>
    </div>
  );
};

const MongoConfig = ({ config, onChange }) => {
  const { currentWorkspace } = useWorkspace();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["integrations", currentWorkspace?._id],
    queryFn: () => getIntegrations(currentWorkspace._id),
    enabled: !!currentWorkspace?._id,
  });

  const mongoIntegrations =
    data?.integrations?.filter(
      (integration) =>
        integration.provider === "mongodb" &&
        integration.status === "connected"
    ) || [];

  const connectionOptions = [
    {
      value: "",
      label: isLoading
        ? "Loading MongoDB connections..."
        : mongoIntegrations.length === 0
        ? "No MongoDB connections"
        : "Select MongoDB connection",
    },
    ...mongoIntegrations.map((integration) => ({
      value: integration._id,
      label: integration.name || "MongoDB Connection",
    })),
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        label="Action configuration"
        title="MongoDB"
      />

      <Field
        label="Connection"
        type="select"
        value={config.integrationId || ""}
        onChange={(value) =>
          onChange("integrationId", value)
        }
        options={connectionOptions}
      />

      {isError && (
        <p className="text-[11px] text-red-400">
          Failed to load MongoDB connections.
        </p>
      )}

      {!isLoading &&
        !isError &&
        mongoIntegrations.length === 0 && (
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-amber-500/70">
              No connection
            </p>

            <p className="mt-1 text-[11px] leading-5 text-zinc-500">
              Connect a MongoDB integration from the
              Integrations page before using this node.
            </p>
          </div>
        )}

      <Field
        label="Collection"
        value={config.collection || ""}
        onChange={(value) =>
          onChange("collection", value)
        }
        placeholder="users"
      />

      <Field
        label="Operation"
        type="select"
        value={config.operation || "find"}
        onChange={(value) =>
          onChange("operation", value)
        }
        options={[
          {
            value: "find",
            label: "Find",
          },
          {
            value: "insert",
            label: "Insert",
          },
          {
            value: "update",
            label: "Update",
          },
          {
            value: "delete",
            label: "Delete",
          },
        ]}
      />
    </div>
  );
};
const GenericConfig = ({ selectedNode }) => {
  return (
    <div className="space-y-4">
      <SectionTitle
        label="Node configuration"
        title={
          selectedNode.data?.label || "Node"
        }
      />

      <p className="text-xs leading-5 text-zinc-500">
        Configuration options for this node will
        appear here.
      </p>
    </div>
  );
};

const TestButton = () => {
  return (
    <div className="border-t border-zinc-800/70 pt-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">
        Test
      </p>

      <button
        type="button"
        className="mt-3 h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800"
      >
        Test Trigger
      </button>
    </div>
  );
};

const SectionTitle = ({ label, title }) => {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">
        {label}
      </p>

      <h3 className="mt-1 text-sm font-semibold text-zinc-100">
        {title}
      </h3>
    </div>
  );
};

const Field = ({
  label,
  type = "text",
  value = "",
  onChange,
  placeholder = "",
  options = [],
}) => {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-zinc-400">
        {label}
      </label>

      {type === "select" ? (
        <select
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-10 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 text-xs text-zinc-200 outline-none focus:border-violet-500"
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className="h-10 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-500"
        />
      )}
    </div>
  );
};

const TextareaField = ({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 5,
  mono = false,
}) => {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-zinc-400">
        {label}
      </label>

      <textarea
        rows={rows}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className={`w-full resize-none rounded-md border border-zinc-800 bg-[#111114] px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-500 ${
          mono ? "font-mono text-[11px]" : ""
        }`}
      />
    </div>
  );
};

export default ConfigPanel;