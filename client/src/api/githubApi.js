import api from "./axios";

export const testGitHubTrigger = async ({
  integrationId,
  repository,
  event,
  action,
  workspaceId,
}) => {
  const response = await api.post(
    "/github/test-trigger",
    {
      integrationId,
      repository,
      event,
      action,
    },
    {
      headers: {
        "X-Workspace-Id":
          workspaceId,
      },
    }
  );

  return response.data;
};