const axios = require("axios");

const executeDiscordNode = async (node, input = {}) => {
  const config = node.data?.config || {};

  const webhookUrl = config.webhookUrl;

  if (!webhookUrl) {
    throw new Error("Discord webhook URL is required");
  }

  const message =
    config.message ||
    JSON.stringify(input);

  console.log("Sending Discord message");

  const response = await axios.post(webhookUrl, {
    content: message,
  });

  return {
    success: true,
    output: {
      status: response.status,
      message,
      input,
    },
  };
};

module.exports = executeDiscordNode;