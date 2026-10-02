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
  const response = await api.post(
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

export const retryExecution = async ({
  id,
  workspaceId,
}) => {
  const response = await api.post(
    `/executions/${id}/retry`,
    {},
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};

export const replayExecution = async ({
  id,
  workspaceId,
}) => {
  const response = await api.post(
    `/executions/${id}/replay`,
    {},
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};

export const createScheduledExecution = async ({
  workflowId,
  scheduledAt,
  input = {},
  workspaceId,
}) => {
  const response = await api.post(
    "/executions/scheduled",
    {
      workflowId,
      scheduledAt,
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