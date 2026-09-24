const Workflow = require("../models/Workflow");
const Execution = require("../models/Execution");
const Workspace = require("../models/Workspace");
const WorkflowVersion = require("../models/WorkflowVersion");

const workflowQueue = require("../services/queue/workflowQueue");

const {
  cancelExecution,
} = require("../services/workflow/executionCancellation");

const {
  emitExecutionUpdate,
} = require("../services/socket/socket");

const {
  sanitizeExecution,
} = require("../utils/executionSanitizer");

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
          "Workflow is required",
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
        "members.user": req.user._id,
        status: "active",
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
        status: "active",
      });

    if (!workflow) {
      return res.status(404).json({
        message:
          "Workflow not found or inactive",
      });
    }

    const workflowVersion =
      await WorkflowVersion.findOne({
        workflow: workflow._id,
        workspace: workspaceId,
        owner: req.user._id,
        version:
          workflow.currentVersion,
      });

    if (!workflowVersion) {
      return res.status(500).json({
        message:
          "Workflow version not found",
      });
    }

    const workflowSnapshot = {
      _id:
        workflowVersion.workflow,

      version:
        workflowVersion.version,

      name:
        workflowVersion.name,

      description:
        workflowVersion.description,

      workspace:
        workflowVersion.workspace,

      trigger:
        workflowVersion.trigger,

      nodes:
        workflowVersion.nodes,

      edges:
        workflowVersion.edges,
    };

    let execution;

    try {
      execution =
        await Execution.create({
          workflow:
            workflow._id,

          workflowVersion:
            workflowVersion._id,

          workflowSnapshot,

          owner:
            req.user._id,

          workspace:
            workspaceId,

          status:
            "pending",

          trigger:
            "manual",

          input,

          attempt: 1,
        });
    } catch (error) {
      console.error(
        "Execution creation error:",
        error
      );

      throw error;
    }

    try {
      await workflowQueue.add(
        "execute-workflow",
        {
          executionId:
            execution._id.toString(),
        },
        {
          jobId:
            execution._id.toString(),
        }
      );
    } catch (queueError) {
      console.error(
        "Execution queue error:",
        queueError
      );

      await Execution.findOneAndUpdate(
        {
          _id:
            execution._id,

          status:
            "pending",
        },
        {
          $set: {
            status:
              "failed",

            finishedAt:
              new Date(),

            error:
              "Failed to queue workflow execution",
          },
        }
      );

      return res.status(500).json({
        message:
          "Failed to queue workflow execution",
      });
    }

    return res.status(201).json({
      message:
        "Workflow execution started",

      execution:
        sanitizeExecution(
          execution
        ),
    });
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
          "name workspace"
        )
        .populate(
          "workflowVersion",
          "version"
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
        .populate(
          "workflowVersion",
          "version"
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
              status:
                "cancelled",

              error:
                "Workflow execution was cancelled",

              finishedAt:
                cancelledAt,

              cancelledAt,
            },
          },
          {
            returnDocument: "after",
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

  const retryExecution = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
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

    const originalExecution =
      await Execution.findOne({
        _id: id,
        owner: req.user._id,
        workspace: workspaceId,
        status: "failed",
      }).lean();

    if (!originalExecution) {
      return res.status(404).json({
        message:
          "Failed execution not found",
      });
    }

    const workflow =
      await Workflow.findOne({
        _id: originalExecution.workflow,
        owner: req.user._id,
        workspace: workspaceId,
        status: "active",
      }).select(
        "_id workspace owner status"
      );

    if (!workflow) {
      return res.status(409).json({
        message:
          "The workflow is no longer active",
      });
    }

    const workflowVersion =
      await WorkflowVersion.findOne({
        _id:
          originalExecution.workflowVersion,

        workflow:
          originalExecution.workflow,

        workspace: workspaceId,

        owner: req.user._id,
      });

    if (!workflowVersion) {
      return res.status(409).json({
        message:
          "The workflow version used by this execution is no longer available",
      });
    }

    const workflowSnapshot =
      originalExecution.workflowSnapshot
        ? originalExecution.workflowSnapshot
        : {
            _id:
              workflowVersion.workflow,

            version:
              workflowVersion.version,

            name:
              workflowVersion.name,

            description:
              workflowVersion.description,

            workspace:
              workflowVersion.workspace,

            trigger:
              workflowVersion.trigger,

            nodes:
              workflowVersion.nodes,

            edges:
              workflowVersion.edges,
          };

    let retryExecution;

    try {
      retryExecution =
        await Execution.create({
          workflow:
            originalExecution.workflow,

          workflowVersion:
            workflowVersion._id,

          workflowSnapshot,

          owner:
            req.user._id,

          workspace:
            workspaceId,

          status: "pending",

          trigger:
            originalExecution.trigger,

          input:
            originalExecution.input || {},

          retryOf:
            originalExecution._id,

          attempt: 1,

          steps: [],

          startedAt: null,

          finishedAt: null,

          cancelledAt: null,

          error: null,

          scheduledAt: null,
        });
    } catch (error) {
      console.error(
        "Retry execution creation error:",
        error
      );

      throw error;
    }

    try {
      await workflowQueue.add(
        "execute-workflow",
        {
          executionId:
            retryExecution._id.toString(),
        },
        {
          jobId:
            retryExecution._id.toString(),
        }
      );
    } catch (queueError) {
      console.error(
        "Retry execution queue error:",
        queueError
      );

      const failedRetry =
        await Execution.findOneAndUpdate(
          {
            _id:
              retryExecution._id,

            status:
              "pending",
          },
          {
            $set: {
              status: "failed",

              finishedAt:
                new Date(),

              error:
                "Failed to queue workflow retry",
            },
          },
          {
            returnDocument: "after",
          }
        );

      return res.status(500).json({
        message:
          "Failed to queue workflow retry",

        execution:
          failedRetry
            ? sanitizeExecution(
                failedRetry
              )
            : null,
      });
    }

    emitExecutionUpdate(
      retryExecution
    );

    return res.status(201).json({
      message:
        "Workflow execution retry started",

      execution:
        sanitizeExecution(
          retryExecution
        ),
    });
  } catch (error) {
    next(error);
  }
};

const replayExecution = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
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
    const originalExecution =
      await Execution.findOne({
        _id: id,
        owner: req.user._id,
        workspace: workspaceId,
        status: {
          $in: [
            "success",
            "failed",
            "cancelled",
          ],
        },
      }).lean();

    if (!originalExecution) {
      return res.status(404).json({
        message:
          "Completed execution not found",
      });
    }

    const workflowVersion =
      await WorkflowVersion.findOne({
        _id:
          originalExecution.workflowVersion,

        workflow:
          originalExecution.workflow,

        workspace: workspaceId,

        owner: req.user._id,
      });

    if (!workflowVersion) {
      return res.status(409).json({
        message:
          "The workflow version used by this execution is no longer available",
      });
    }

    const workflow =
      await Workflow.findOne({
        _id:
          originalExecution.workflow,

        owner: req.user._id,

        workspace: workspaceId,
      }).select("_id");

    if (!workflow) {
      return res.status(409).json({
        message:
          "The original workflow no longer exists",
      });
    }

    const workflowSnapshot =
      originalExecution.workflowSnapshot
        ? originalExecution.workflowSnapshot
        : {
            _id:
              workflowVersion.workflow,

            version:
              workflowVersion.version,

            name:
              workflowVersion.name,

            description:
              workflowVersion.description,

            workspace:
              workflowVersion.workspace,

            trigger:
              workflowVersion.trigger,

            nodes:
              workflowVersion.nodes,

            edges:
              workflowVersion.edges,
          };

    const replayedExecution =
      await Execution.create({
        workflow:
          originalExecution.workflow,

        workflowVersion:
          workflowVersion._id,

        workflowSnapshot,

        owner:
          req.user._id,

        workspace:
          workspaceId,

        status: "pending",

        trigger:
          originalExecution.trigger,

        input:
          originalExecution.input || {},

        retryOf: null,

        replayOf:
          originalExecution._id,

        attempt: 1,

        steps: [],

        scheduledAt: null,

        startedAt: null,

        finishedAt: null,

        cancelledAt: null,

        error: null,
      });

    try {
      await workflowQueue.add(
        "execute-workflow",
        {
          executionId:
            replayedExecution._id.toString(),
        },
        {
          jobId:
            replayedExecution._id.toString(),
        }
      );
    } catch (queueError) {
      console.error(
        "Replay execution queue error:",
        queueError
      );

      const failedReplay =
        await Execution.findOneAndUpdate(
          {
            _id:
              replayedExecution._id,

            status: "pending",
          },
          {
            $set: {
              status: "failed",

              finishedAt:
                new Date(),

              error:
                "Failed to queue workflow replay",
            },
          },
          {
            returnDocument: "after",
          }
        );

      return res.status(500).json({
        message:
          "Failed to queue workflow replay",

        execution:
          failedReplay
            ? sanitizeExecution(
                failedReplay
              )
            : null,
      });
    }

    emitExecutionUpdate(
      replayedExecution
    );

    return res.status(201).json({
      message:
        "Workflow replay started",

      execution:
        sanitizeExecution(
          replayedExecution
        ),
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
  retryExecution,
  replayExecution,
};