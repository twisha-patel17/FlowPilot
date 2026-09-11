const executeHttpNode = require("./httpNode");
const executeFilterNode = require("./filterNode");
const executeDiscordNode = require("./discordNode");
const executeEmailNode = require("./emailNode");

const executeManualNode = async (node, input) => {
  console.log("Executing manual node");

  return {
    success: true,
    output: input || {},
  };
};

const executeWebhookNode = async (node, input) => {
  console.log("Executing webhook node");

  return {
    success: true,
    output: input || {},
  };
};

const executeNode = async (
  node,
  input = {},
  context = {}
) => {
  const nodeType =
    node.data?.type || node.data?.nodeType;

  console.log("Node type:", nodeType);

  switch (nodeType) {
    case "manual":
      return executeManualNode(node, input);

    case "filter":
      return executeFilterNode(node, input);

    case "http":
      return executeHttpNode(node, input, context);

    case "discord":
      return executeDiscordNode(
        node,
        input,
        context
      );
    
    case "email":
      return executeEmailNode(
        node,
        input,
        context
      );  

    case "webhook":
      return executeWebhookNode(node, input);

    default:
      throw new Error(
        `Unsupported node type: ${
          nodeType || "unknown"
        }`
      );
  }
};

module.exports = executeNode;