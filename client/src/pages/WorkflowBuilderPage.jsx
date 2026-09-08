import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  FiArrowLeft,
  FiSave,
  FiPlay,
} from "react-icons/fi";

import {
  createWorkflow,
  getWorkflow,
  updateWorkflow,
  toggleWorkflow,
} from "../api/workflowApi";

import { createExecution } from "../api/executionApi";

import { useWorkspace } from "../context/WorkspaceContext";

import NodePanel from "../components/workflow/NodePanel";
import WorkflowCanvas from "../components/workflow/WorkflowCanvas";
import ConfigPanel from "../components/workflow/ConfigPanel";

const WorkflowBuilderPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const {
    currentWorkspace,
    loading: workspaceLoading,
  } = useWorkspace();

  const workspaceId = currentWorkspace?._id;

  const [selectedNode, setSelectedNode] = useState(null);

  const [workflowName, setWorkflowName] =
    useState("Untitled Workflow");

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  /*
   * LOAD WORKFLOW
   */

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["workflow", id, workspaceId],
    queryFn: () =>
      getWorkflow({
        id,
        workspaceId,
      }),
    enabled: !!id && !!workspaceId,
  });

  useEffect(() => {
    if (!data?.workflow) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWorkflowName(
      data.workflow.name || "Untitled Workflow"
    );

    setNodes(data.workflow.nodes || []);
    setEdges(data.workflow.edges || []);
  }, [data]);

  /*
   * WORKFLOW CANVAS CHANGE
   */

  const handleWorkflowChange = useCallback(
    (updatedNodes, updatedEdges) => {
      setNodes(updatedNodes);
      setEdges(updatedEdges);
    },
    []
  );

  /*
   * NODE UPDATE
   */

  const handleNodeUpdate = useCallback(
    (updatedNode) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === updatedNode.id
            ? updatedNode
            : node
        )
      );

      setSelectedNode(updatedNode);
    },
    []
  );

  /*
   * CREATE WORKFLOW
   */

  const createMutation = useMutation({
    mutationFn: createWorkflow,

    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["workflows", workspaceId],
      });

      const createdWorkflow =
        response.workflow;

      navigate(
        `/app/workflows/${createdWorkflow._id}`,
        {
          replace: true,
        }
      );
    },

    onError: (error) => {
      console.error(
        "Create workflow error:",
        error
      );
    },
  });

  /*
   * UPDATE WORKFLOW
   */

  const updateMutation = useMutation({
    mutationFn: updateWorkflow,

    onSuccess: (response) => {
      queryClient.setQueryData(
        ["workflow", id, workspaceId],
        response
      );

      queryClient.invalidateQueries({
        queryKey: ["workflows", workspaceId],
      });
    },

    onError: (error) => {
      console.error(
        "Update workflow error:",
        error
      );
    },
  });

  /*
   * TOGGLE WORKFLOW
   */

  const toggleMutation = useMutation({
    mutationFn: toggleWorkflow,

    onSuccess: (response) => {
      queryClient.setQueryData(
        ["workflow", id, workspaceId],
        response
      );

      queryClient.invalidateQueries({
        queryKey: ["workflows", workspaceId],
      });
    },

    onError: (error) => {
      console.error(
        "Toggle workflow error:",
        error
      );
    },
  });

  /*
   * RUN WORKFLOW
   */

  const executeMutation = useMutation({
    mutationFn: createExecution,

    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["executions", workspaceId],
      });

      const execution =
        response?.execution;

      if (execution?._id) {
        navigate(
          `/app/executions/${execution._id}`
        );

        return;
      }

      alert(
        "Workflow executed successfully"
      );
    },

    onError: (error) => {
      console.error(
        "Workflow execution error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Workflow execution failed"
      );
    },
  });

  /*
   * SAVE WORKFLOW
   */

  const handleSave = () => {
    if (!workspaceId) {
      alert(
        "Please select a workspace first."
      );

      return;
    }

    /*
     * Normalize nodes before saving.
     */

    const normalizedNodes = nodes.map(
      (node) => {
        const nodeType =
          node.data?.type ||
          node.data?.nodeType ||
          node.type ||
          "manual";

        return {
          ...node,

          type: "flowpilot",

          data: {
            ...node.data,
            type: nodeType,
          },
        };
      }
    );

    /*
     * Trigger node priority.
     *
     * We intentionally check real trigger nodes
     * BEFORE manual.
     *
     * This prevents a Manual node appearing before
     * a Schedule node from overriding the Schedule
     * trigger.
     */

    const triggerPriority = [
      "schedule",
      "webhook",
      "github",
      "http",
      "manual",
    ];

    let triggerNode = null;

    for (const triggerType of triggerPriority) {
      triggerNode = normalizedNodes.find(
        (node) =>
          node.data?.type === triggerType
      );

      if (triggerNode) {
        break;
      }
    }

    /*
     * Get trigger type.
     */

    const triggerType =
      triggerNode?.data?.type ||
      "manual";

    /*
     * Get trigger configuration.
     */

    const triggerConfig =
      triggerNode?.data?.config || {};

    /*
     * Build workflow payload.
     */

    const workflowData = {
      name:
        workflowName.trim() ||
        "Untitled Workflow",

      description: "",

      trigger: {
        type: triggerType,
        config: triggerConfig,
      },

      nodes: normalizedNodes,

      edges,
    };

    console.log(
      "Saving workflow:",
      workflowData
    );

    if (id) {
      updateMutation.mutate({
        id,
        workflowData,
        workspaceId,
      });
    } else {
      createMutation.mutate({
        workflowData,
        workspaceId,
      });
    }
  };

  /*
   * ACTIVATE WORKFLOW
   */

  const handleActivate = () => {
    if (!id || !workspaceId) return;

    toggleMutation.mutate({
      id,
      workspaceId,
    });
  };

  /*
   * RUN WORKFLOW
   */

  const handleRunWorkflow = () => {
    if (!id) {
      alert(
        "Save the workflow before running it."
      );

      return;
    }

    if (!workspaceId) {
      alert(
        "Please select a workspace first."
      );

      return;
    }

    if (nodes.length === 0) {
      alert(
        "Add at least one node before running the workflow."
      );

      return;
    }

    executeMutation.mutate({
      workflowId: id,
      workspaceId,
    });
  };

  /*
   * LOADING
   */

  if (workspaceLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <p className="text-sm text-zinc-500">
          Loading workspace...
        </p>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#09090b]">
        <p className="text-sm text-zinc-500">
          No workspace selected.
        </p>

        <button
          type="button"
          onClick={() =>
            navigate("/app/workflows")
          }
          className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-300 transition hover:bg-zinc-800"
        >
          Back to Workflows
        </button>
      </div>
    );
  }

  if (id && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <p className="text-sm text-zinc-500">
          Loading workflow...
        </p>
      </div>
    );
  }

  if (id && isError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#09090b]">
        <p className="text-sm text-red-400">
          Failed to load workflow.
        </p>

        <button
          type="button"
          onClick={() =>
            navigate("/app/workflows")
          }
          className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-300 transition hover:bg-zinc-800"
        >
          Back to Workflows
        </button>
      </div>
    );
  }

  /*
   * PAGE
   */

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#09090b]">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/70 bg-[#0d0d0f] px-3 sm:px-5">

        <div className="flex min-w-0 items-center gap-3">

          <button
            type="button"
            onClick={() =>
              navigate("/app/workflows")
            }
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
            aria-label="Back to workflows"
          >
            <FiArrowLeft className="h-4 w-4" />
          </button>

          <div className="hidden items-center gap-2 text-xs text-zinc-600 sm:flex">
            <span>Workflows</span>
            <span>/</span>
          </div>

          <input
            type="text"
            value={workflowName}
            onChange={(event) =>
              setWorkflowName(
                event.target.value
              )
            }
            className="min-w-0 max-w-[220px] truncate bg-transparent text-sm font-semibold text-zinc-100 outline-none"
          />

        </div>

        <div className="flex shrink-0 items-center gap-2">

          {/* SAVE */}

          <button
            type="button"
            onClick={handleSave}
            disabled={
              createMutation.isPending ||
              updateMutation.isPending
            }
            className="flex h-8 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiSave className="h-3.5 w-3.5" />

            <span className="hidden sm:inline">
              {createMutation.isPending ||
              updateMutation.isPending
                ? "Saving..."
                : "Save"}
            </span>
          </button>

          {/* RUN */}

          <button
            type="button"
            onClick={handleRunWorkflow}
            disabled={
              !id ||
              executeMutation.isPending
            }
            className="flex h-8 items-center gap-2 rounded-md bg-emerald-600 px-3 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiPlay className="h-3.5 w-3.5" />

            <span className="hidden sm:inline">
              {executeMutation.isPending
                ? "Running..."
                : "Run"}
            </span>
          </button>

          {/* ACTIVATE */}

          <button
            type="button"
            onClick={handleActivate}
            disabled={
              !id ||
              toggleMutation.isPending
            }
            className="flex h-8 items-center gap-2 rounded-md bg-violet-600 px-3 text-xs font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiPlay className="h-3.5 w-3.5" />

            <span className="hidden sm:inline">
              {toggleMutation.isPending
                ? "Updating..."
                : "Activate"}
            </span>
          </button>

        </div>
      </header>

      <div className="flex min-h-0 flex-1">

        <div className="hidden w-60 shrink-0 md:block">
          <NodePanel />
        </div>

        <main className="min-w-0 flex-1">
          <WorkflowCanvas
            onNodeSelect={setSelectedNode}
            onWorkflowChange={
              handleWorkflowChange
            }
            initialNodes={nodes}
            initialEdges={edges}
          />
        </main>

        <div className="hidden w-72 shrink-0 lg:block">
          <ConfigPanel
            selectedNode={selectedNode}
            onClose={() =>
              setSelectedNode(null)
            }
            onNodeUpdate={handleNodeUpdate}
          />
        </div>

      </div>
    </div>
  );
};

export default WorkflowBuilderPage;