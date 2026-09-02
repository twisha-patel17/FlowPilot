import { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  addEdge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";

import {
  FiGithub,
  FiClock,
  FiLink,
  FiZap,
  FiFilter,
  FiGitBranch,
  FiShuffle,
  FiMail,
  FiMessageCircle,
  FiGlobe,
  FiDatabase,
} from "react-icons/fi";

import "@xyflow/react/dist/style.css";

/* ---------------------------------- */
/* Node configuration */
/* ---------------------------------- */

const nodeConfig = {
  manual: {
    title: "Manual Trigger",
    category: "Trigger",
    icon: FiZap,
    iconStyle: "bg-violet-500/10 text-violet-400",
    description: "Run on demand",
  },

  webhook: {
    title: "Webhook",
    category: "Trigger",
    icon: FiLink,
    iconStyle: "bg-blue-500/10 text-blue-400",
    description: "Incoming HTTP call",
  },

  github: {
    title: "GitHub",
    category: "Trigger",
    icon: FiGithub,
    iconStyle: "bg-red-500/10 text-red-400",
    description: "Repository event",
  },

  schedule: {
    title: "Schedule",
    category: "Trigger",
    icon: FiClock,
    iconStyle: "bg-blue-500/10 text-blue-400",
    description: "Time-based",
  },

  filter: {
    title: "Filter",
    category: "Logic",
    icon: FiFilter,
    iconStyle: "bg-amber-500/10 text-amber-400",
    description: "Stop unless true",
  },

  condition: {
    title: "Condition",
    category: "Logic",
    icon: FiGitBranch,
    iconStyle: "bg-amber-500/10 text-amber-400",
    description: "If / else branch",
  },

  switch: {
    title: "Switch",
    category: "Logic",
    icon: FiShuffle,
    iconStyle: "bg-amber-500/10 text-amber-400",
    description: "Multi-way branch",
  },

  delay: {
    title: "Delay",
    category: "Logic",
    icon: FiClock,
    iconStyle: "bg-amber-500/10 text-amber-400",
    description: "Wait before next step",
  },

  discord: {
    title: "Discord",
    category: "Action",
    icon: FiMessageCircle,
    iconStyle: "bg-emerald-500/10 text-emerald-400",
    description: "Send Discord message",
  },

  email: {
    title: "Email",
    category: "Action",
    icon: FiMail,
    iconStyle: "bg-emerald-500/10 text-emerald-400",
    description: "Send an email",
  },

  http: {
    title: "HTTP Request",
    category: "Action",
    icon: FiGlobe,
    iconStyle: "bg-emerald-500/10 text-emerald-400",
    description: "Make HTTP request",
  },

  mongodb: {
    title: "MongoDB",
    category: "Action",
    icon: FiDatabase,
    iconStyle: "bg-emerald-500/10 text-emerald-400",
    description: "Database operation",
  },
};

/* ---------------------------------- */
/* Custom node */
/* ---------------------------------- */

const FlowPilotNode = ({ data, selected }) => {
  const nodeType = data?.nodeType || "manual";

  const config =
    nodeConfig[nodeType] || nodeConfig.manual;

  const Icon = config.icon;

  const title =
    data?.label || config.title;

  /*
   * Prefer configured node content.
   * This will later come from ConfigPanel.
   */
  const content =
    data?.config?.summary ||
    data?.config?.value ||
    config.description;

  return (
    <div
      className={`relative w-[190px] overflow-hidden rounded-lg border bg-[#111113] transition-all ${
        selected
          ? "border-violet-500 shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_8px_30px_rgba(0,0,0,0.35)]"
          : "border-zinc-800 shadow-[0_8px_25px_rgba(0,0,0,0.25)] hover:border-zinc-700"
      }`}
    >
      {/* Target handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-[7px] !w-[7px] !border-2 !border-[#111113] !bg-zinc-600"
      />

      {/* Top section */}
      <div className="flex items-center gap-2.5 border-b border-zinc-800/70 px-3 py-2.5">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${config.iconStyle}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-zinc-100">
            {title}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-3">
        <p
          className={`break-words text-[11px] leading-5 ${
            data?.config?.value
              ? "font-mono font-medium text-zinc-200"
              : "text-zinc-500"
          }`}
        >
          {content}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-zinc-800/60 px-3 py-2">
        <span className="text-[10px] uppercase tracking-wide text-zinc-600">
          {config.category}
        </span>

        {data?.config?.status === "success" && (
          <span className="text-[10px] text-emerald-400">
            ✓ Success
          </span>
        )}
      </div>

      {/* Source handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`!h-[7px] !w-[7px] !border-2 !border-[#111113] ${
          selected
            ? "!bg-violet-500"
            : "!bg-zinc-600"
        }`}
      />
    </div>
  );
};

const nodeTypes = {
  flowpilot: FlowPilotNode,
};

/* ---------------------------------- */
/* Canvas */
/* ---------------------------------- */

const WorkflowCanvas = ({
  onNodeSelect,
  onWorkflowChange,
  initialNodes = [],
  initialEdges = [],
}) => {
  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes);

  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges);

  /* Load saved nodes */
  useEffect(() => {
    setNodes(
      (initialNodes || []).map((node) => ({
        ...node,
        type: "flowpilot",
      }))
    );
  }, [initialNodes, setNodes]);

  /* Load saved edges */
  useEffect(() => {
    setEdges(initialEdges || []);
  }, [initialEdges, setEdges]);

  /* Send workflow state to parent */
  useEffect(() => {
    if (onWorkflowChange) {
      onWorkflowChange(nodes, edges);
    }
  }, [nodes, edges, onWorkflowChange]);

  /* Connect nodes */
  const onConnect = useCallback(
    (connection) => {
      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
          },
          currentEdges
        )
      );
    },
    [setEdges]
  );

  /* Select node */
  const onNodeClick = useCallback(
    (_event, node) => {
      if (onNodeSelect) {
        onNodeSelect(node);
      }
    },
    [onNodeSelect]
  );

  /* Deselect node */
  const onPaneClick = useCallback(() => {
    if (onNodeSelect) {
      onNodeSelect(null);
    }
  }, [onNodeSelect]);

  /* Allow drop */
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  /* Drop node */
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const nodeType =
        event.dataTransfer.getData(
          "application/reactflow"
        );

      if (!nodeType) return;

      const bounds =
        event.currentTarget.getBoundingClientRect();

      const position = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };

      const config =
        nodeConfig[nodeType] || nodeConfig.manual;

      const newNode = {
        id: `${Date.now()}`,
        type: "flowpilot",
        position,
        data: {
          label: config.title,
          nodeType,
          config: {},
        },
      };

      setNodes((currentNodes) => [
        ...currentNodes,
        newNode,
      ]);
    },
    [setNodes]
  );

  return (
    <div className="h-full w-full bg-[#09090b]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        colorMode="dark"
        defaultEdgeOptions={{
          type: "smoothstep",
          style: {
            stroke: "#3f3f46",
            strokeWidth: 1.5,
          },
        }}
        proOptions={{
          hideAttribution: true,
        }}
      >
        <Background
          gap={20}
          size={1}
          color="#1f1f23"
        />

        <Controls
          showInteractive={false}
          className="!overflow-hidden !rounded-md !border !border-zinc-800 !bg-[#111113]"
        />

        <MiniMap
          nodeColor={(node) => {
            if (node.selected) {
              return "#8b5cf6";
            }

            return "#27272a";
          }}
          maskColor="rgba(9, 9, 11, 0.78)"
          className="!border !border-zinc-800 !bg-[#111113]"
        />
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas;