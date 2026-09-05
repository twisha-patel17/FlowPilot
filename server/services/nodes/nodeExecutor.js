const executeHttpNode = require("./httpNode");
const executeFilterNode = require("./filterNode");

const executeManualNode = async (node, input) => {
  console.log("Executing manual node");

  return {
    success: true,
    output: input || {},
  };
};

const executeDiscordNode = async (node, input) => {
  console.log("Executing Discord node");

  return {
    success: true,
    output: input || {},
  };
};

const executeNode = async (node, input = {}) => {
  const nodeType = node.data?.type;

  console.log("Node type:", nodeType);

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
        `Unsupported node type: ${nodeType || "unknown"}`
      );
  }
};

module.exports = executeNode;