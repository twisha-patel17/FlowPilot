import api from "./axios";

export const createWorkflow = async ({
  workflowData,
  workspaceId,
}) => {
  const response = await api.post(
    "/workflows",
    workflowData,
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};

export const getWorkflows = async (workspaceId) => {
  const response = await api.get("/workflows", {
    headers: {
      "X-Workspace-Id": workspaceId,
    },
  });

  return response.data;
};

export const getWorkflow = async ({
  id,
  workspaceId,
}) => {
  const response = await api.get(`/workflows/${id}`, {
    headers: {
      "X-Workspace-Id": workspaceId,
    },
  });

  return response.data;
};

export const updateWorkflow = async ({
  id,
  workflowData,
  workspaceId,
}) => {
  const response = await api.patch(
    `/workflows/${id}`,
    workflowData,
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};

export const deleteWorkflow = async ({
  id,
  workspaceId,
}) => {
  const response = await api.delete(`/workflows/${id}`, {
    headers: {
      "X-Workspace-Id": workspaceId,
    },
  });

  return response.data;
};

export const toggleWorkflow = async ({
  id,
  workspaceId,
}) => {
  const response = await api.patch(
    `/workflows/${id}/toggle`,
    {},
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};