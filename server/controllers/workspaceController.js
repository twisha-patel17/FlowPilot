const Workspace = require("../models/Workspace");
const Workflow = require("../models/Workflow");
const Execution = require("../models/Execution");
const Webhook = require("../models/Webhook");
const WebhookDelivery = require("../models/WebhookDelivery");
const Integration = require("../models/Integration");

const {
  cancelExecution,
} = require("../services/workflow/executionCancellation");

const createWorkspace = async (
  req,
  res,
  next
) => {
  try {
    const { name } = req.body;

    const trimmedName =
      typeof name === "string"
        ? name.trim()
        : "";

    if (!trimmedName) {
      return res.status(400).json({
        message:
          "Workspace name is required",
      });
    }

    const workspace =
      await Workspace.create({
        name: trimmedName,
        owner: req.user._id,
        members: [
          {
            user: req.user._id,
            role: "owner",
          },
        ],
      });

    return res.status(201).json({
      message:
        "Workspace created successfully",
      workspace,
    });
  } catch (error) {
    next(error);
  }
};

const getWorkspaces = async (
  req,
  res,
  next
) => {
  try {
    const workspaces =
      await Workspace.find({
        "members.user":
          req.user._id,
        status: "active",
      })
        .sort({ createdAt: 1 })
        .lean();

    return res.status(200).json({
      workspaces,
    });
  } catch (error) {
    next(error);
  }
};

const getWorkspace = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const workspace =
      await Workspace.findOne({
        _id: id,
        "members.user":
          req.user._id,
        status: "active",
      }).lean();

    if (!workspace) {
      return res.status(404).json({
        message:
          "Workspace not found",
      });
    }

    return res.status(200).json({
      workspace,
    });
  } catch (error) {
    next(error);
  }
};

const updateWorkspace = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const workspace =
      await Workspace.findOne({
        _id: id,
        owner: req.user._id,
        status: "active",
      });

    if (!workspace) {
      return res.status(404).json({
        message:
          "Workspace not found",
      });
    }

    if (name !== undefined) {
      const trimmedName =
        typeof name === "string"
          ? name.trim()
          : "";

      if (!trimmedName) {
        return res.status(400).json({
          message:
            "Workspace name is required",
        });
      }

      workspace.name =
        trimmedName;
    }

    await workspace.save();

    return res.status(200).json({
      message:
        "Workspace updated successfully",
      workspace,
    });
  } catch (error) {
    next(error);
  }
};

const deleteWorkspace = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const workspace =
      await Workspace.findOneAndUpdate(
        {
          _id: id,
          owner: req.user._id,
          status: "active",
        },
        {
          $set: {
            status: "deleting",
          },
        },
        {
          returnDocument: "after",
        }
      );

    if (!workspace) {
      return res.status(404).json({
        message:
          "Workspace not found",
      });
    }

    const activeExecutions =
      await Execution.find({
        workspace:
          workspace._id,
        status: {
          $in: [
            "pending",
            "running",
          ],
        },
      })
        .select("_id")
        .lean();

    const executionIds =
      activeExecutions.map(
        (execution) =>
          execution._id
      );

    if (executionIds.length > 0) {
      await Execution.updateMany(
        {
          _id: {
            $in: executionIds,
          },
          workspace:
            workspace._id,
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
              "Workspace deleted",
            cancelledAt:
              new Date(),
            finishedAt:
              new Date(),
          },
        }
      );

      for (const executionId of executionIds) {
        cancelExecution(
          executionId
        );
      }
    }

    await WebhookDelivery.deleteMany(
      {
        webhook: {
          $in:
            await Webhook.find({
              workspace:
                workspace._id,
            }).distinct("_id"),
        },
      }
    );

    await Webhook.deleteMany({
      workspace:
        workspace._id,
    });

    await Integration.deleteMany({
      workspace:
        workspace._id,
    });

    await Execution.deleteMany({
      workspace:
        workspace._id,
    });

    await Workflow.deleteMany({
      workspace:
        workspace._id,
    });

    await Workspace.deleteOne({
      _id: workspace._id,
      owner: req.user._id,
      status: "deleting",
    });

    return res.status(200).json({
      message:
        "Workspace deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
};