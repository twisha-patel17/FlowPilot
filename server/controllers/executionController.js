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

const EXECUTION_LIST_LIMIT = 100;

const getWorkspace = async (
  workspaceId,
  userId
) => {
  if (!workspaceId) {
    return null;
  }

  return Workspace.findOne({
    _id: workspaceId,
    "members.user": userId,
    status: "active",
  })
    .select("_id")
    .lean();
};

const sanitizeExecution = (
  execution
) => {
  const data =
    execution?.toObject
      ? execution.toObject()
      : { ...execution };

  return data;
};

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
      await getWorkspace(
        workspaceId,
        req.user._id
      );

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
        status: "active",
      });

    if (!workflow) {
      return res.status(404).json({
        message:
          "Active workflow not found",
      });
    }

    const workflowSnapshot = {
      _id: workflow._id,
      name: workflow.name,
      description:
        workflow.description || "",
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
        execution:
          sanitizeExecution(
            execution
          ),
      });
    } catch (queueError) {
      const failedExecution =
        await Execution.findOneAndUpdate(
          {
            _id: execution._id,
            status: "pending",
          },
          {
            $set: {
              status: "failed",
              error:
                "Failed to queue workflow execution",
              finishedAt:
                new Date(),
            },
          },
          {
            new: true,
          }
        );

      console.error(
        "Failed to queue workflow execution:",
        queueError
      );

      return res.status(500).json({
        message:
          "Failed to queue workflow execution",
        execution:
          failedExecution
            ? sanitizeExecution(
                failedExecution
              )
            : sanitizeExecution(
                execution
              ),
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
      await getWorkspace(
        workspaceId,
        req.user._id
      );

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
        })
        .limit(
          EXECUTION_LIST_LIMIT
        )
        .lean();

    return res.status(200).json({
      executions:
        executions.map(
          sanitizeExecution
        ),
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
      await getWorkspace(
        workspaceId,
        req.user._id
      );

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
      })
        .populate(
          "workflow",
          "name workspace"
        )
        .lean();

    if (!execution) {
      return res.status(404).json({
        message:
          "Execution not found",
      });
    }

    return res.status(200).json({
      execution:
        sanitizeExecution(
          execution
        ),
    });
  } catch (error) {
    next(error);
  }
};

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

      const workspace =
        await getWorkspace(
          workspaceId,
          req.user._id
        );

      if (!workspace) {
        return res.status(403).json({
          message:
            "You do not have access to this workspace",
        });
      }

      const cancelledAt =
        new Date();

      const execution =
        await Execution.findOneAndUpdate(
          {
            _id: id,
            owner: req.user._id,
            workspace: workspaceId,
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
                cancelledAt,
              cancelledAt,
            },
          },
          {
            new: true,
          }
        );

      if (!execution) {
        const existingExecution =
          await Execution.findOne({
            _id: id,
            owner: req.user._id,
            workspace: workspaceId,
          })
            .select(
              "_id status workflow workspace owner cancelledAt finishedAt error"
            )
            .lean();

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
          });
        }

        if (
          existingExecution.status ===
          "success"
        ) {
          return res.status(409).json({
            message:
              "Successful executions cannot be cancelled",
          });
        }

        if (
          existingExecution.status ===
          "failed"
        ) {
          return res.status(409).json({
            message:
              "Failed executions cannot be cancelled",
          });
        }

        return res.status(409).json({
          message:
            "Execution cannot be cancelled in its current state",
        });
      }

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

        execution:
          sanitizeExecution(
            execution
          ),

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