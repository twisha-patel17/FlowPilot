import { useCallback } from "react";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
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
    description: "Read or write data",
  },
};

/*
 * FLOWPILOT NODE
 */
const FlowPilotNode = ({ data, selected }) => {
  const nodeType = data?.type || "manual";

  const config =
    nodeConfig[nodeType] || nodeConfig.manual;

  const Icon = config.icon;

  const title =
    data?.label || config.title;

  const content =
    data?.config?.summary ||
    data?.config?.value ||
    config.description;

  const isCondition =
    nodeType === "condition";

  const isSwitch =
    nodeType === "switch";

  const switchCases =
    isSwitch &&
    typeof data?.config?.cases === "string"
      ? data.config.cases
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

  /*
   * SWITCH OUTPUTS
   *
   * Every configured case gets a stable
   * React Flow source handle:
   *
   * case-0
   * case-1
   * case-2
   *
   * Unmatched values use:
   *
   * default
   */
  const switchOutputs = isSwitch
    ? [
        ...switchCases.map(
          (caseValue, index) => ({
            id: `case-${index}`,
            label: caseValue,
            type: "case",
            index,
          })
        ),
        {
          id: "default",
          label: "DEFAULT",
          type: "default",
          index: switchCases.length,
        },
      ]
    : [];

  return (
    <div
      className={`relative w-[190px] cursor-grab overflow-visible rounded-lg border bg-[#111113] transition-all active:cursor-grabbing ${
        selected
          ? "border-violet-500 shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_8px_30px_rgba(0,0,0,0.35)]"
          : "border-zinc-800 shadow-[0_8px_25px_rgba(0,0,0,0.25)] hover:border-zinc-700"
      }`}
    >
      {/* TARGET HANDLE */}
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        isConnectable={true}
        className="nodrag nopan !z-50 !h-3 !w-3 !border-2 !border-[#111113] !bg-zinc-500"
        style={{
          cursor: "crosshair",
          pointerEvents: "auto",
        }}
      />

      {/* HEADER */}
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

      {/* BODY */}
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

      {/* FOOTER */}
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

      {/* CONDITION OUTPUTS */}
      {isCondition && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            isConnectable={true}
            className="nodrag nopan !z-50 !h-3 !w-3 !border-2 !border-[#111113] !bg-emerald-500"
            style={{
              left: "30%",
              cursor: "crosshair",
              pointerEvents: "auto",
            }}
          />

          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            isConnectable={true}
            className="nodrag nopan !z-50 !h-3 !w-3 !border-2 !border-[#111113] !bg-red-400"
            style={{
              left: "70%",
              cursor: "crosshair",
              pointerEvents: "auto",
            }}
          />

          <span className="pointer-events-none absolute -bottom-6 left-[30%] -translate-x-1/2 text-[9px] font-medium text-emerald-400">
            TRUE
          </span>

          <span className="pointer-events-none absolute -bottom-6 left-[70%] -translate-x-1/2 text-[9px] font-medium text-red-400">
            FALSE
          </span>
        </>
      )}

      {/* SWITCH OUTPUTS */}
      {isSwitch && (
        <>
          {switchOutputs.map(
            (output, index) => {
              const totalOutputs =
                switchOutputs.length;

              const leftPosition =
                ((index + 1) /
                  (totalOutputs + 1)) *
                100;

              const isDefault =
                output.type === "default";

              return (
                <div
                  key={output.id}
                  className="pointer-events-none absolute bottom-0"
                  style={{
                    left: `${leftPosition}%`,
                  }}
                >
                  <Handle
                    type="source"
                    position={Position.Bottom}
                    id={output.id}
                    isConnectable={true}
                    className={`nodrag nopan !z-50 !h-3 !w-3 !border-2 !border-[#111113] ${
                      isDefault
                        ? "!bg-zinc-500"
                        : "!bg-amber-500"
                    }`}
                    style={{
                      left: 0,
                      cursor: "crosshair",
                      pointerEvents: "auto",
                    }}
                  />

                  <span
                    className={`absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium ${
                      isDefault
                        ? "text-zinc-500"
                        : "text-amber-400"
                    }`}
                  >
                    {output.label}
                  </span>
                </div>
              );
            }
          )}
        </>
      )}

      {/* NORMAL SINGLE OUTPUT */}
      {!isCondition && !isSwitch && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="source"
          isConnectable={true}
          className={`nodrag nopan !z-50 !h-3 !w-3 !border-2 !border-[#111113] ${
            selected
              ? "!bg-violet-500"
              : "!bg-zinc-500"
          }`}
          style={{
            cursor: "crosshair",
            pointerEvents: "auto",
          }}
        />
      )}
    </div>
  );
};

const nodeTypes = {
  flowpilot: FlowPilotNode,
};

/*
 * WORKFLOW CANVAS
 */
const WorkflowCanvas = ({
  onNodeSelect,
  onWorkflowChange,
  initialNodes = [],
  initialEdges = [],
}) => {
  /*
   * NORMALIZE NODES
   */
  const normalizedNodes =
    initialNodes.map((node) => {
      const actualType =
        node.data?.type ||
        node.data?.nodeType ||
        "manual";

      return {
        ...node,
        type: "flowpilot",
        data: {
          ...node.data,
          type: actualType,
        },
      };
    });

  /*
   * NODE CHANGES
   */
  const handleNodesChange =
    useCallback(
      (changes) => {
        const updatedNodes =
          applyNodeChanges(
            changes,
            initialNodes
          );

        const removedNodeIds =
          new Set(
            changes
              .filter(
                (change) =>
                  change.type === "remove"
              )
              .map(
                (change) => change.id
              )
          );

        const updatedEdges =
          removedNodeIds.size > 0
            ? initialEdges.filter(
                (edge) =>
                  !removedNodeIds.has(
                    edge.source
                  ) &&
                  !removedNodeIds.has(
                    edge.target
                  )
              )
            : initialEdges;

        onWorkflowChange?.(
          updatedNodes,
          updatedEdges
        );
      },
      [
        initialNodes,
        initialEdges,
        onWorkflowChange,
      ]
    );

  /*
   * EDGE CHANGES
   */
  const handleEdgesChange =
    useCallback(
      (changes) => {
        const updatedEdges =
          applyEdgeChanges(
            changes,
            initialEdges
          );

        onWorkflowChange?.(
          initialNodes,
          updatedEdges
        );
      },
      [
        initialNodes,
        initialEdges,
        onWorkflowChange,
      ]
    );

  /*
   * CONNECT NODES
   */
  const onConnect =
    useCallback(
      (connection) => {
        if (
          !connection.source ||
          !connection.target
        ) {
          return;
        }

        /*
         * Prevent connecting a node to itself.
         */
        if (
          connection.source ===
          connection.target
        ) {
          return;
        }

        /*
         * For branching nodes, the source
         * handle is part of the workflow
         * definition.
         *
         * Example:
         * case-0
         * case-1
         * default
         */
        const sourceNode =
          initialNodes.find(
            (node) =>
              node.id ===
              connection.source
          );

        const sourceType =
          sourceNode?.data?.type ||
          sourceNode?.data?.nodeType ||
          sourceNode?.type;

        const isBranchingNode =
          sourceType === "condition" ||
          sourceType === "switch";

        if (
          isBranchingNode &&
          !connection.sourceHandle
        ) {
          return;
        }

        /*
         * Prevent duplicate edges from the
         * exact same source handle to the
         * exact same target.
         */
        const duplicateEdge =
          initialEdges.some(
            (edge) =>
              edge.source ===
                connection.source &&
              edge.target ===
                connection.target &&
              edge.sourceHandle ===
                connection.sourceHandle &&
              edge.targetHandle ===
                connection.targetHandle
          );

        if (duplicateEdge) {
          return;
        }

        const updatedEdges =
          addEdge(
            {
              ...connection,
              type: "smoothstep",
            },
            initialEdges
          );

        onWorkflowChange?.(
          initialNodes,
          updatedEdges
        );
      },
      [
        initialNodes,
        initialEdges,
        onWorkflowChange,
      ]
    );

  /*
   * NODE CLICK
   */
  const onNodeClick =
    useCallback(
      (event, node) => {
        event.stopPropagation();

        onNodeSelect?.(node);
      },
      [onNodeSelect]
    );

  /*
   * PANE CLICK
   */
  const onPaneClick =
    useCallback(() => {
      onNodeSelect?.(null);
    }, [onNodeSelect]);

  /*
   * DRAG OVER
   */
  const onDragOver =
    useCallback((event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect =
        "move";
    }, []);

  /*
   * DROP NODE
   */
  const onDrop =
    useCallback(
      (event) => {
        event.preventDefault();

        const nodeType =
          event.dataTransfer.getData(
            "application/reactflow"
          );

        if (!nodeType) {
          return;
        }

        const bounds =
          event.currentTarget.getBoundingClientRect();

        const position = {
          x:
            event.clientX -
            bounds.left,
          y:
            event.clientY -
            bounds.top,
        };

        const config =
          nodeConfig[nodeType] ||
          nodeConfig.manual;

        const newNode = {
          id: `${Date.now()}`,
          type: "flowpilot",
          position,
          data: {
            type: nodeType,
            label: config.title,
            config: {},
          },
        };

        const updatedNodes = [
          ...initialNodes,
          newNode,
        ];

        onWorkflowChange?.(
          updatedNodes,
          initialEdges
        );

        onNodeSelect?.(newNode);
      },
      [
        initialNodes,
        initialEdges,
        onWorkflowChange,
        onNodeSelect,
      ]
    );

  return (
    <div className="h-full w-full bg-[#09090b]">
      <ReactFlow
        nodes={normalizedNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
        colorMode="dark"
        connectionRadius={30}
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