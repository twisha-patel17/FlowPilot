const { Worker } = require("bullmq");

const redisConnection = require("../../config/redis");
const Execution = require("../../models/Execution");
const executeWorkflow = require("../workflow/executeWorkflow");
const { emitExecutionUpdate } = require("../socket/socket");

const workflowWorker = new Worker(
  "workflow-execution",
  async (job) => {
    console.log(`Processing workflow job: ${job.id}`);

    const { executionId } = job.data;

    if (!executionId) {
      throw new Error("Execution ID is missing");
    }

    try {
      const execution = await executeWorkflow(executionId);

      emitExecutionUpdate(execution);

      console.log(
        `Workflow execution finished: ${execution._id}`
      );

      return {
        executionId: execution._id.toString(),
        status: execution.status,
      };
    } catch (error) {
      const execution = await Execution.findById(
        executionId
      );

      if (execution) {
        const attemptsAllowed =
          job.opts.attempts || 1;

        const attemptsMade =
          job.attemptsMade;

        const isRetrying =
          attemptsMade < attemptsAllowed;

        if (isRetrying) {
          execution.status = "pending";
          execution.finishedAt = null;
          execution.error = `Retrying workflow execution... Attempt ${attemptsMade + 1} of ${attemptsAllowed}`;

          await execution.save();

          emitExecutionUpdate(execution);

          console.log(
            `Workflow execution will retry: ${execution._id} | Attempt ${attemptsMade + 1} of ${attemptsAllowed}`
          );
        }
      }

      throw error;
    }
  },
  {
    connection: redisConnection,
  }
);

workflowWorker.on("completed", (job, result) => {
  console.log(
    `Workflow job completed: ${job.id}`,
    result
  );
});

workflowWorker.on("failed", async (job, error) => {
  console.error(
    `Workflow job failed: ${job?.id}`,
    error.message
  );

  if (!job) {
    return;
  }

  const attemptsAllowed =
    job.opts.attempts || 1;

  const attemptsMade =
    job.attemptsMade;

  if (attemptsMade >= attemptsAllowed) {
    try {
      const execution = await Execution.findById(
        job.data.executionId
      );

      if (execution) {
        execution.status = "failed";
        execution.error = error.message;
        execution.finishedAt = new Date();

        await execution.save();

        emitExecutionUpdate(execution);
      }
    } catch (updateError) {
      console.error(
        "Failed to update execution after final retry:",
        updateError.message
      );
    }
  }
});

workflowWorker.on("error", (error) => {
  console.error(
    "Workflow worker error:",
    error
  );
});

module.exports = workflowWorker;