const crypto = require("crypto");

const createIdempotencyKey = (effectScopeId, nodeId) => {
  if (!effectScopeId) {
    throw new Error("Effect scope ID is required for idempotency");
  }

  if (!nodeId) {
    throw new Error("Node ID is required for idempotency");
  }

  return crypto
    .createHash("sha256")
    .update(`flowpilot:${effectScopeId}:${nodeId}`)
    .digest("hex");
};

module.exports = {
  createIdempotencyKey,
};