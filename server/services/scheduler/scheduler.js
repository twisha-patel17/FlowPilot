const cron = require("node-cron");
const crypto = require("crypto");

const Workflow = require("../../models/Workflow");
const WorkflowVersion = require("../../models/WorkflowVersion");
const Execution = require("../../models/Execution");
const Workspace = require("../../models/Workspace");

const workflowQueue = require("../queue/workflowQueue");
const redisConnection = require("../../config/redis");

const DEFAULT_TIMEZONE = "Asia/Kolkata";

const SCHEDULER_LOCK_KEY =
  "flowpilot:scheduler:lock";

const SCHEDULER_LOCK_TTL = 55 * 1000;

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

const getLocalDateParts = (
  date,
  timezone
) => {
  const formatter = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }
  );

  const parts =
    formatter.formatToParts(date);

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    weekday: values.weekday,
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
};

const getScheduledAt = (
  date,
  timezone,
  scheduledTime
) => {
  const local =
    getLocalDateParts(
      date,
      timezone
    );

  const [
    hours,
    minutes,
  ] = scheduledTime
    .split(":")
    .map(Number);

  const utcGuess = new Date(
    Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      hours,
      minutes,
      0,
      0
    )
  );

  const offsetFormatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: timezone,
        timeZoneName: "longOffset",
      }
    );

  const offsetParts =
    offsetFormatter.formatToParts(
      utcGuess
    );

  const offsetPart =
    offsetParts.find(
      (part) =>
        part.type === "timeZoneName"
    );

  const offset =
    offsetPart?.value || "GMT";

  const match = offset.match(
    /GMT([+-])(\d{2}):?(\d{2})?/
  );

  if (!match) {
    return utcGuess;
  }

  const sign =
    match[1] === "+"
      ? 1
      : -1;

  const offsetHours =
    Number(match[2]);

  const offsetMinutes =
    Number(match[3] || 0);

  const offsetMilliseconds =
    sign *
    (
      offsetHours * 60 +
      offsetMinutes
    ) *
    60 *
    1000;

  return new Date(
    utcGuess.getTime() -
      offsetMilliseconds
  );
};

const shouldRunSchedule = (
  workflow,
  now
) => {
  const config =
    workflow.trigger?.config || {};

  const frequency =
    config.frequency;

  const scheduledTime =
    config.time;

  const timezone =
    config.timezone ||
    DEFAULT_TIMEZONE;

  if (
    !frequency ||
    !scheduledTime
  ) {
    return false;
  }

  if (
    !isValidTimezone(timezone)
  ) {
    console.error(
      `Invalid timezone "${timezone}" ` +
      `for workflow ${workflow._id}`
    );

    return false;
  }

  const local =
    getLocalDateParts(
      now,
      timezone
    );

  const currentTime =
    `${String(local.hour).padStart(2, "0")}:` +
    `${String(local.minute).padStart(2, "0")}`;

  if (
    currentTime !==
    scheduledTime
  ) {
    return false;
  }

  if (
    frequency === "weekday" &&
    ["Sat", "Sun"].includes(
      local.weekday
    )
  ) {
    return false;
  }

  if (
    frequency === "weekly" &&
    local.weekday !== "Mon"
  ) {
    return false;
  }

  if (
    frequency === "custom"
  ) {
    const days =
      Array.isArray(config.days)
        ? config.days
        : [];

    if (days.length === 0) {
      return false;
    }

    if (
      !days.includes(
        local.weekday
      )
    ) {
      return false;
    }
  }

  return true;
};

const isWorkspaceActive = async (
  workspaceId
) => {
  const workspace =
    await Workspace.findOne({
      _id: workspaceId,
      status: "active",
    })
      .select("_id")
      .lean();

  return Boolean(workspace);
};

const createScheduledExecution =
  async (
    workflow,
    scheduledAt
  ) => {
  
    const workspaceActive =
      await isWorkspaceActive(
        workflow.workspace
      );

    if (!workspaceActive) {
      console.log(
        `Scheduled execution skipped: ` +
        `workspace is not active | ` +
        `Workflow: ${workflow.name}`
      );

      return null;
    }

    const workflowVersion =
      await WorkflowVersion.findOne({
        workflow:
          workflow._id,

        workspace:
          workflow.workspace,

        version:
          workflow.currentVersion,
      }).lean();

    if (!workflowVersion) {
      console.error(
        `Scheduled execution skipped: ` +
        `workflow version ${workflow.currentVersion} ` +
        `not found | ` +
        `Workflow: ${workflow.name}`
      );

      return null;
    }

    /*
     * Freeze the exact workflow configuration used
     * by this execution.
     */
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
        workflowVersion.nodes || [],

      edges:
        workflowVersion.edges || [],
    };

    try {
      const execution =
        await Execution.create({
          workflow:
            workflow._id,

          workflowVersion:
            workflowVersion._id,

          workflowSnapshot,

          owner:
            workflow.owner,

          workspace:
            workflow.workspace,

          status:
            "pending",

          trigger:
            "schedule",

          scheduledAt,

          input: {},

          attempt: 1,
        });

      return execution;
    } catch (error) {
      if (
        error.code === 11000
      ) {
        console.log(
          `Duplicate scheduled execution skipped: ` +
          `${workflow.name} | ` +
          `${scheduledAt.toISOString()}`
        );

        return null;
      }

      throw error;
    }
  };

const queueScheduledExecution =
  async (
    execution,
    workflow
  ) => {
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
        `Scheduled workflow queued: ` +
        `${workflow.name} | ` +
        `Execution: ${execution._id} | ` +
        `Job: ${job.id}`
      );

      return job;
    } catch (error) {
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

            error:
              error.message ||
              "Failed to queue scheduled workflow",

            finishedAt:
              new Date(),
          },
        }
      );

      console.error(
        `Failed to queue scheduled workflow: ` +
        `${workflow.name}`,
        error.message
      );

      return null;
    }
  };

const processWorkflow =
  async (
    workflow,
    now
  ) => {
    try {
      const workspaceActive =
        await isWorkspaceActive(
          workflow.workspace
        );

      if (!workspaceActive) {
        console.log(
          `Scheduled workflow skipped: ` +
          `workspace is not active | ` +
          `Workflow: ${workflow.name}`
        );

        return;
      }

      const config =
        workflow.trigger?.config ||
        {};

      const timezone =
        config.timezone ||
        DEFAULT_TIMEZONE;

      const scheduledTime =
        config.time;

      if (!scheduledTime) {
        return;
      }

      if (
        !shouldRunSchedule(
          workflow,
          now
        )
      ) {
        return;
      }

      const scheduledAt =
        getScheduledAt(
          now,
          timezone,
          scheduledTime
        );

      scheduledAt.setSeconds(
        0,
        0
      );

      const execution =
        await createScheduledExecution(
          workflow,
          scheduledAt
        );

      if (!execution) {
        return;
      }

      await queueScheduledExecution(
        execution,
        workflow
      );
    } catch (error) {
      console.error(
        `Scheduler workflow error ` +
        `(${workflow.name}):`,
        error
      );
    }
  };

const acquireSchedulerLock =
  async () => {
    const lockToken =
      crypto.randomUUID();

    try {
      const result =
        await redisConnection.set(
          SCHEDULER_LOCK_KEY,
          lockToken,
          "PX",
          SCHEDULER_LOCK_TTL,
          "NX"
        );

      if (result !== "OK") {
        return null;
      }

      return lockToken;
    } catch (error) {
      console.error(
        "Failed to acquire scheduler lock:",
        error.message
      );

      return null;
    }
  };

const releaseSchedulerLock =
  async (lockToken) => {
    if (!lockToken) {
      return;
    }

    const releaseScript = `
      if redis.call("GET", KEYS[1]) == ARGV[1]
      then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;

    try {
      await redisConnection.eval(
        releaseScript,
        1,
        SCHEDULER_LOCK_KEY,
        lockToken
      );
    } catch (error) {
      console.error(
        "Failed to release scheduler lock:",
        error.message
      );
    }
  };

const runSchedulerTick =
  async () => {
    const lockToken =
      await acquireSchedulerLock();

    if (!lockToken) {
      console.log(
        "Scheduler tick skipped: another instance owns the lock"
      );

      return;
    }

    try {
      const now = new Date();

      const activeWorkspaces =
        await Workspace.find({
          status: "active",
        })
          .select("_id")
          .lean();

      if (!activeWorkspaces.length) {
        return;
      }

      const workspaceIds =
        activeWorkspaces.map(
          (workspace) =>
            workspace._id
        );

      const workflows =
        await Workflow.find({
          status: "active",

          "trigger.type":
            "schedule",

          workspace: {
            $in: workspaceIds,
          },
        });

      if (!workflows.length) {
        return;
      }

      console.log(
        `Checking ${workflows.length} scheduled workflows`
      );

      await Promise.all(
        workflows.map(
          (workflow) =>
            processWorkflow(
              workflow,
              now
            )
        )
      );
    } catch (error) {
      console.error(
        "Scheduler error:",
        error
      );
    } finally {
      await releaseSchedulerLock(
        lockToken
      );
    }
  };

let schedulerTask = null;

const startScheduler = () => {
  if (schedulerTask) {
    console.log(
      "Scheduler already running"
    );

    return;
  }

  console.log(
    "Scheduler started"
  );

  schedulerTask =
    cron.schedule(
      "* * * * *",
      runSchedulerTick,
      {
        timezone:
          DEFAULT_TIMEZONE,
      }
    );
};

const stopScheduler = () => {
  if (!schedulerTask) {
    return;
  }

  schedulerTask.stop();
  schedulerTask = null;

  console.log(
    "Scheduler stopped"
  );
};

module.exports = {
  startScheduler,
  stopScheduler,
};