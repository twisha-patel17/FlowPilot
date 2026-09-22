const SENSITIVE_KEY_PATTERN =
  /^(password|passwd|secret|token|accessToken|refreshToken|apiKey|authorization|cookie|webhookUrl|connectionString|connectionUri|mongodbUri|privateKey|clientSecret|credentials|credential)$/i;

const MAX_DEPTH = 10;

const isPlainObject = (value) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(
      value?._bsontype ===
      "ObjectID"
    )
  );
};

const sanitizeValue = (
  value,
  depth = 0,
  seen = new WeakSet()
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === "object" &&
    value?._bsontype === "ObjectID"
  ) {
    return value.toString();
  }

  if (depth > MAX_DEPTH) {
    return "[Object truncated]";
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }

    seen.add(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      sanitizeValue(
        item,
        depth + 1,
        seen
      )
    );
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const sanitized = {};

  for (const [key, childValue] of Object.entries(
    value
  )) {
    if (
      SENSITIVE_KEY_PATTERN.test(key)
    ) {
      sanitized[key] =
        "[REDACTED]";
      continue;
    }

    sanitized[key] =
      sanitizeValue(
        childValue,
        depth + 1,
        seen
      );
  }

  return sanitized;
};

const sanitizeExecution = (
  execution
) => {
  if (!execution) {
    return null;
  }

  const data =
    typeof execution.toObject ===
    "function"
      ? execution.toObject()
      : execution;

  return {
    _id: data._id,

    workflow: data.workflow,

    workspace: data.workspace,

    status: data.status,

    trigger: data.trigger,

    input: sanitizeValue(
      data.input || {}
    ),

    scheduledAt:
      data.scheduledAt || null,

    startedAt:
      data.startedAt || null,

    finishedAt:
      data.finishedAt || null,

    cancelledAt:
      data.cancelledAt || null,

    error: data.error || null,

    attempt:
      data.attempt || 1,

    steps: Array.isArray(
      data.steps
    )
      ? data.steps.map(
          (step) => ({
            _id: step._id,

            nodeId:
              step.nodeId,

            type:
              step.type,

            attempt:
              step.attempt,

            status:
              step.status,

            input:
              sanitizeValue(
                step.input || {}
              ),

            output:
              sanitizeValue(
                step.output || {}
              ),

            error:
              step.error || null,

            duration:
              step.duration || 0,
          })
        )
      : [],

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
};

module.exports = {
  sanitizeExecution,
  sanitizeValue,
};