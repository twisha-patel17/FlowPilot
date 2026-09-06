import api from "./axios";

export const getWebhooks = async () => {
  const response = await api.get("/webhooks");
  return response.data;
};

export const createWebhook = async (webhookData) => {
  const response = await api.post("/webhooks", webhookData);
  return response.data;
};

export const toggleWebhook = async (id) => {
  const response = await api.patch(`/webhooks/${id}/toggle`);
  return response.data;
};

export const getWebhookDeliveries = async (id) => {
  const response = await api.get(`/webhooks/${id}/deliveries`);
  return response.data;
};