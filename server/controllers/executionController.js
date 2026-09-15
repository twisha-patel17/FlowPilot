const Workflow = require("../models/Workflow");
const Execution = require("../models/Execution");
const Workspace = require("../models/Workspace");

const workflowQueue = require("../services/queue/workflowQueue");

const {
  cancelExecution,
} = require("../services/workflow/executionCancellation");

const {
  emitExecutionUpdate,
} = require("../services/socket/socket");

const createExecution = async (
  req,
  res,
  next
) => {
  try {
    const {
      workflowId,
      input = {},
    } = req.body;

    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workflowId) {
      return res.status(400).json({
        message:
          "Workflow ID is required",
      });
    }

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        "members.user":
          req.user._id,
      });

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const workflow =
      await Workflow.findOne({
        _id: workflowId,
        owner: req.user._id,
        workspace: workspaceId,
      });

    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found",
      });
    }

    const workflowSnapshot = {
      _id: workflow._id,
      name: workflow.name,
      workspace: workflow.workspace,
      trigger: workflow.trigger,
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
    };

    const execution =
      await Execution.create({
        workflow: workflow._id,

        workflowSnapshot,

        owner: req.user._id,

        workspace: workspaceId,

        status: "pending",

        trigger: "manual",

        input,
      });

    try {
      const job =
        await workflowQueue.add(
          "execute-workflow",
          {
            executionId:
              execution._id.toString(),
          }
        );

      console.log(
        `Workflow execution queued: ` +
        `${execution._id} | Job: ${job.id}`
      );

      return res.status(201).json({
        message:
          "Workflow execution queued successfully",

        execution,
      });
    } catch (queueError) {
      execution.status =
        "failed";

      execution.error =
        "Failed to queue workflow execution";

      execution.finishedAt =
        new Date();

      await execution.save();

      console.error(
        "Failed to queue workflow execution:",
        queueError
      );

      return res.status(500).json({
        message:
          "Failed to queue workflow execution",

        execution,
      });
    }
  } catch (error) {
    next(error);
  }
};

const getExecutions = async (
  req,
  res,
  next
) => {
  try {
    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        "members.user":
          req.user._id,
      });

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const executions =
      await Execution.find({
        owner: req.user._id,
        workspace: workspaceId,
      })
        .populate(
          "workflow",
          "name"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      executions,
    });
  } catch (error) {
    next(error);
  }
};

const getExecution = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        "members.user":
          req.user._id,
      });

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const execution =
      await Execution.findOne({
        _id: id,
        owner: req.user._id,
        workspace: workspaceId,
      }).populate(
        "workflow",
        "name workspace"
      );

    if (!execution) {
      return res.status(404).json({
        message:
          "Execution not found",
      });
    }

    return res.status(200).json({
      execution,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Cancel a pending or running execution.
 */
const cancelExecutionController =
  async (req, res, next) => {
    try {
      const { id } =
        req.params;

      const workspaceId =
        req.headers["x-workspace-id"];

      if (!workspaceId) {
        return res.status(400).json({
          message:
            "Workspace is required",
        });
      }

      /*
       * Verify workspace membership.
       */
      const workspace =
        await Workspace.findOne({
          _id: workspaceId,
          "members.user":
            req.user._id,
        });

      if (!workspace) {
        return res.status(403).json({
          message:
            "You do not have access to this workspace",
        });
      }

      /*
       * Atomically transition:
       *
       * pending/running → cancelled
       *
       * This prevents two cancellation
       * requests from racing.
       */
      const execution =
        await Execution.findOneAndUpdate(
          {
            _id: id,

            owner:
              req.user._id,

            workspace:
              workspaceId,

            status: {
              $in: [
                "pending",
                "running",
              ],
            },
          },
          {
            $set: {
              status: "cancelled",

              error:
                "Workflow execution was cancelled",

              finishedAt:
                new Date(),

              cancelledAt:
                new Date(),
            },
          },
          {
            new: true,
          }
        );

      if (!execution) {
        /*
         * Determine why cancellation failed
         * so the API can return a useful response.
         */
        const existingExecution =
          await Execution.findOne({
            _id: id,
            owner:
              req.user._id,
            workspace:
              workspaceId,
          });

        if (!existingExecution) {
          return res.status(404).json({
            message:
              "Execution not found",
          });
        }

        if (
          existingExecution.status ===
          "cancelled"
        ) {
          return res.status(409).json({
            message:
              "Execution is already cancelled",
            execution:
              existingExecution,
          });
        }

        if (
          existingExecution.status ===
          "success"
        ) {
          return res.status(409).json({
            message:
              "Successful executions cannot be cancelled",
            execution:
              existingExecution,
          });
        }

        if (
          existingExecution.status ===
          "failed"
        ) {
          return res.status(409).json({
            message:
              "Failed executions cannot be cancelled",
            execution:
              existingExecution,
          });
        }

        return res.status(409).json({
          message:
            "Execution cannot be cancelled in its current state",
          execution:
            existingExecution,
        });
      }

      /*
       * Signal an active workflow.
       *
       * If the workflow is still pending and
       * hasn't started, this simply returns false.
       */
      const signalSent =
        cancelExecution(id);

      emitExecutionUpdate(
        execution
      );

      console.log(
        `Execution cancelled: ${id} | ` +
        `Active signal: ${signalSent}`
      );

      return res.status(200).json({
        message:
          "Workflow execution cancelled successfully",

        execution,

        signalSent,
      });
    } catch (error) {
      next(error);
    }
  };

module.exports = {
  createExecution,
  getExecutions,
  getExecution,
  cancelExecutionController,
};