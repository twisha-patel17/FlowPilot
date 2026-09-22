import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getExecution,
  cancelExecution,
} from "../api/executionApi";

import { useWorkspace } from "../context/WorkspaceContext";

import socket from "../socket/socket";

export const useExecution = (
  executionId
) => {
  const {
    currentWorkspace,
  } = useWorkspace();

  const workspaceId =
    currentWorkspace?._id;

  const queryClient =
    useQueryClient();

  const query = useQuery({
    queryKey: [
      "execution",
      workspaceId,
      executionId,
    ],

    queryFn: () =>
      getExecution({
        id: executionId,
        workspaceId,
      }),

    enabled:
      Boolean(
        workspaceId &&
          executionId
      ),
  });

  const execution =
    query.data?.execution || null;

  useEffect(() => {
    if (
      !workspaceId ||
      !executionId
    ) {
      return;
    }

    const handleExecutionUpdate =
      (updatedExecution) => {
        if (
          !updatedExecution?._id
        ) {
          return;
        }

        if (
          updatedExecution._id !==
          executionId
        ) {
          return;
        }

        queryClient.setQueryData(
          [
            "execution",
            workspaceId,
            executionId,
          ],
          {
            execution:
              updatedExecution,
          }
        );

        queryClient.setQueryData(
          [
            "executions",
            workspaceId,
          ],
          (currentData) => {
            if (
              !currentData?.executions
            ) {
              return currentData;
            }

            return {
              ...currentData,

              executions:
                currentData.executions.map(
                  (item) =>
                    item._id ===
                    executionId
                      ? {
                          ...item,
                          ...updatedExecution,
                        }
                      : item
                ),
            };
          }
        );
      };

    socket.on(
      "execution-update",
      handleExecutionUpdate
    );

    socket.emit(
      "join-execution",
      executionId
    );

    return () => {
      socket.off(
        "execution-update",
        handleExecutionUpdate
      );

      socket.emit(
        "leave-execution",
        executionId
      );
    };
  }, [
    workspaceId,
    executionId,
    queryClient,
  ]);

  const cancelMutation =
    useMutation({
      mutationFn: () =>
        cancelExecution({
          id: executionId,
          workspaceId,
        }),

      onSuccess: (data) => {
        if (data?.execution) {
          queryClient.setQueryData(
            [
              "execution",
              workspaceId,
              executionId,
            ],
            {
              execution:
                data.execution,
            }
          );
        }

        queryClient.invalidateQueries({
          queryKey: [
            "executions",
            workspaceId,
          ],
        });
      },
    });

  return {
    execution,

    isLoading:
      query.isLoading,

    isFetching:
      query.isFetching,

    isError:
      query.isError,

    error:
      query.error,

    refetch:
      query.refetch,

    cancelExecution:
      cancelMutation.mutateAsync,

    isCancelling:
      cancelMutation.isPending,

    cancelError:
      cancelMutation.error,
  };
};