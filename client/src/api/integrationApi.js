import api from "./axios";

export const getIntegrations = async () => {
  const response = await api.get("/integrations");
  return response.data;
};

export const getIntegration = async (id) => {
  const response = await api.get(`/integrations/${id}`);
  return response.data;
};

export const createIntegration = async (integrationData) => {
  const response = await api.post(
    "/integrations",
    integrationData
  );

  return response.data;
};

export const updateIntegration = async ({
  id,
  integrationData,
}) => {
  const response = await api.patch(
    `/integrations/${id}`,
    integrationData
  );

  return response.data;
};

export const toggleIntegration = async (id) => {
  const response = await api.patch(
    `/integrations/${id}/toggle`
  );

  return response.data;
};

export const deleteIntegration = async (id) => {
  const response = await api.delete(
    `/integrations/${id}`
  );

  return response.data;
};