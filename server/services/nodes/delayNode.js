const executeDelayNode = async (
  node,
  input = {},
  context = {}
) => {
  const config =
    node.data?.config || {};

  const rawDuration =
    config.duration ??
    config.delay ??
    config.delayMs;

  if (
    rawDuration === undefined ||
    rawDuration === null ||
    rawDuration === ""
  ) {
    throw new Error(
      "Delay duration is required"
    );
  }

  const duration =
    Number(rawDuration);

  if (
    !Number.isFinite(duration) ||
    duration < 0
  ) {
    throw new Error(
      "Delay duration must be a valid non-negative number"
    );
  }

  if (!Number.isInteger(duration)) {
    throw new Error(
      "Delay duration must be a whole number"
    );
  }

  const unit =
    typeof config.unit === "string"
      ? config.unit.trim().toLowerCase()
      : "seconds";

  const unitMultipliers = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
  };

  if (
    !Object.prototype.hasOwnProperty.call(
      unitMultipliers,
      unit
    )
  ) {
    throw new Error(
      `Unsupported delay unit: ${unit}`
    );
  }

  const delayMs =
    duration * unitMultipliers[unit];

  const maxDelayMs =
    Number(
      process.env.WORKFLOW_TIMEOUT_MS
    ) || 300000;

  if (delayMs > maxDelayMs) {
    throw new Error(
      `Delay duration cannot exceed ${maxDelayMs}ms`
    );
  }

  console.log(
    `Executing delay node: ${duration} ${unit} (${delayMs}ms)`
  );

  if (
    context.signal?.aborted
  ) {
    const error =
      new Error(
        "Delay node execution was cancelled"
      );

    error.code =
      "NODE_CANCELLED";

    throw error;
  }

  if (delayMs === 0) {
    return {
      success: true,
      output: input,
    };
  }

  await new Promise(
    (resolve, reject) => {
      let settled = false;

      const timer =
        setTimeout(() => {
          if (settled) return;

          settled = true;

          if (
            context.signal
          ) {
            context.signal.removeEventListener(
              "abort",
              abortHandler
            );
          }

          resolve();
        }, delayMs);

      const abortHandler = () => {
        if (settled) return;

        settled = true;

        clearTimeout(timer);

        const error =
          new Error(
            "Delay node execution was cancelled"
          );

        error.code =
          "NODE_CANCELLED";

        reject(error);
      };

      if (
        context.signal
      ) {
        context.signal.addEventListener(
          "abort",
          abortHandler,
          { once: true }
        );

        if (
          context.signal.aborted
        ) {
          abortHandler();
        }
      }
    }
  );

  if (
    context.signal?.aborted
  ) {
    const error =
      new Error(
        "Delay node execution was cancelled"
      );

    error.code =
      "NODE_CANCELLED";

    throw error;
  }

  console.log(
    `Delay completed: ${duration} ${unit} (${delayMs}ms)`
  );

  return {
    success: true,
    output: input,
  };
};

module.exports =
  executeDelayNode;