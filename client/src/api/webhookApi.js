import api from "./axios";

export const getWebhooks = async (workspaceId) => {
  const response = await api.get("/webhooks", {
    headers: {
      "X-Workspace-Id": workspaceId,
    },
  });

  return response.data;
};

export const createWebhook = async ({
  webhookData,
  workspaceId,
}) => {
  const response = await api.post(
    "/webhooks",
    webhookData,
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};

export const toggleWebhook = async ({
  id,
  workspaceId,
}) => {
  const response = await api.patch(
    `/webhooks/${id}/toggle`,
    {},
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};

export const getWebhookDeliveries = async ({
  id,
  workspaceId,
}) => {
  const response = await api.get(
    `/webhooks/${id}/deliveries`,
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};