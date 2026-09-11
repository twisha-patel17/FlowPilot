const Integration = require("../../models/Integration");

const getIntegration = async ({
  integrationId,
  userId,
  workspaceId,
  provider,
}) => {
  if (!integrationId) {
    throw new Error("Integration is required");
  }

  if (!userId) {
    throw new Error("User is required");
  }

  if (!workspaceId) {
    throw new Error("Workspace is required");
  }

  const query = {
    _id: integrationId,
    owner: userId,
    workspace: workspaceId,
    status: "connected",
  };

  if (provider) {
    query.provider = provider;
  }

  const integration = await Integration.findOne(query);

  if (!integration) {
    throw new Error("Integration not found or disconnected");
  }

  return integration;
};

module.exports = getIntegration;