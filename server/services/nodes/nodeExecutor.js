const executeHttpNode = require("./httpNode");
const executeFilterNode = require("./filterNode");
const executeDiscordNode = require("./discordNode");

const executeManualNode = async (node, input) => {
  console.log("Executing manual node");

  return {
    success: true,
    output: input || {},
  };
};

const executeNode = async (node, input = {}) => {
  const nodeType = node.data?.type || node.type;

  switch (nodeType) {
    case "manual":
      return executeManualNode(node, input);

    case "filter":
      return executeFilterNode(node, input);

    case "http":
      return executeHttpNode(node, input);

    case "discord":
      return executeDiscordNode(node, input);

    default:
      throw new Error(
        `Unsupported node type: ${nodeType}`
      );
  }
};

module.exports = executeNode;