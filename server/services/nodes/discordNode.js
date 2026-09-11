const axios = require("axios");
const getIntegration = require("../integrations/getIntegration");

const executeDiscordNode = async (
  node,
  input = {},
  context = {}
) => {
  const config = node.data?.config || {};

  const integration = await getIntegration({
    integrationId: config.integrationId,
    userId: context.userId,
    workspaceId: context.workspaceId,
    provider: "discord",
  });

  const webhookUrl =
    integration.credentials?.webhookUrl;

  if (!webhookUrl) {
    throw new Error(
      "Discord webhook URL is missing"
    );
  }

  const message =
    config.message ||
    config.content ||
    JSON.stringify(input);

  if (!message) {
    throw new Error(
      "Discord message is required"
    );
  }

  const response = await axios.post(
    webhookUrl,
    {
      content: message,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return {
    success: true,
    output: {
      status: response.status,
      message,
      integrationId: integration._id,
    },
  };
};

module.exports = executeDiscordNode;