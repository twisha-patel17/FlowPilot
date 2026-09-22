import { useEffect } from "react";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getExecutions } from "../api/executionApi";

import socket from "../socket/socket";

export const useExecutions = (
  workspaceId
) => {
  const queryClient =
    useQueryClient();

  const query = useQuery({
    queryKey: [
      "executions",
      workspaceId,
    ],

    queryFn: () =>
      getExecutions(workspaceId),

    enabled:
      Boolean(workspaceId),
  });

  const executions =
    query.data?.executions || [];

  useEffect(() => {
    if (!workspaceId) {
      return;
    }

    const handleExecutionUpdate =
      (execution) => {
        if (
          !execution?._id ||
          !execution?.workspace
        ) {
          return;
        }

        const executionWorkspaceId =
          execution.workspace.toString();

        if (
          executionWorkspaceId !==
          workspaceId.toString()
        ) {
          return;
        }

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

            const existingIndex =
              currentData.executions.findIndex(
                (item) =>
                  item._id ===
                  execution._id
              );

            if (
              existingIndex === -1
            ) {
              return {
                ...currentData,

                executions: [
                  execution,
                  ...currentData.executions,
                ].slice(0, 100),
              };
            }

            const updatedExecutions =
              [
                ...currentData.executions,
              ];

            updatedExecutions[
              existingIndex
            ] = {
              ...updatedExecutions[
                existingIndex
              ],
              ...execution,
            };

            return {
              ...currentData,
              executions:
                updatedExecutions,
            };
          }
        );
      };

    socket.on(
      "execution-update",
      handleExecutionUpdate
    );

    return () => {
      socket.off(
        "execution-update",
        handleExecutionUpdate
      );
    };
  }, [
    workspaceId,
    queryClient,
  ]);

  return {
    executions,

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
  };
};