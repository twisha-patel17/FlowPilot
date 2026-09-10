const crypto = require("crypto");

const Webhook = require("../models/Webhook");
const WebhookDelivery = require("../models/WebhookDelivery");
const Workflow = require("../models/Workflow");
const Execution = require("../models/Execution");
const Workspace = require("../models/Workspace");

const workflowQueue = require("../services/queue/workflowQueue");

const createWebhook = async (req, res) => {
  try {
    const { name, workflowId, events } = req.body;
    const workspaceId = req.headers["x-workspace-id"];

    if (!name) {
      return res.status(400).json({
        message: "Webhook name is required",
      });
    }

    if (!workflowId) {
      return res.status(400).json({
        message: "Workflow is required",
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

    const publicId = crypto.randomBytes(6).toString("hex");

    const webhook = await Webhook.create({
      name: name.trim(),
      publicId,
      owner: req.user._id,
      workspace: workspaceId,
      workflow: workflow._id,
      events: events || [],
      active: true,
    });

    return res.status(201).json({
      message: "Webhook created successfully",
      webhook,
      endpoint: `/api/webhooks/${publicId}`,
    });
  } catch (error) {
    console.error("Create webhook error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getWebhooks = async (req, res) => {
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

    const webhooks = await Webhook.find({
      owner: req.user._id,
      workspace: workspaceId,
    })
      .populate("workflow", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      webhooks,
    });
  } catch (error) {
    console.error("Get webhooks error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const toggleWebhook = async (req, res) => {
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

    const webhook = await Webhook.findOne({
      _id: id,
      owner: req.user._id,
      workspace: workspaceId,
    });

    if (!webhook) {
      return res.status(404).json({
        message: "Webhook not found",
      });
    }

    webhook.active = !webhook.active;

    await webhook.save();

    return res.status(200).json({
      message: "Webhook status updated",
      webhook,
    });
  } catch (error) {
    console.error("Toggle webhook error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getWebhookDeliveries = async (req, res) => {
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

    const webhook = await Webhook.findOne({
      _id: id,
      owner: req.user._id,
      workspace: workspaceId,
    });

    if (!webhook) {
      return res.status(404).json({
        message: "Webhook not found",
      });
    }

    const deliveries = await WebhookDelivery.find({
      webhook: webhook._id,
    }).sort({ receivedAt: -1 });

    return res.status(200).json({
      deliveries,
    });
  } catch (error) {
    console.error("Get webhook deliveries error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const receiveWebhook = async (req, res) => {
  const startedAt = Date.now();

  try {
    const { publicId } = req.params;

    const webhook = await Webhook.findOne({
      publicId,
    }).populate("workflow");

    if (!webhook) {
      return res.status(404).json({
        message: "Webhook not found",
      });
    }

    if (!webhook.active) {
      return res.status(403).json({
        message: "Webhook is paused",
      });
    }

    if (!webhook.workspace) {
      return res.status(500).json({
        message: "Webhook workspace is not configured",
      });
    }

    if (!webhook.workflow) {
      return res.status(500).json({
        message: "Webhook workflow not found",
      });
    }

    if (
      !webhook.workflow.workspace ||
      webhook.workflow.workspace.toString() !==
        webhook.workspace.toString()
    ) {
      return res.status(500).json({
        message:
          "Webhook and workflow belong to different workspaces",
      });
    }

    const event =
      req.headers["x-webhook-event"] ||
      req.headers["x-github-event"] ||
      req.body?.event ||
      "unknown";

    const workflowTrigger =
      webhook.workflow.trigger;

    const isGithubTrigger =
      workflowTrigger?.type === "github";

    if (isGithubTrigger) {
      const githubConfig =
        workflowTrigger.config || {};

      const configuredEvent =
        githubConfig.event || "issues";

      const configuredAction =
        githubConfig.action || "opened";

      if (event !== configuredEvent) {
        return res.status(400).json({
          message:
            `GitHub event "${event}" does not match ` +
            `configured event "${configuredEvent}"`,
        });
      }

      const receivedAction =
        req.body?.action;

      if (
        receivedAction &&
        receivedAction !== configuredAction
      ) {
        return res.status(400).json({
          message:
            `GitHub action "${receivedAction}" does not match ` +
            `configured action "${configuredAction}"`,
        });
      }

      const configuredRepository =
        githubConfig.repository;

      const receivedRepository =
        req.body?.repository?.full_name;

      if (
        configuredRepository &&
        receivedRepository &&
        configuredRepository !== receivedRepository
      ) {
        return res.status(400).json({
          message:
            `GitHub repository "${receivedRepository}" does not match ` +
            `configured repository "${configuredRepository}"`,
        });
      }
    }

    if (
      webhook.events.length > 0 &&
      event !== "unknown" &&
      !webhook.events.includes(event)
    ) {
      return res.status(400).json({
        message:
          `Event "${event}" is not configured for this webhook`,
      });
    }

    webhook.lastEventAt = new Date();

    await webhook.save();

    const execution = await Execution.create({
      workflow: webhook.workflow._id,
      owner: webhook.owner,
      workspace: webhook.workspace,
      status: "pending",
      trigger: isGithubTrigger
        ? "github"
        : "webhook",
      input: req.body || {},
    });

    try {
      const job = await workflowQueue.add(
        "execute-workflow",
        {
          executionId: execution._id.toString(),
        }
      );

      const duration = Date.now() - startedAt;

      await WebhookDelivery.create({
        webhook: webhook._id,
        event,
        status: "success",
        responseCode: 200,
        duration,
        payload: req.body,
        execution: execution._id,
      });

      console.log(
        `Webhook workflow queued: ${webhook.workflow.name} | Execution: ${execution._id} | Job: ${job.id}`
      );

      return res.status(200).json({
        message: "Webhook received successfully",
        executionId: execution._id,
      });
    } catch (queueError) {
      const duration = Date.now() - startedAt;

      await WebhookDelivery.create({
        webhook: webhook._id,
        event,
        status: "failed",
        responseCode: 500,
        duration,
        payload: req.body,
        execution: execution._id,
        error: queueError.message,
      });

      return res.status(500).json({
        message: "Failed to queue workflow execution",
        error: queueError.message,
      });
    }
  } catch (error) {
    console.error(
      "Receive webhook error:",
      error
    );

    return res.status(500).json({
      message:
        "Webhook processing failed",
      error: error.message,
    });
  }
};

module.exports = {
  createWebhook,
  getWebhooks,
  toggleWebhook,
  getWebhookDeliveries,
  receiveWebhook,
};