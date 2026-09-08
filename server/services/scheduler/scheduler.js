const cron = require("node-cron");

const Workflow = require("../../models/Workflow");
const Execution = require("../../models/Execution");
const executeWorkflow = require("../workflow/executeWorkflow");

const startScheduler = () => {
  console.log("Scheduler started");

  cron.schedule("* * * * *", async () => {
    try {
      const workflows = await Workflow.find({
        status: "active",
        "trigger.type": "schedule",
      });

      if (workflows.length === 0) {
        return;
      }

      for (const workflow of workflows) {
        try {
          const config = workflow.trigger?.config || {};

          const frequency = config.frequency;
          const scheduledTime = config.time;
          const timezone =
            config.timezone || "Asia/Kolkata";

          if (!scheduledTime) {
            continue;
          }

          const now = new Date();

          const currentTime = now.toLocaleTimeString(
            "en-GB",
            {
              timeZone: timezone,
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }
          );

          if (currentTime !== scheduledTime) {
            continue;
          }

          const currentDay = now.toLocaleDateString(
            "en-US",
            {
              timeZone: timezone,
              weekday: "short",
            }
          );

          if (
            frequency === "weekday" &&
            ["Sat", "Sun"].includes(currentDay)
          ) {
            continue;
          }

          if (
            frequency === "weekly" &&
            currentDay !== "Mon"
          ) {
            continue;
          }

          const scheduledAt = new Date(now);
          scheduledAt.setSeconds(0, 0);

          const existingExecution =
            await Execution.findOne({
              workflow: workflow._id,
              trigger: "schedule",
              scheduledAt,
            });

          if (existingExecution) {
            continue;
          }

          console.log(
            `Running scheduled workflow: ${workflow.name}`
          );

          let execution;

          try {
            execution = await Execution.create({
              workflow: workflow._id,
              owner: workflow.owner,
              status: "pending",
              trigger: "schedule",
              scheduledAt,
            });
          } catch (error) {
            if (error.code === 11000) {
              console.log(
                `Duplicate scheduled execution skipped: ${workflow.name}`
              );

              continue;
            }

            throw error;
          }

          try {
            await executeWorkflow(execution._id);

            console.log(
              `Scheduled workflow completed: ${workflow.name}`
            );
          } catch (error) {
            console.error(
              `Scheduled workflow failed: ${workflow.name}`,
              error.message
            );
          }
        } catch (error) {
          console.error(
            `Scheduler workflow error (${workflow.name}):`,
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "Scheduler error:",
        error
      );
    }
  });
};

module.exports = startScheduler;