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

  if (status === "cancelled") {
    webhookDelivery.responseCode = 499;
    webhookDelivery.error =
      error || "Workflow execution was cancelled";
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

    if (
      existingExecution.status ===
      "cancelled"
    ) {
      console.log(
        `Execution already cancelled: ${executionId}`
      );

      await updateWebhookDelivery(
        executionId,
        "cancelled",
        existingExecution.error
      );

      return {
        executionId,
        status: "cancelled",
        attempt:
          existingExecution.attempt,
      };
    }

    if (
      existingExecution.status ===
      "success"
    ) {
      console.log(
        `Execution already completed: ${executionId}`
      );

      return {
        executionId,
        status: "success",
        attempt:
          existingExecution.attempt,
      };
    }

    const currentAttempt =
      job.attemptsMade + 1;

    const attemptsAllowed =
      job.opts.attempts || 1;

    console.log(
      `Workflow attempt: ${currentAttempt}/${attemptsAllowed}`
    );

    try {
      const execution =
        await executeWorkflow(
          executionId,
          currentAttempt
        );

      if (
        execution.status ===
        "cancelled"
      ) {
        await updateWebhookDelivery(
          executionId,
          "cancelled",
          execution.error
        );

        console.log(
          `Workflow execution cancelled: ` +
          `${execution._id} | ` +
          `Attempt: ${currentAttempt}`
        );

        return {
          executionId:
            execution._id.toString(),

          status: "cancelled",

          attempt: currentAttempt,
        };
      }

      if (
        execution.status ===
        "success"
      ) {
        await updateWebhookDelivery(
          executionId,
          "success"
        );
      }

      console.log(
        `Workflow execution finished: ` +
        `${execution._id} | ` +
        `Attempt: ${currentAttempt} | ` +
        `Status: ${execution.status}`
      );

      return {
        executionId:
          execution._id.toString(),

        status: execution.status,

        attempt: currentAttempt,
      };
    } catch (error) {
 
      if (
        error.code ===
        "EXECUTION_CANCELLED"
      ) {
        const cancelledExecution =
          await Execution.findById(
            executionId
          );

        if (
          cancelledExecution
            ?.status === "cancelled"
        ) {
          await updateWebhookDelivery(
            executionId,
            "cancelled",
            cancelledExecution.error
          );

          console.log(
            `Workflow cancellation handled: ` +
            `${executionId} | ` +
            `Attempt: ${currentAttempt}`
          );

          return {
            executionId,
            status: "cancelled",
            attempt: currentAttempt,
          };
        }

      }

      if (
        error.code ===
        "EXECUTION_LOCKED"
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

      const latestExecution =
        await Execution.findById(
          executionId
        );

      if (
        latestExecution?.status ===
        "cancelled"
      ) {
        await updateWebhookDelivery(
          executionId,
          "cancelled",
          latestExecution.error
        );

        console.log(
          `Execution was cancelled before retry: ` +
          `${executionId}`
        );

        return {
          executionId,
          status: "cancelled",
          attempt: currentAttempt,
        };
      }

      if (
        latestExecution?.status ===
        "success"
      ) {
        console.log(
          `Execution completed by another worker: ` +
          `${executionId}`
        );

        return {
          executionId,
          status: "success",
          attempt:
            latestExecution.attempt,
        };
      }

      const nextAttempt =
        currentAttempt + 1;

      const canRetry =
        nextAttempt <= attemptsAllowed;

      if (canRetry) {
        const retryingExecution =
          await Execution.findOneAndUpdate(
            {
              _id: executionId,

              status: "running",

              attempt: currentAttempt,
            },
            {
              $set: {
                status: "pending",

                finishedAt: null,

                error:
                  `Retrying workflow execution... ` +
                  `Attempt ${nextAttempt} ` +
                  `of ${attemptsAllowed}`,
              },
            },
            {
              new: true,
            }
          );

        if (retryingExecution) {
          emitExecutionUpdate(
            retryingExecution
          );

          console.log(
            `Workflow execution will retry: ` +
            `${executionId} | ` +
            `Next attempt: ${nextAttempt}` +
            `/${attemptsAllowed}`
          );
        } else {
          console.log(
            `Retry state update skipped because ` +
            `execution state changed: ${executionId}`
          );
        }
      } else {
        console.log(
          `No retries remaining for workflow execution: ` +
          `${executionId} | ` +
          `Attempt: ${currentAttempt}/${attemptsAllowed}`
        );
      }

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

    const executionId =
      job.data?.executionId;

    if (!executionId) {
      return;
    }

    /*
     * A cancelled execution must never enter
     * the final failure handler.
     */
    const currentExecution =
      await Execution.findById(
        executionId
      );

    if (
      currentExecution?.status ===
      "cancelled"
    ) {
      console.log(
        `Cancelled execution will not be marked failed: ` +
        `${executionId}`
      );

      await updateWebhookDelivery(
        executionId,
        "cancelled",
        currentExecution.error
      );

      return;
    }

    const attemptsAllowed =
      job.opts.attempts || 1;

    const attemptsMade =
      job.attemptsMade;

    const isFinalAttempt =
      attemptsMade >= attemptsAllowed;

    if (!isFinalAttempt) {
      return;
    }

    try {
      const execution =
        await Execution.findOneAndUpdate(
          {
            _id: executionId,

            status: {
              $in: [
                "pending",
                "running",
              ],
            },

            attempt: attemptsMade,
          },
          {
            $set: {
              status: "failed",

              error:
                error.message ||
                "Workflow execution failed",

              finishedAt: new Date(),
            },
          },
          {
            new: true,
          }
        );

      if (!execution) {
        const latestExecution =
          await Execution.findById(
            executionId
          );

        if (
          latestExecution?.status ===
          "cancelled"
        ) {
          await updateWebhookDelivery(
            executionId,
            "cancelled",
            latestExecution.error
          );

          console.log(
            `Execution was cancelled before ` +
            `final failure handling: ${executionId}`
          );

          return;
        }

        if (
          latestExecution?.status ===
          "success"
        ) {
          console.log(
            `Execution completed successfully before ` +
            `final failure handler: ${latestExecution._id}`
          );
        } else {
          console.log(
            `Final failure update skipped because ` +
            `execution state changed: ${executionId}`
          );
        }

        return;
      }

      emitExecutionUpdate(
        execution
      );

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