const activeExecutions = new Map();

const registerExecution = (
  executionId,
  controller
) => {
  activeExecutions.set(
    executionId.toString(),
    controller
  );
};

const getExecutionController = (
  executionId
) => {
  return activeExecutions.get(
    executionId.toString()
  );
};

const cancelExecution = (
  executionId
) => {
  const controller =
    getExecutionController(
      executionId
    );

  if (!controller) {
    return false;
  }

  if (!controller.signal.aborted) {
    controller.abort();
  }

  return true;
};

const unregisterExecution = (
  executionId
) => {
  activeExecutions.delete(
    executionId.toString()
  );
};

module.exports = {
  registerExecution,
  getExecutionController,
  cancelExecution,
  unregisterExecution,
};