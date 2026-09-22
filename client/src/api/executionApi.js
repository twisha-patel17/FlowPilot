import api from "./axios";

export const createExecution = async ({
  workflowId,
  input = {},
  workspaceId,
}) => {
  const response = await api.post(
    "/executions",
    {
      workflowId,
      input,
    },
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};

export const getExecutions = async (
  workspaceId
) => {
  const response = await api.get(
    "/executions",
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};

export const getExecution = async ({
  id,
  workspaceId,
}) => {
  const response = await api.get(
    `/executions/${id}`,
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};

export const cancelExecution = async ({
  id,
  workspaceId,
}) => {
  const response = await api.patch(
    `/executions/${id}/cancel`,
    {},
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};