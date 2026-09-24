const crypto = require("crypto");

const createIdempotencyKey = (
  executionId,
  nodeId
) => {
  if (!executionId) {
    throw new Error(
      "Execution ID is required for idempotency"
    );
  }

  if (!nodeId) {
    throw new Error(
      "Node ID is required for idempotency"
    );
  }

  return crypto
    .createHash("sha256")
    .update(
      `flowpilot:${executionId}:${nodeId}`
    )
    .digest("hex");
};

module.exports = {
  createIdempotencyKey,
};