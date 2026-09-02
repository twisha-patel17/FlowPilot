import api from "./axios";

export const createWorkflow = async (workflowData) => {
  const response = await api.post("/workflows", workflowData);

  return response.data;
};

export const getWorkflows = async () => {
  const response = await api.get("/workflows");

  return response.data;
};

export const getWorkflow = async (id) => {
  const response = await api.get(`/workflows/${id}`);

  return response.data;
};

export const updateWorkflow = async ({ id, workflowData }) => {
  const response = await api.patch(
    `/workflows/${id}`,
    workflowData
  );

  return response.data;
};

export const deleteWorkflow = async (id) => {
  const response = await api.delete(`/workflows/${id}`);

  return response.data;
};

export const toggleWorkflow = async (id) => {
  const response = await api.patch(
    `/workflows/${id}/toggle`
  );

  return response.data;
};