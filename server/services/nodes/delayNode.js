const executeDelayNode = async (
  node,
  input = {},
  context = {}
) => {
  const config =
    node.data?.config || {};

  const rawDelay =
    config.delay ??
    config.duration ??
    config.delayMs;

  if (
    rawDelay === undefined ||
    rawDelay === null ||
    rawDelay === ""
  ) {
    throw new Error(
      "Delay duration is required"
    );
  }

  const delayMs =
    Number(rawDelay);

  if (
    !Number.isFinite(delayMs) ||
    delayMs < 0
  ) {
    throw new Error(
      "Delay duration must be a valid non-negative number"
    );
  }

  if (!Number.isInteger(delayMs)) {
    throw new Error(
      "Delay duration must be a whole number of milliseconds"
    );
  }

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
    `Executing delay node: ${delayMs}ms`
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
    `Delay completed: ${delayMs}ms`
  );

  return {
    success: true,
    output: input,
  };
};

module.exports =
  executeDelayNode;