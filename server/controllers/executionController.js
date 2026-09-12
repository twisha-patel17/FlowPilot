const Workflow = require("../models/Workflow");
const Execution = require("../models/Execution");
const Workspace = require("../models/Workspace");

const workflowQueue = require("../services/queue/workflowQueue");
const createExecution = async (req, res) => {
  try {
    const { workflowId, input = {} } = req.body;

    const workspaceId = req.headers["x-workspace-id"];

    if (!workflowId) {
      return res.status(400).json({
        message: "Workflow ID is required",
      });
    }

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
    });

    if (!workspace) {
      return res.status(403).json({
        message: "You do not have access to this workspace",
      });
    }

    const workflow = await Workflow.findOne({
      _id: workflowId,
      owner: req.user._id,
      workspace: workspaceId,
    });

    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found",
      });
    }

    const execution = await Execution.create({
      workflow: workflow._id,
      owner: req.user._id,
      workspace: workspaceId,
      status: "pending",
      trigger: "manual",
      input,
    });

    try {
      const job = await workflowQueue.add(
        "execute-workflow",
        {
          executionId: execution._id.toString(),
        }
      );

      console.log(
        `Workflow execution queued: ` +
        `${execution._id} | Job: ${job.id}`
      );

      return res.status(201).json({
        message: "Workflow execution queued successfully",
        execution,
      });
    } catch (queueError) {
      execution.status = "failed";
      execution.error = queueError.message;
      execution.finishedAt = new Date();

      await execution.save();

      console.error(
        "Failed to queue workflow execution:",
        queueError
      );

      return res.status(500).json({
        message: "Failed to queue workflow execution",
        error: queueError.message,
        execution,
      });
    }
  } catch (error) {
    console.error("Create execution error:", error);

    return res.status(500).json({
      message: "Failed to create workflow execution",
      error: error.message,
    });
  }
};

const getExecutions = async (req, res) => {
  try {
    const workspaceId = req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
    });

    if (!workspace) {
      return res.status(403).json({
        message: "You do not have access to this workspace",
      });
    }

    const executions = await Execution.find({
      owner: req.user._id,
      workspace: workspaceId,
    })
      .populate("workflow", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      executions,
    });
  } catch (error) {
    console.error("Get executions error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getExecution = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
    });

    if (!workspace) {
      return res.status(403).json({
        message: "You do not have access to this workspace",
      });
    }

    const execution = await Execution.findOne({
      _id: id,
      owner: req.user._id,
      workspace: workspaceId,
    }).populate("workflow", "name workspace");

    if (!execution) {
      return res.status(404).json({
        message: "Execution not found",
      });
    }

    return res.status(200).json({
      execution,
    });
  } catch (error) {
    console.error("Get execution error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createExecution,
  getExecutions,
  getExecution,
};