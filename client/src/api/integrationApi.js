import api from "./axios";

export const getIntegrations = async (workspaceId) => {
  const response = await api.get("/integrations", {
    headers: {
      "X-Workspace-Id": workspaceId,
    },
  });

  return response.data;
};

export const getIntegration = async ({
  id,
  workspaceId,
}) => {
  const response = await api.get(
    `/integrations/${id}`,
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};

export const createIntegration = async ({
  integrationData,
  workspaceId,
}) => {
  const response = await api.post(
    "/integrations",
    integrationData,
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};

export const updateIntegration = async ({
  id,
  integrationData,
  workspaceId,
}) => {
  const response = await api.patch(
    `/integrations/${id}`,
    integrationData,
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};

export const toggleIntegration = async ({
  id,
  workspaceId,
}) => {
  const response = await api.patch(
    `/integrations/${id}/toggle`,
    {},
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};

export const deleteIntegration = async ({
  id,
  workspaceId,
}) => {
  const response = await api.delete(
    `/integrations/${id}`,
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};