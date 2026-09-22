const mongoose = require("mongoose");
require("dotenv").config();

const Workflow = require("../models/Workflow");
const WorkflowVersion = require("../models/WorkflowVersion");

const backfillWorkflowVersions = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is not configured"
      );
    }

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "MongoDB connected"
    );

    const workflows =
      await Workflow.find({});

    console.log(
      `Found ${workflows.length} workflows`
    );

    let created = 0;
    let skipped = 0;

    for (const workflow of workflows) {
      const existingVersion =
        await WorkflowVersion.findOne({
          workflow:
            workflow._id,

          version:
            workflow.currentVersion || 1,
        });

      if (existingVersion) {
        skipped++;
        continue;
      }

      await WorkflowVersion.create({
        workflow:
          workflow._id,

        workspace:
          workflow.workspace,

        owner:
          workflow.owner,

        version:
          workflow.currentVersion || 1,

        name:
          workflow.name,

        description:
          workflow.description || "",

        trigger:
          workflow.trigger,

        nodes:
          workflow.nodes || [],

        edges:
          workflow.edges || [],

        createdBy:
          workflow.owner,
      });

      created++;

      console.log(
        `Created version ${
          workflow.currentVersion || 1
        } for workflow ${workflow._id}`
      );
    }

    console.log(
      `Backfill complete. Created: ${created}, Skipped: ${skipped}`
    );
  } catch (error) {
    console.error(
      "Workflow version backfill failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();

    console.log(
      "MongoDB connection closed"
    );
  }
};

backfillWorkflowVersions();