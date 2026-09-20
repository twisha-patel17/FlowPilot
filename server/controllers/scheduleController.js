const Workflow = require("../models/Workflow");
const Workspace = require("../models/Workspace");

const allowedFrequencies = [
  "daily",
  "weekday",
  "weekly",
  "custom",
];

const allowedDays = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

const isValidTimezone = (timezone) => {
  try {
    Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });

    return true;
  } catch {
    return false;
  }
};

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
  });
};

const formatSchedule = (workflow) => ({
  _id: workflow._id,
  workflowId: workflow._id,
  workflowName: workflow.name,
  status: workflow.status,
  trigger: workflow.trigger,
  createdAt: workflow.createdAt,
  updatedAt: workflow.updatedAt,
});

const getSchedules = async (
  req,
  res,
  next
) => {
  try {
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

    const workflows =
      await Workflow.find({
        owner: req.user._id,
        workspace: workspaceId,
        "trigger.type": "schedule",
      }).sort({
        createdAt: -1,
      });

    return res.status(200).json({
      schedules: workflows.map(
        formatSchedule
      ),
    });
  } catch (error) {
    next(error);
  }
};

const getSchedule = async (
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

    const workflow =
      await Workflow.findOne({
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
      schedule: formatSchedule(
        workflow
      ),
    });
  } catch (error) {
    next(error);
  }
};

const updateSchedule = async (
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

    const workflow =
      await Workflow.findOne({
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
      days,
    } = req.body;

    if (
      frequency === undefined &&
      time === undefined &&
      timezone === undefined &&
      days === undefined
    ) {
      return res.status(400).json({
        message:
          "At least one schedule field is required",
      });
    }

    const currentConfig =
      workflow.trigger?.config || {};

    const nextFrequency =
      frequency !== undefined
        ? frequency
        : currentConfig.frequency;

    const nextDays =
      days !== undefined
        ? days
        : currentConfig.days;

    /*
     * Frequency
     */
    if (frequency !== undefined) {
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

    /*
     * Days
     */
    if (days !== undefined) {
      if (
        !Array.isArray(days) ||
        days.length === 0
      ) {
        return res.status(400).json({
          message:
            "At least one schedule day is required",
        });
      }

      const invalidDay =
        days.some(
          (day) =>
            !allowedDays.includes(day)
        );

      if (invalidDay) {
        return res.status(400).json({
          message:
            "Invalid schedule day",
        });
      }

      const uniqueDays = [
        ...new Set(days),
      ];

      if (
        uniqueDays.length !==
        days.length
      ) {
        return res.status(400).json({
          message:
            "Schedule days must be unique",
        });
      }

      if (
        nextFrequency !== "custom"
      ) {
        return res.status(400).json({
          message:
            "Schedule days can only be used with custom frequency",
        });
      }

      workflow.trigger.config.days =
        uniqueDays;
    }

    /*
     * Custom frequency requires
     * at least one selected day.
     */
    if (
      nextFrequency === "custom" &&
      (!Array.isArray(nextDays) ||
        nextDays.length === 0)
    ) {
      return res.status(400).json({
        message:
          "Custom schedules require at least one day",
      });
    }

    /*
     * Non-custom schedules should
     * not retain custom days.
     */
    if (
      nextFrequency !== "custom"
    ) {
      delete workflow.trigger.config
        .days;
    }

    /*
     * Time
     */
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

    /*
     * Timezone
     */
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

      const normalizedTimezone =
        timezone.trim();

      if (
        !isValidTimezone(
          normalizedTimezone
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid IANA timezone",
        });
      }

      workflow.trigger.config.timezone =
        normalizedTimezone;
    }

    workflow.markModified(
      "trigger"
    );

    await workflow.save();

    return res.status(200).json({
      message:
        "Schedule updated successfully",

      schedule:
        formatSchedule(workflow),
    });
  } catch (error) {
    next(error);
  }
};

const deleteSchedule = async (
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

    const workflow =
      await Workflow.findOne({
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
    next(error);
  }
};

module.exports = {
  getSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
};