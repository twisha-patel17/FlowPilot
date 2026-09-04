import api from "./axios";

export const getExecutions = async () => {
  const response = await api.get("/executions");
  return response.data;
};

export const getExecution = async (id) => {
  const response = await api.get(`/executions/${id}`);
  return response.data;
};

export const createExecution = async (workflowId) => {
  const response = await api.post("/executions", {
    workflowId,
  });

  return response.data;
};