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
    selectedNode.data?.nodeType || selectedNode.type;

  const Icon = nodeIcons[nodeType] || FiZap;

  const config = selectedNode.data?.config || {};

  const updateConfig = (key, value) => {
    if (!onNodeUpdate) return;

    const updatedNode = {
      ...selectedNode,

      data: {
        ...selectedNode.data,

        config: {
          ...config,
          [key]: value,
        },
      },
    };

    onNodeUpdate(updatedNode);
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
        {nodeType === "github" && (
          <GithubConfig
            config={config}
            onChange={updateConfig}
          />
        )}

        {nodeType === "webhook" && (
          <WebhookConfig
            config={config}
            onChange={updateConfig}
          />
        )}

        {nodeType === "schedule" && (
          <ScheduleConfig
            config={config}
            onChange={updateConfig}
          />
        )}

        {nodeType === "manual" && <ManualConfig />}

        {nodeType === "filter" && (
          <FilterConfig
            config={config}
            onChange={updateConfig}
          />
        )}

        {nodeType === "condition" && (
          <ConditionConfig
            config={config}
            onChange={updateConfig}
          />
        )}

        {nodeType === "switch" && (
          <SwitchConfig
            config={config}
            onChange={updateConfig}
          />
        )}

        {nodeType === "delay" && (
          <DelayConfig
            config={config}
            onChange={updateConfig}
          />
        )}

        {nodeType === "discord" && (
          <DiscordConfig
            config={config}
            onChange={updateConfig}
          />
        )}

        {nodeType === "email" && (
          <EmailConfig
            config={config}
            onChange={updateConfig}
          />
        )}

        {nodeType === "http" && (
          <HttpConfig
            config={config}
            onChange={updateConfig}
          />
        )}

        {nodeType === "mongodb" && (
          <MongoConfig
            config={config}
            onChange={updateConfig}
          />
        )}

        {![
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
        ].includes(nodeType) && (
          <GenericConfig selectedNode={selectedNode} />
        )}
      </div>
    </aside>
  );
};

const GithubConfig = ({ config, onChange }) => {
  return (
    <div className="space-y-5">
      <SectionTitle
        label="Trigger configuration"
        title="GitHub Issue Created"
      />

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
          { value: "issues", label: "Issues" },
          {
            value: "pull_request",
            label: "Pull Request",
          },
          { value: "push", label: "Push" },
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
          { value: "opened", label: "Opened" },
          { value: "closed", label: "Closed" },
          { value: "edited", label: "Edited" },
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
          { value: "POST", label: "POST" },
          { value: "GET", label: "GET" },
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
          { value: "daily", label: "Every day" },
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
        value={config.timezone || "Asia/Kolkata"}
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
          { value: "equals", label: "Equals" },
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
  return (
    <div className="space-y-5">
      <SectionTitle
        label="Action configuration"
        title="Discord"
      />

      <Field
        label="Connection"
        type="select"
        value={
          config.connection ||
          "DevSpace Workspace"
        }
        onChange={(value) =>
          onChange("connection", value)
        }
        options={[
          {
            value: "DevSpace Workspace",
            label: "DevSpace Workspace",
          },
          {
            value: "Connect new account",
            label: "Connect new account",
          },
        ]}
      />

      <Field
        label="Channel"
        type="select"
        value={
          config.channel || "#development"
        }
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
    </div>
  );
};

const EmailConfig = ({ config, onChange }) => {
  return (
    <div className="space-y-5">
      <SectionTitle
        label="Action configuration"
        title="Email"
      />

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
        value={config.method || "POST"}
        onChange={(value) =>
          onChange("method", value)
        }
        options={[
          { value: "GET", label: "GET" },
          { value: "POST", label: "POST" },
          { value: "PUT", label: "PUT" },
          { value: "PATCH", label: "PATCH" },
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
    </div>
  );
};

const MongoConfig = ({ config, onChange }) => {
  return (
    <div className="space-y-5">
      <SectionTitle
        label="Action configuration"
        title="MongoDB"
      />

      <Field
        label="Connection"
        type="select"
        value={
          config.connection ||
          "Default MongoDB"
        }
        onChange={(value) =>
          onChange("connection", value)
        }
        options={[
          {
            value: "Default MongoDB",
            label: "Default MongoDB",
          },
          {
            value: "Connect new database",
            label: "Connect new database",
          },
        ]}
      />

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