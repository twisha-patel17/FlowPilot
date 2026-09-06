const crypto = require("crypto");

const Webhook = require("../models/Webhook");
const WebhookDelivery = require("../models/WebhookDelivery");
const Workflow = require("../models/Workflow");
const Execution = require("../models/Execution");

const executeWorkflow = require("../services/workflow/executeWorkflow");

const createWebhook = async (req, res) => {
  try {
    const { name, workflowId, events } = req.body;

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

    const workflow = await Workflow.findOne({
      _id: workflowId,
      owner: req.user._id,
    });

    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found",
      });
    }

    const publicId = crypto.randomBytes(6).toString("hex");

    const webhook = await Webhook.create({
      name,
      publicId,
      owner: req.user._id,
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
    const webhooks = await Webhook.find({
      owner: req.user._id,
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

    const webhook = await Webhook.findOne({
      _id: id,
      owner: req.user._id,
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

    const webhook = await Webhook.findOne({
      _id: id,
      owner: req.user._id,
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

    const event =
      req.headers["x-webhook-event"] ||
      req.headers["x-github-event"] ||
      req.body?.event ||
      "unknown";

    if (
      webhook.events.length > 0 &&
      event !== "unknown" &&
      !webhook.events.includes(event)
    ) {
      return res.status(400).json({
        message: `Event "${event}" is not configured for this webhook`,
      });
    }

    webhook.lastEventAt = new Date();
    await webhook.save();

    const execution = await Execution.create({
      workflow: webhook.workflow._id,
      owner: webhook.owner,
      status: "pending",
      trigger: "webhook",
    });

    try {
      const completedExecution = await executeWorkflow(
        execution._id
      );

      const duration = Date.now() - startedAt;

      await WebhookDelivery.create({
        webhook: webhook._id,
        event,
        status: "success",
        responseCode: 200,
        duration,
        payload: req.body,
        execution: completedExecution._id,
      });

      return res.status(200).json({
        message: "Webhook received successfully",
        executionId: completedExecution._id,
      });
    } catch (executionError) {
      const duration = Date.now() - startedAt;

      await WebhookDelivery.create({
        webhook: webhook._id,
        event,
        status: "failed",
        responseCode: 500,
        duration,
        payload: req.body,
        execution: execution._id,
        error: executionError.message,
      });

      return res.status(500).json({
        message: "Workflow execution failed",
        error: executionError.message,
      });
    }
  } catch (error) {
    console.error("Receive webhook error:", error);

    return res.status(500).json({
      message: "Webhook processing failed",
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