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

const isValidTime = (time) => {
  if (
    typeof time !== "string" ||
    !/^\d{2}:\d{2}$/.test(time)
  ) {
    return false;
  }

  const [hours, minutes] =
    time.split(":").map(Number);

  return (
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59
  );
};

const validateScheduleConfig = ({
  frequency,
  time,
  timezone,
  days,
}) => {
  if (
    !allowedFrequencies.includes(
      frequency
    )
  ) {
    return "Invalid schedule frequency";
  }

  if (!isValidTime(time)) {
    return "Schedule time must be a valid HH:mm time";
  }

  if (
    typeof timezone !== "string" ||
    !timezone.trim()
  ) {
    return "Timezone must be a valid string";
  }

  const normalizedTimezone =
    timezone.trim();

  if (
    !isValidTimezone(
      normalizedTimezone
    )
  ) {
    return "Invalid IANA timezone";
  }

  if (frequency === "custom") {
    if (
      !Array.isArray(days) ||
      days.length === 0
    ) {
      return "Custom schedules require at least one day";
    }

    const uniqueDays = [
      ...new Set(days),
    ];

    if (
      uniqueDays.length !== days.length
    ) {
      return "Schedule days must be unique";
    }

    const invalidDay =
      days.some(
        (day) =>
          !allowedDays.includes(day)
      );

    if (invalidDay) {
      return "Invalid schedule day";
    }
  }

  if (
    frequency !== "custom" &&
    days !== undefined
  ) {
    return "Schedule days can only be used with custom frequency";
  }

  return null;
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
    status: "active",
  })
    .select("_id")
    .lean();
};

const formatSchedule = (
  workflow
) => ({
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
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      schedules:
        workflows.map(
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
      }).lean();

    if (!workflow) {
      return res.status(404).json({
        message: "Schedule not found",
      });
    }

    return res.status(200).json({
      schedule:
        formatSchedule(workflow),
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

    const currentConfig =
      workflow.trigger?.config || {};

    const nextFrequency =
      frequency !== undefined
        ? frequency
        : currentConfig.frequency;

    const nextTime =
      time !== undefined
        ? time
        : currentConfig.time;

    const nextTimezone =
      timezone !== undefined
        ? timezone.trim()
        : currentConfig.timezone;

    let nextDays;

    if (days !== undefined) {
      nextDays = days;
    } else if (
      nextFrequency === "custom"
    ) {
      nextDays = currentConfig.days;
    } else {
      nextDays = undefined;
    }

    const validationError =
      validateScheduleConfig({
        frequency:
          nextFrequency,
        time: nextTime,
        timezone:
          nextTimezone,
        days: nextDays,
      });

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    const nextConfig = {
      frequency: nextFrequency,
      time: nextTime,
      timezone:
        nextTimezone,
    };

    if (
      nextFrequency === "custom"
    ) {
      nextConfig.days = [
        ...new Set(nextDays),
      ];
    }

    workflow.trigger = {
      type: "schedule",
      config: nextConfig,
    };

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