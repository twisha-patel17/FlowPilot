const { Worker } = require("bullmq");

const redisConnection = require("../../config/redis");
const Execution = require("../../models/Execution");
const WebhookDelivery = require("../../models/WebhookDelivery");

const executeWorkflow = require("../workflow/executeWorkflow");
const { emitExecutionUpdate } = require("../socket/socket");

const updateWebhookDelivery = async (
  executionId,
  status,
  error = null
) => {
  const webhookDelivery =
    await WebhookDelivery.findOne({
      execution: executionId,
    });

  if (!webhookDelivery) {
    return;
  }

  webhookDelivery.status = status;

  if (status === "running") {
    webhookDelivery.responseCode = null;
    webhookDelivery.error = null;
  }

  if (status === "success") {
    webhookDelivery.responseCode = 200;
    webhookDelivery.error = null;
  }

  if (status === "failed") {
    webhookDelivery.responseCode = 500;
    webhookDelivery.error =
      error || "Workflow execution failed";
  }

  webhookDelivery.duration =
    Date.now() -
    new Date(
      webhookDelivery.receivedAt
    ).getTime();

  await webhookDelivery.save();
};

const workflowWorker = new Worker(
  "workflow-execution",

  async (job) => {
    console.log(
      `Processing workflow job: ${job.id}`
    );

    const { executionId } = job.data;

    if (!executionId) {
      throw new Error(
        "Execution ID is missing"
      );
    }

    const existingExecution =
      await Execution.findById(executionId);

    if (!existingExecution) {
      throw new Error(
        `Execution not found: ${executionId}`
      );
    }

    /*
     * Never execute an already successful
     * workflow again.
     */
    if (
      existingExecution.status === "success"
    ) {
      console.log(
        `Execution already completed: ${executionId}`
      );

      return {
        executionId,
        status: "success",
      };
    }

    /*
     * BullMQ attemptsMade is zero-based.
     *
     * attempt 1 -> attemptsMade 0
     * attempt 2 -> attemptsMade 1
     * attempt 3 -> attemptsMade 2
     */
    const currentAttempt =
      job.attemptsMade + 1;

    const attemptsAllowed =
      job.opts.attempts || 1;

    console.log(
      `Workflow attempt: ${currentAttempt}/${attemptsAllowed}`
    );

    await updateWebhookDelivery(
      executionId,
      "running"
    );

    try {
      const execution =
        await executeWorkflow(
          executionId,
          currentAttempt
        );

      /*
       * Workflow completed normally.
       */
      await updateWebhookDelivery(
        executionId,
        "success"
      );

      console.log(
        `Workflow execution finished: ` +
        `${execution._id} | ` +
        `Attempt: ${currentAttempt}`
      );

      return {
        executionId:
          execution._id.toString(),

        status: execution.status,

        attempt: currentAttempt,
      };
    } catch (error) {
      /*
       * IMPORTANT:
       *
       * This is NOT a workflow failure.
       *
       * Another worker already owns the Redis lock
       * for this execution.
       *
       * Do not retry.
       * Do not mark the execution as failed.
       * Do not modify the execution state.
       */
      if (
        error.code === "EXECUTION_LOCKED"
      ) {
        console.log(
          `Duplicate execution ignored: ` +
          `${executionId} | ` +
          `Attempt: ${currentAttempt}`
        );

        return {
          executionId,
          status: "skipped",
          reason: "already_running",
          attempt: currentAttempt,
        };
      }

      /*
       * Normal workflow failure.
       *
       * Let BullMQ control the retry.
       */
      const nextAttempt =
        currentAttempt + 1;

      const canRetry =
        nextAttempt <= attemptsAllowed;

      if (canRetry) {
        const execution =
          await Execution.findById(
            executionId
          );

        if (execution) {
          execution.status = "pending";

          execution.finishedAt = null;

          execution.error =
            `Retrying workflow execution... ` +
            `Attempt ${nextAttempt} ` +
            `of ${attemptsAllowed}`;

          await execution.save();

          emitExecutionUpdate(execution);
        }

        console.log(
          `Workflow execution will retry: ` +
          `${executionId} | ` +
          `Next attempt: ${nextAttempt} ` +
          `/ ${attemptsAllowed}`
        );
      } else {
        console.log(
          `No retries remaining for workflow execution: ` +
          `${executionId} | ` +
          `Attempt: ${currentAttempt}/${attemptsAllowed}`
        );
      }

      /*
       * Re-throw so BullMQ performs the
       * configured retry/backoff.
       */
      throw error;
    }
  },

  {
    connection: redisConnection,
  }
);

workflowWorker.on(
  "completed",
  (job, result) => {
    console.log(
      `Workflow job completed: ${job.id}`,
      result
    );
  }
);

workflowWorker.on(
  "failed",
  async (job, error) => {
    console.error(
      `Workflow job failed: ${job?.id}`,
      error.message
    );

    if (!job) {
      return;
    }

    const attemptsAllowed =
      job.opts.attempts || 1;

    /*
     * attemptsMade represents the number
     * of attempts already made after failure.
     *
     * For 3 allowed attempts:
     *
     * attempt 1 -> attemptsMade = 1
     * attempt 2 -> attemptsMade = 2
     * attempt 3 -> attemptsMade = 3
     */
    const attemptsMade =
      job.attemptsMade;

    const isFinalAttempt =
      attemptsMade >= attemptsAllowed;

    if (!isFinalAttempt) {
      return;
    }

    try {
      const execution =
        await Execution.findById(
          job.data.executionId
        );

      if (!execution) {
        console.error(
          `Execution not found after final failure: ` +
          `${job.data.executionId}`
        );

        return;
      }

      /*
       * Prevent another final-failure
       * handler from overwriting a successful
       * execution.
       */
      if (
        execution.status === "success"
      ) {
        console.log(
          `Execution completed successfully before final failure handler: ` +
          `${execution._id}`
        );

        return;
      }

      execution.status = "failed";

      execution.error =
        error.message ||
        "Workflow execution failed";

      execution.finishedAt = new Date();

      await execution.save();

      emitExecutionUpdate(execution);

      await updateWebhookDelivery(
        execution._id,
        "failed",
        execution.error
      );

      console.log(
        `Workflow execution permanently failed: ` +
        `${execution._id} | ` +
        `Attempts: ${attemptsAllowed}`
      );
    } catch (updateError) {
      console.error(
        "Failed to update execution after final retry:",
        updateError.message
      );
    }
  }
);

workflowWorker.on(
  "error",
  (error) => {
    console.error(
      "Workflow worker error:",
      error
    );
  }
);

module.exports = workflowWorker;