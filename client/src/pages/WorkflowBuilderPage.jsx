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

import NodePanel from "../components/workflow/NodePanel";
import WorkflowCanvas from "../components/workflow/WorkflowCanvas";
import ConfigPanel from "../components/workflow/ConfigPanel";

const WorkflowBuilderPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowName, setWorkflowName] =
    useState("Untitled Workflow");

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // =========================
  // GET WORKFLOW
  // =========================

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["workflow", id],
    queryFn: () => getWorkflow(id),
    enabled: !!id,
  });

  // =========================
  // LOAD EXISTING WORKFLOW
  // =========================

  useEffect(() => {
    if (!data?.workflow) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWorkflowName(data.workflow.name);

    setNodes(data.workflow.nodes || []);
    setEdges(data.workflow.edges || []);
  }, [data]);

  // =========================
  // WORKFLOW CANVAS CHANGE
  // =========================

  const handleWorkflowChange = useCallback(
    (updatedNodes, updatedEdges) => {
      setNodes(updatedNodes);
      setEdges(updatedEdges);
    },
    []
  );

  // =========================
  // NODE CONFIG UPDATE
  // =========================

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

  // =========================
  // CREATE
  // =========================

  const createMutation = useMutation({
    mutationFn: createWorkflow,

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["workflows"],
      });

      const createdWorkflow = data.workflow;

      navigate(
        `/app/workflows/${createdWorkflow._id}`,
        {
          replace: true,
        }
      );
    },
  });

  // =========================
  // UPDATE
  // =========================

  const updateMutation = useMutation({
    mutationFn: updateWorkflow,

    onSuccess: (data) => {
      queryClient.setQueryData(
        ["workflow", id],
        data
      );

      queryClient.invalidateQueries({
        queryKey: ["workflows"],
      });
    },
  });

  // =========================
  // TOGGLE
  // =========================

  const toggleMutation = useMutation({
    mutationFn: toggleWorkflow,

    onSuccess: (data) => {
      queryClient.setQueryData(
        ["workflow", id],
        data
      );

      queryClient.invalidateQueries({
        queryKey: ["workflows"],
      });
    },
  });

  // =========================
  // SAVE
  // =========================

  const handleSave = () => {
    const workflowData = {
      name: workflowName,
      description: "",
      trigger: {
        type: "manual",
        config: {},
      },
      nodes,
      edges,
    };

    if (id) {
      updateMutation.mutate({
        id,
        workflowData,
      });
    } else {
      createMutation.mutate(workflowData);
    }
  };

  // =========================
  // ACTIVATE
  // =========================

  const handleActivate = () => {
    if (!id) return;

    toggleMutation.mutate(id);
  };

  // =========================
  // LOADING
  // =========================

  if (id && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <p className="text-sm text-zinc-500">
          Loading workflow...
        </p>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

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
          className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          Back to Workflows
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#09090b]">

      {/* =========================
          TOP HEADER
      ========================= */}

      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/70 bg-[#0d0d0f] px-3 sm:px-5">

        {/* LEFT */}

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
              setWorkflowName(event.target.value)
            }
            className="min-w-0 max-w-[220px] truncate bg-transparent text-sm font-semibold text-zinc-100 outline-none"
          />
        </div>

        {/* RIGHT */}

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

      {/* =========================
          BUILDER
      ========================= */}

      <div className="flex min-h-0 flex-1">

        {/* LEFT NODE PANEL */}

        <div className="hidden w-60 shrink-0 md:block">
          <NodePanel />
        </div>

        {/* CANVAS */}

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

        {/* RIGHT CONFIG PANEL */}

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