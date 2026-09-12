import api from "./axios";

export const getSchedules = async (workspaceId) => {
  const response = await api.get("/schedules", {
    headers: {
      "X-Workspace-Id": workspaceId,
    },
  });

  return response.data;
};

export const getSchedule = async ({
  id,
  workspaceId,
}) => {
  const response = await api.get(`/schedules/${id}`, {
    headers: {
      "X-Workspace-Id": workspaceId,
    },
  });

  return response.data;
};

export const updateSchedule = async ({
  id,
  scheduleData,
  workspaceId,
}) => {
  const response = await api.patch(
    `/schedules/${id}`,
    scheduleData,
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};

export const deleteSchedule = async ({
  id,
  workspaceId,
}) => {
  const response = await api.delete(
    `/schedules/${id}`,
    {
      headers: {
        "X-Workspace-Id": workspaceId,
      },
    }
  );

  return response.data;
};