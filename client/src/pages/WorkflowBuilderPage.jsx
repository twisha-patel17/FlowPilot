import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import toast from "react-hot-toast";

import {
  FiArrowLeft,
  FiSave,
  FiPlay,
  FiUploadCloud,
} from "react-icons/fi";

import {
  createWorkflow,
  getWorkflow,
  updateWorkflow,
  toggleWorkflow,
  publishWorkflow,
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

  const [workflowName, setWorkflowName] = useState(
    "Untitled Workflow"
  );

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "workflow",
      id,
      workspaceId,
    ],

    queryFn: () =>
      getWorkflow({
        id,
        workspaceId,
      }),

    enabled:
      !!id &&
      !!workspaceId,
  });

  const workflow = data?.workflow || null;

  const isActive =
    workflow?.status === "active";

  const hasPublishedVersion =
    workflow?.publishedVersion !== null &&
    workflow?.publishedVersion !== undefined;

  const isPublished =
    hasPublishedVersion &&
    workflow?.publishedVersion ===
      workflow?.currentVersion;

  const hasUnpublishedChanges =
    hasPublishedVersion &&
    workflow?.publishedVersion !==
      workflow?.currentVersion;

  useEffect(() => {
    if (!workflow) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWorkflowName(
      workflow.name ||
        "Untitled Workflow"
    );

    setNodes(
      workflow.nodes || []
    );

    setEdges(
      workflow.edges || []
    );
  }, [workflow]);

  const handleWorkflowChange =
    useCallback(
      (
        updatedNodes,
        updatedEdges
      ) => {
        setNodes(updatedNodes);
        setEdges(updatedEdges);
      },
      []
    );

  const handleNodeUpdate =
    useCallback(
      (updatedNode) => {
        setNodes(
          (currentNodes) =>
            currentNodes.map(
              (node) =>
                node.id ===
                updatedNode.id
                  ? updatedNode
                  : node
            )
        );

        setSelectedNode(
          updatedNode
        );
      },
      []
    );

  const createMutation =
    useMutation({
      mutationFn:
        createWorkflow,

      onSuccess:
        (response) => {
          queryClient.invalidateQueries({
            queryKey: [
              "workflows",
              workspaceId,
            ],
          });

          const createdWorkflow =
            response?.workflow;

          if (!createdWorkflow?._id) {
            toast.error(
              "Workflow was created, but its ID could not be found."
            );

            return;
          }

          toast.success(
            "Workflow created successfully"
          );

          navigate(
            `/app/workflows/${createdWorkflow._id}`,
            {
              replace: true,
            }
          );
        },

      onError:
        (error) => {
          console.error(
            "Create workflow error:",
            error
          );

          toast.error(
            error.response?.data
              ?.message ||
              "Failed to create workflow"
          );
        },
    });

  const updateMutation =
    useMutation({
      mutationFn:
        updateWorkflow,

      onSuccess:
        (response) => {
          queryClient.setQueryData(
            [
              "workflow",
              id,
              workspaceId,
            ],
            response
          );

          queryClient.invalidateQueries({
            queryKey: [
              "workflows",
              workspaceId,
            ],
          });

          toast.success(
            "Workflow saved successfully"
          );
        },

      onError:
        (error) => {
          console.error(
            "Update workflow error:",
            error
          );

          toast.error(
            error.response?.data
              ?.message ||
              "Failed to update workflow"
          );
        },
    });

  const publishMutation =
    useMutation({
      mutationFn:
        publishWorkflow,

      onSuccess:
        (response) => {
          queryClient.setQueryData(
            [
              "workflow",
              id,
              workspaceId,
            ],
            response
          );

          queryClient.invalidateQueries({
            queryKey: [
              "workflows",
              workspaceId,
            ],
          });

          toast.success(
            "Workflow published successfully"
          );
        },

      onError:
        (error) => {
          console.error(
            "Publish workflow error:",
            error
          );

          toast.error(
            error.response?.data
              ?.message ||
              "Failed to publish workflow"
          );
        },
    });

  const toggleMutation =
    useMutation({
      mutationFn:
        toggleWorkflow,

      onSuccess:
        (response) => {
          queryClient.setQueryData(
            [
              "workflow",
              id,
              workspaceId,
            ],
            response
          );

          queryClient.invalidateQueries({
            queryKey: [
              "workflows",
              workspaceId,
            ],
          });

          const newStatus =
            response?.workflow?.status;

          if (newStatus === "active") {
            toast.success(
              "Workflow activated"
            );
          } else {
            toast.success(
              "Workflow deactivated"
            );
          }
        },

      onError:
        (error) => {
          console.error(
            "Toggle workflow error:",
            error
          );

          toast.error(
            error.response?.data
              ?.message ||
              "Failed to update workflow status"
          );
        },
    });

  const executeMutation =
    useMutation({
      mutationFn:
        createExecution,

      onSuccess:
        (response) => {
          queryClient.invalidateQueries({
            queryKey: [
              "executions",
              workspaceId,
            ],
          });

          const execution =
            response?.execution;

          if (execution?._id) {
            toast.success(
              "Workflow execution started"
            );

            navigate(
              `/app/executions/${execution._id}`
            );

            return;
          }

          toast.success(
            "Workflow executed successfully"
          );
        },

      onError:
        (error) => {
          console.error(
            "Workflow execution error:",
            error
          );

          toast.error(
            error.response?.data
              ?.message ||
              "Workflow execution failed"
          );
        },
    });

  const buildWorkflowData =
    () => {
      const normalizedNodes =
        nodes.map(
          (node) => {
            const nodeType =
              node.data?.type ||
              node.data?.nodeType ||
              node.type ||
              "manual";

            const normalizedConfig =
              nodeType === "condition"
                ? {
                    ...node.data?.config,
                    operator:
                      node.data?.config
                        ?.operator ||
                      "equals",
                  }
                : node.data?.config;

            return {
              ...node,

              type: "flowpilot",

              data: {
                ...node.data,
                type: nodeType,
                config:
                  normalizedConfig,
              },
            };
          }
        );

      const triggerPriority = [
        "schedule",
        "webhook",
        "github",
        "http",
        "manual",
      ];

      let triggerNode = null;

      for (
        const triggerType of
          triggerPriority
      ) {
        triggerNode =
          normalizedNodes.find(
            (node) =>
              node.data?.type ===
              triggerType
          );

        if (triggerNode) {
          break;
        }
      }

      const triggerType =
        triggerNode?.data?.type ||
        "manual";

      const triggerConfig =
        triggerNode?.data?.config ||
        {};

      return {
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
    };

  const handleSave = () => {
    if (!workspaceId) {
      toast.error(
        "Please select a workspace first."
      );

      return;
    }

    const workflowData =
      buildWorkflowData();

    if (id) {
      updateMutation.mutate({
        id,
        workflowData,
        workspaceId,
      });

      return;
    }

    createMutation.mutate({
      workflowData,
      workspaceId,
    });
  };

  const handlePublish = () => {
    if (!id) {
      toast.error(
        "Save the workflow before publishing it."
      );

      return;
    }

    if (!workspaceId) {
      toast.error(
        "Please select a workspace first."
      );

      return;
    }

    if (nodes.length === 0) {
      toast.error(
        "Add at least one node before publishing the workflow."
      );

      return;
    }

    publishMutation.mutate({
      id,
      workspaceId,
    });
  };

  const handleToggle = () => {
    if (!id || !workspaceId) {
      return;
    }

    if (
      !isActive &&
      !hasPublishedVersion
    ) {
      toast.error(
        "Publish the workflow before activating it."
      );

      return;
    }

    toggleMutation.mutate({
      id,
      workspaceId,
    });
  };

  const handleRunWorkflow = () => {
    if (!id) {
      toast.error(
        "Save the workflow before running it."
      );

      return;
    }

    if (!workspaceId) {
      toast.error(
        "Please select a workspace first."
      );

      return;
    }

    if (nodes.length === 0) {
      toast.error(
        "Add at least one node before running the workflow."
      );

      return;
    }

    if (!isActive) {
      toast.error(
        "Publish and activate the workflow before running it."
      );

      return;
    }

    executeMutation.mutate({
      workflowId: id,
      workspaceId,
    });
  };

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
            navigate(
              "/app/workflows"
            )
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
            navigate(
              "/app/workflows"
            )
          }
          className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-300 transition hover:bg-zinc-800"
        >
          Back to Workflows
        </button>
      </div>
    );
  }

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending;

  const isPublishing =
    publishMutation.isPending;

  const isToggling =
    toggleMutation.isPending;

  const isRunning =
    executeMutation.isPending;

  const canPublish =
    !!id &&
    !isSaving &&
    !isPublishing &&
    !isToggling &&
    !isRunning &&
    !isPublished;

  const canToggle =
    !!id &&
    !isSaving &&
    !isPublishing &&
    !isToggling &&
    !isRunning &&
    (
      isActive ||
      hasPublishedVersion
    );

  const canRun =
    !!id &&
    isActive &&
    !isSaving &&
    !isPublishing &&
    !isToggling &&
    !isRunning;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#09090b]">

      {/* HEADER */}

      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/70 bg-[#0d0d0f] px-3 sm:px-5">

        {/* LEFT */}

        <div className="flex min-w-0 items-center gap-3">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/app/workflows"
              )
            }
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
            aria-label="Back to workflows"
          >
            <FiArrowLeft className="h-4 w-4" />
          </button>

          <div className="hidden items-center gap-2 text-xs text-zinc-600 sm:flex">
            <span>
              Workflows
            </span>

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

          {/* STATUS */}

          {id && (
            <div className="hidden items-center gap-1.5 md:flex">

              <span className="text-zinc-700">
                •
              </span>

              {isActive ? (
                <span className="text-[11px] font-medium text-emerald-400">
                  Active
                </span>
              ) : hasPublishedVersion ? (
                <span className="text-[11px] font-medium text-violet-400">
                  Published
                </span>
              ) : (
                <span className="text-[11px] font-medium text-zinc-500">
                  Draft
                </span>
              )}

            </div>
          )}

        </div>

        {/* RIGHT */}

        <div className="flex shrink-0 items-center gap-2">

          {/* SAVE */}

          <button
            type="button"
            onClick={handleSave}
            disabled={
              isSaving ||
              isPublishing ||
              isToggling ||
              isRunning
            }
            className="flex h-8 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiSave className="h-3.5 w-3.5" />

            <span className="hidden sm:inline">
              {isSaving
                ? "Saving..."
                : "Save"}
            </span>
          </button>

          {/* PUBLISH */}

          <button
            type="button"
            onClick={handlePublish}
            disabled={!canPublish}
            className={`flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isPublished
                ? "bg-zinc-800 text-zinc-500"
                : "bg-violet-600 hover:bg-violet-500"
            }`}
          >
            <FiUploadCloud className="h-3.5 w-3.5" />

            <span className="hidden sm:inline">
              {isPublishing
                ? "Publishing..."
                : isPublished
                ? "Published"
                : hasUnpublishedChanges
                ? "Publish changes"
                : "Publish"}
            </span>
          </button>

          <button
            type="button"
            onClick={
              handleRunWorkflow
            }
            disabled={!canRun}
            className="flex h-8 items-center gap-2 rounded-md bg-emerald-600 px-3 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiPlay className="h-3.5 w-3.5" />

            <span className="hidden sm:inline">
              {isRunning
                ? "Running..."
                : "Run"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleToggle}
            disabled={!canToggle}
            className={`flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isActive
                ? "bg-amber-600 hover:bg-amber-500"
                : "bg-violet-600 hover:bg-violet-500"
            }`}
          >
            <FiPlay className="h-3.5 w-3.5" />

            <span className="hidden sm:inline">
              {isToggling
                ? "Updating..."
                : isActive
                ? "Deactivate"
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
            onNodeSelect={
              setSelectedNode
            }
            onWorkflowChange={
              handleWorkflowChange
            }
            initialNodes={nodes}
            initialEdges={edges}
          />
        </main>

        <div className="hidden w-72 shrink-0 lg:block">
          <ConfigPanel
            selectedNode={
              selectedNode
            }
            onClose={() =>
              setSelectedNode(null)
            }
            onNodeUpdate={
              handleNodeUpdate
            }
          />
        </div>

      </div>
    </div>
  );
};

export default WorkflowBuilderPage;

