import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getExecutions } from "../api/executionApi";
import socket from "../socket/socket";

export const useExecutions = (workspaceId) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["executions", workspaceId],
    queryFn: () => getExecutions(workspaceId),
    enabled: !!workspaceId,
  });

  const executions = query.data?.executions || [];

  useEffect(() => {
    if (!workspaceId) return;

    const handleExecutionUpdate = (execution) => {
      if (!execution?.workspace) return;

      if (
        execution.workspace.toString() !==
        workspaceId.toString()
      ) {
        return;
      }

      queryClient.setQueryData(
        ["executions", workspaceId],
        (currentData) => {
          if (!currentData?.executions) {
            return currentData;
          }

          const existingIndex =
            currentData.executions.findIndex(
              (item) => item._id === execution._id
            );

          if (existingIndex === -1) {
            return {
              ...currentData,
              executions: [
                execution,
                ...currentData.executions,
              ],
            };
          }

          const updatedExecutions = [
            ...currentData.executions,
          ];

          updatedExecutions[existingIndex] = {
            ...updatedExecutions[existingIndex],
            ...execution,
          };

          return {
            ...currentData,
            executions: updatedExecutions,
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
  }, [workspaceId, queryClient]);

  useEffect(() => {
    if (!workspaceId || executions.length === 0) return;

    executions.forEach((execution) => {
      if (execution?._id) {
        socket.emit(
          "join-execution",
          execution._id
        );
      }
    });

    return () => {
      executions.forEach((execution) => {
        if (execution?._id) {
          socket.emit(
            "leave-execution",
            execution._id
          );
        }
      });
    };
  }, [workspaceId, executions]);

  return query;
};