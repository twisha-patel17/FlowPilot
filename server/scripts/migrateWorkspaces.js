require("dotenv").config();

const mongoose = require("mongoose");

const User = require("../models/User");
const Workspace = require("../models/Workspace");
const Workflow = require("../models/Workflow");
const Execution = require("../models/Execution");
const Webhook = require("../models/Webhook");
const Integration = require("../models/Integration");

const migrateWorkspaces = async () => {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const users = await User.find({});

    console.log(`Found ${users.length} users`);

    let workflowsUpdated = 0;
    let executionsUpdated = 0;
    let webhooksUpdated = 0;
    let integrationsUpdated = 0;

    for (const user of users) {
      console.log(
        `\nProcessing user: ${user.email}`
      );

      // --------------------------------------------------
      // 1. Find or create Personal Space
      // --------------------------------------------------

      let personalSpace =
        await Workspace.findOne({
          owner: user._id,
          name: "Personal Space",
        });

      if (!personalSpace) {
        personalSpace =
          await Workspace.create({
            name: "Personal Space",
            owner: user._id,
            members: [
              {
                user: user._id,
                role: "owner",
              },
            ],
          });

        console.log(
          "Created Personal Space"
        );
      } else {
        console.log(
          "Personal Space already exists"
        );
      }

      // --------------------------------------------------
      // 2. Migrate workflows without workspace
      // --------------------------------------------------

      const workflows =
        await Workflow.find({
          owner: user._id,
          $or: [
            { workspace: { $exists: false } },
            { workspace: null },
          ],
        });

      for (const workflow of workflows) {
        workflow.workspace =
          personalSpace._id;

        await workflow.save();

        workflowsUpdated++;

        console.log(
          `Migrated workflow: ${workflow.name}`
        );
      }

      // --------------------------------------------------
      // 3. Migrate executions without workspace
      // --------------------------------------------------

      const executions =
        await Execution.find({
          owner: user._id,
          $or: [
            { workspace: { $exists: false } },
            { workspace: null },
          ],
        }).populate(
          "workflow",
          "workspace"
        );

      for (const execution of executions) {
        let workspaceId =
          execution.workflow?.workspace;

        if (!workspaceId) {
          workspaceId =
            personalSpace._id;
        }

        execution.workspace =
          workspaceId;

        await execution.save();

        executionsUpdated++;

        console.log(
          `Migrated execution: ${execution._id}`
        );
      }

      // --------------------------------------------------
      // 4. Migrate webhooks without workspace
      // --------------------------------------------------

      const webhooks =
        await Webhook.find({
          owner: user._id,
          $or: [
            { workspace: { $exists: false } },
            { workspace: null },
          ],
        }).populate(
          "workflow",
          "workspace"
        );

      for (const webhook of webhooks) {
        let workspaceId =
          webhook.workflow?.workspace;

        if (!workspaceId) {
          workspaceId =
            personalSpace._id;
        }

        webhook.workspace =
          workspaceId;

        await webhook.save();

        webhooksUpdated++;

        console.log(
          `Migrated webhook: ${webhook.name}`
        );
      }

      // --------------------------------------------------
      // 5. Migrate integrations without workspace
      // --------------------------------------------------

      const integrations =
        await Integration.find({
          owner: user._id,
          $or: [
            { workspace: { $exists: false } },
            { workspace: null },
          ],
        });

      for (const integration of integrations) {
        integration.workspace =
          personalSpace._id;

        await integration.save();

        integrationsUpdated++;

        console.log(
          `Migrated integration: ${integration.name}`
        );
      }
    }

    console.log("\n--------------------------------");
    console.log("Workspace migration completed");
    console.log("--------------------------------");

    console.log(
      `Workflows updated: ${workflowsUpdated}`
    );

    console.log(
      `Executions updated: ${executionsUpdated}`
    );

    console.log(
      `Webhooks updated: ${webhooksUpdated}`
    );

    console.log(
      `Integrations updated: ${integrationsUpdated}`
    );

    console.log("--------------------------------");

    await mongoose.disconnect();

    console.log("MongoDB disconnected");

    process.exit(0);
  } catch (error) {
    console.error(
      "\nWorkspace migration failed:"
    );

    console.error(error);

    await mongoose.disconnect();

    process.exit(1);
  }
};

migrateWorkspaces();