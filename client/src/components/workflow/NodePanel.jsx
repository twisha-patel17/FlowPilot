import {
  FiZap,
  FiLink,
  FiGitBranch,
  FiClock,
  FiFilter,
  FiShuffle,
  FiPause,
  FiMail,
  FiDatabase,
  FiGlobe,
} from "react-icons/fi";

const nodeGroups = [
  {
    title: "TRIGGERS",
    nodes: [
      {
        type: "manual",
        name: "Manual Trigger",
        description: "Run on demand",
        icon: FiZap,
      },
      {
        type: "webhook",
        name: "Webhook",
        description: "Incoming HTTP call",
        icon: FiLink,
      },
      {
        type: "github",
        name: "GitHub Event",
        description: "Repo activity",
        icon: FiGitBranch,
      },
      {
        type: "schedule",
        name: "Schedule",
        description: "Time-based",
        icon: FiClock,
      },
    ],
  },
  {
    title: "LOGIC",
    nodes: [
      {
        type: "filter",
        name: "Filter",
        description: "Stop unless true",
        icon: FiFilter,
      },
      {
        type: "condition",
        name: "Condition",
        description: "If / else branch",
        icon: FiGitBranch,
      },
      {
        type: "switch",
        name: "Switch",
        description: "Multi-way branch",
        icon: FiShuffle,
      },
      {
        type: "delay",
        name: "Delay",
        description: "Wait before next step",
        icon: FiPause,
      },
    ],
  },
  {
    title: "ACTIONS",
    nodes: [
      {
        type: "discord",
        name: "Discord",
        description: "Send a Discord message",
        icon: FiMail,
      },
      {
        type: "email",
        name: "Email",
        description: "Send an email",
        icon: FiMail,
      },
      {
        type: "http",
        name: "HTTP Request",
        description: "Make an API request",
        icon: FiGlobe,
      },
      {
        type: "mongodb",
        name: "MongoDB",
        description: "Read or write data",
        icon: FiDatabase,
      },
    ],
  },
];

const NodePanel = () => {
  const handleDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-zinc-800/70 bg-[#0d0d0f]">
      {/* Search */}
      <div className="border-b border-zinc-800/70 p-3">
        <div className="flex h-9 items-center rounded-md border border-zinc-800 bg-[#111114] px-3">
          <span className="mr-2 text-zinc-600">⌕</span>

          <input
            type="text"
            placeholder="Search nodes..."
            className="w-full bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {nodeGroups.map((group) => (
          <div key={group.title} className="mb-6">
            <p className="mb-3 px-1 text-[11px] font-medium tracking-wide text-zinc-600">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.nodes.map((node) => {
                const Icon = node.icon;

                return (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(event) =>
                      handleDragStart(event, node.type)
                    }
                    className="group flex cursor-grab items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-zinc-900 active:cursor-grabbing"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 transition group-hover:border-zinc-700 group-hover:text-violet-400">
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-200">
                        {node.name}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] text-zinc-600">
                        {node.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default NodePanel;