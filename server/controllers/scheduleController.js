const Workflow = require("../models/Workflow");
const Workspace = require("../models/Workspace");

const getWorkspace = async (workspaceId, userId) => {
  if (!workspaceId) return null;

  return Workspace.findOne({
    _id: workspaceId,
    "members.user": userId,
  });
};

const getSchedules = async (req, res) => {
  try {
    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await getWorkspace(
      workspaceId,
      req.user._id
    );

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const workflows = await Workflow.find({
      owner: req.user._id,
      workspace: workspaceId,
      "trigger.type": "schedule",
    }).sort({
      createdAt: -1,
    });

    const schedules = workflows.map((workflow) => ({
      _id: workflow._id,
      workflowId: workflow._id,
      workflowName: workflow.name,
      status: workflow.status,
      trigger: workflow.trigger,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    }));

    return res.status(200).json({
      schedules,
    });
  } catch (error) {
    console.error(
      "Get schedules error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await getWorkspace(
      workspaceId,
      req.user._id
    );

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const workflow = await Workflow.findOne({
      _id: id,
      owner: req.user._id,
      workspace: workspaceId,
      "trigger.type": "schedule",
    });

    if (!workflow) {
      return res.status(404).json({
        message: "Schedule not found",
      });
    }

    return res.status(200).json({
      schedule: {
        _id: workflow._id,
        workflowId: workflow._id,
        workflowName: workflow.name,
        status: workflow.status,
        trigger: workflow.trigger,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Get schedule error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await getWorkspace(
      workspaceId,
      req.user._id
    );

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const workflow = await Workflow.findOne({
      _id: id,
      owner: req.user._id,
      workspace: workspaceId,
      "trigger.type": "schedule",
    });

    if (!workflow) {
      return res.status(404).json({
        message: "Schedule not found",
      });
    }

    const {
      frequency,
      time,
      timezone,
    } = req.body;

    if (
      frequency === undefined &&
      time === undefined &&
      timezone === undefined
    ) {
      return res.status(400).json({
        message:
          "At least one schedule field is required",
      });
    }

    if (frequency !== undefined) {
      const allowedFrequencies = [
        "daily",
        "weekday",
        "weekly",
      ];

      if (
        !allowedFrequencies.includes(
          frequency
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid schedule frequency",
        });
      }

      workflow.trigger.config.frequency =
        frequency;
    }

    if (time !== undefined) {
      if (
        typeof time !== "string" ||
        !/^\d{2}:\d{2}$/.test(time)
      ) {
        return res.status(400).json({
          message:
            "Schedule time must use HH:mm format",
        });
      }

      const [hours, minutes] =
        time.split(":").map(Number);

      if (
        hours > 23 ||
        minutes > 59
      ) {
        return res.status(400).json({
          message:
            "Schedule time must be a valid time",
        });
      }

      workflow.trigger.config.time =
        time;
    }

    if (timezone !== undefined) {
      if (
        typeof timezone !== "string" ||
        !timezone.trim()
      ) {
        return res.status(400).json({
          message:
            "Timezone must be a valid string",
        });
      }

      workflow.trigger.config.timezone =
        timezone.trim();
    }

    workflow.markModified(
      "trigger"
    );

    await workflow.save();

    return res.status(200).json({
      message:
        "Schedule updated successfully",
      schedule: {
        _id: workflow._id,
        workflowId: workflow._id,
        workflowName: workflow.name,
        status: workflow.status,
        trigger: workflow.trigger,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Update schedule error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await getWorkspace(
      workspaceId,
      req.user._id
    );

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const workflow = await Workflow.findOne({
      _id: id,
      owner: req.user._id,
      workspace: workspaceId,
      "trigger.type": "schedule",
    });

    if (!workflow) {
      return res.status(404).json({
        message: "Schedule not found",
      });
    }

    workflow.trigger = {
      type: "manual",
      config: {},
    };

    workflow.markModified(
      "trigger"
    );

    await workflow.save();

    return res.status(200).json({
      message:
        "Schedule removed successfully",
    });
  } catch (error) {
    console.error(
      "Delete schedule error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
};