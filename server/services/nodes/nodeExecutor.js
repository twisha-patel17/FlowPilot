const executeHttpNode = require("./httpNode");
const executeFilterNode = require("./filterNode");
const executeDiscordNode = require("./discordNode");
const executeEmailNode = require("./emailNode");
const executeConditionNode = require("./conditionNode");
const executeMongoDBNode = require("./mongodbNode");
const executeDelayNode = require("./delayNode");
const executeSwitchNode = require("./switchNode");

const executeManualNode = async (
  node,
  input = {},
  context = {}
) => {
  if (context.signal?.aborted) {
    const error = new Error(
      "Manual node execution was cancelled"
    );

    error.code = "NODE_CANCELLED";

    throw error;
  }

  return {
    success: true,
    output: input || {},
  };
};

const executeWebhookNode = async (
  node,
  input = {},
  context = {}
) => {
  if (context.signal?.aborted) {
    const error = new Error(
      "Webhook node execution was cancelled"
    );

    error.code = "NODE_CANCELLED";

    throw error;
  }

  return {
    success: true,
    output: input || {},
  };
};

const NODE_EXECUTORS = Object.freeze({
  manual: executeManualNode,
  filter: executeFilterNode,
  http: executeHttpNode,
  discord: executeDiscordNode,
  email: executeEmailNode,
  mongodb: executeMongoDBNode,
  condition: executeConditionNode,
  delay: executeDelayNode,
  webhook: executeWebhookNode,
  switch: executeSwitchNode,
});

const executeNode = async (
  node,
  input = {},
  context = {}
) => {
  if (!node || typeof node !== "object") {
    const error = new Error(
      "Invalid workflow node"
    );

    error.code = "INVALID_NODE";

    throw error;
  }

  const rawNodeType =
    node.data?.type ||
    node.data?.nodeType;

  const nodeType =
    typeof rawNodeType === "string"
      ? rawNodeType.trim().toLowerCase()
      : "";

  if (!nodeType) {
    const error = new Error(
      "Workflow node type is required"
    );

    error.code = "INVALID_NODE";

    throw error;
  }

  const executor =
    NODE_EXECUTORS[nodeType];

  if (!executor) {
    const error = new Error(
      `Unsupported node type: ${nodeType}`
    );

    error.code =
      "UNSUPPORTED_NODE_TYPE";

    throw error;
  }

  const nodeContext = {
    ...context,
    signal: context.signal || null,
  };

  return executor(
    node,
    input,
    nodeContext
  );
};

module.exports = executeNode;