import api from "./axios";

export const getWorkspaces = async () => {
  const response = await api.get("/workspaces");
  return response.data;
};

export const getWorkspace = async (id) => {
  const response = await api.get(`/workspaces/${id}`);
  return response.data;
};

export const createWorkspace = async (workspaceData) => {
  const response = await api.post("/workspaces", workspaceData);
  return response.data;
};

export const updateWorkspace = async ({ id, workspaceData }) => {
  const response = await api.patch(
    `/workspaces/${id}`,
    workspaceData
  );

  return response.data;
};

export const deleteWorkspace = async (id) => {
  const response = await api.delete(`/workspaces/${id}`);
  return response.data;
};