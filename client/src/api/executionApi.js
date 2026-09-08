import api from "./axios";

export const getExecutions = async (workspaceId) => {
  const response = await api.get("/executions", {
    headers: {
      "X-Workspace-Id": workspaceId,
    },
  });

  return response.data;
};

export const getExecution = async ({
  id,
  workspaceId,
}) => {
  const response = await api.get(`/executions/${id}`, {
    headers: {
      "X-Workspace-Id": workspaceId,
    },
  });

  return response.data;
};

export const createExecution = async ({
  workflowId,
  workspaceId,
}) => {
  const response = await api.post(
    "/executions",
    {
      workflowId,
    },
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};