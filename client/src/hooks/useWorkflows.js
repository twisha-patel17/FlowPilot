import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
} from "../api/workflowApi";

import { useWorkspace } from "../context/WorkspaceContext";

export const useWorkflows = () => {
  const { currentWorkspace } =
    useWorkspace();

  const workspaceId =
    currentWorkspace?._id;

  const queryClient =
    useQueryClient();

  const workflowsQuery =
    useQuery({
      queryKey: [
        "workflows",
        workspaceId,
      ],

      queryFn: () =>
        getWorkflows(workspaceId),

      enabled:
        Boolean(workspaceId),
    });

  const createMutation =
    useMutation({
      mutationFn: ({
        workflowData,
      }) =>
        createWorkflow({
          workflowData,
          workspaceId,
        }),

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "workflows",
            workspaceId,
          ],
        });
      },
    });

  const updateMutation =
    useMutation({
      mutationFn: ({
        id,
        workflowData,
      }) =>
        updateWorkflow({
          id,
          workflowData,
          workspaceId,
        }),

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "workflows",
            workspaceId,
          ],
        });
      },
    });

  const toggleMutation =
    useMutation({
      mutationFn: ({ id }) =>
        toggleWorkflow({
          id,
          workspaceId,
        }),

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "workflows",
            workspaceId,
          ],
        });
      },
    });

  const deleteMutation =
    useMutation({
      mutationFn: ({ id }) =>
        deleteWorkflow({
          id,
          workspaceId,
        }),

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "workflows",
            workspaceId,
          ],
        });
      },
    });

  return {
    workflows:
      workflowsQuery.data?.workflows ||
      [],

    isLoading:
      workflowsQuery.isLoading,

    isFetching:
      workflowsQuery.isFetching,

    isError:
      workflowsQuery.isError,

    error:
      workflowsQuery.error,

    refetch:
      workflowsQuery.refetch,

    createWorkflow:
      createMutation.mutateAsync,

    isCreating:
      createMutation.isPending,

    createError:
      createMutation.error,

    updateWorkflow:
      updateMutation.mutateAsync,

    isUpdating:
      updateMutation.isPending,

    updateError:
      updateMutation.error,

    toggleWorkflow:
      toggleMutation.mutateAsync,

    isToggling:
      toggleMutation.isPending,

    toggleError:
      toggleMutation.error,

    deleteWorkflow:
      deleteMutation.mutateAsync,

    isDeleting:
      deleteMutation.isPending,

    deleteError:
      deleteMutation.error,
  };
};

export const useWorkflow = (
  workflowId
) => {
  const { currentWorkspace } =
    useWorkspace();

  const workspaceId =
    currentWorkspace?._id;

  return useQuery({
    queryKey: [
      "workflow",
      workspaceId,
      workflowId,
    ],

    queryFn: () =>
      getWorkflow({
        id: workflowId,
        workspaceId,
      }),

    enabled:
      Boolean(
        workspaceId &&
          workflowId
      ),
  });
};