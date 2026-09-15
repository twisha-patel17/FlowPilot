const crypto = require("crypto");

const Webhook = require("../models/Webhook");
const WebhookDelivery = require("../models/WebhookDelivery");
const Workflow = require("../models/Workflow");
const Execution = require("../models/Execution");
const Workspace = require("../models/Workspace");

const workflowQueue = require("../services/queue/workflowQueue");

const verifyWebhookSignature = (
  req,
  secret
) => {
  if (!secret) {
    return false;
  }

  const signature =
    req.headers[
      "x-flowpilot-signature"
    ] ||
    req.headers[
      "x-hub-signature-256"
    ];

  if (!signature) {
    return false;
  }

  const receivedSignature =
    signature.startsWith("sha256=")
      ? signature.slice(7)
      : signature;

  if (
    !/^[0-9a-fA-F]{64}$/.test(
      receivedSignature
    )
  ) {
    return false;
  }

  const rawBody = req.rawBody;

  if (!rawBody) {
    return false;
  }

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        secret
      )
      .update(rawBody)
      .digest("hex");

  const receivedBuffer =
    Buffer.from(
      receivedSignature,
      "hex"
    );

  const expectedBuffer =
    Buffer.from(
      expectedSignature,
      "hex"
    );

  if (
    receivedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
};

const createWebhook = async (
  req,
  res,
  next
) => {
  try {
    const {
      name,
      workflowId,
      events,
    } = req.body;

    const workspaceId =
      req.headers[
        "x-workspace-id"
      ];

    if (!name) {
      return res.status(400).json({
        message:
          "Webhook name is required",
      });
    }

    if (!workflowId) {
      return res.status(400).json({
        message:
          "Workflow is required",
      });
    }

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        "members.user":
          req.user._id,
      });

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const workflow =
      await Workflow.findOne({
        _id: workflowId,
        owner: req.user._id,
        workspace: workspaceId,
      });

    if (!workflow) {
      return res.status(404).json({
        message:
          "Workflow not found",
      });
    }

    const publicId =
      crypto
        .randomBytes(6)
        .toString("hex");

    const secret =
      crypto
        .randomBytes(32)
        .toString("hex");

    const webhook =
      await Webhook.create({
        name: name.trim(),
        publicId,
        secret,
        owner: req.user._id,
        workspace: workspaceId,
        workflow: workflow._id,
        events: events || [],
        active: true,
      });

    const webhookResponse =
      webhook.toObject();

    delete webhookResponse.secret;

    return res.status(201).json({
      message:
        "Webhook created successfully",

      webhook:
        webhookResponse,

      secret,

      endpoint:
        `/api/webhooks/${publicId}`,
    });
  } catch (error) {
    next(error);
  }
};

const getWebhooks = async (
  req,
  res,
  next
) => {
  try {
    const workspaceId =
      req.headers[
        "x-workspace-id"
      ];

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        "members.user":
          req.user._id,
      });

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const webhooks =
      await Webhook.find({
        owner: req.user._id,
        workspace: workspaceId,
      })
        .select("-secret")
        .populate(
          "workflow",
          "name"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      webhooks,
    });
  } catch (error) {
    next(error);
  }
};

const toggleWebhook = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    const workspaceId =
      req.headers[
        "x-workspace-id"
      ];

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        "members.user":
          req.user._id,
      });

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const webhook =
      await Webhook.findOne({
        _id: id,
        owner: req.user._id,
        workspace: workspaceId,
      }).select("-secret");

    if (!webhook) {
      return res.status(404).json({
        message:
          "Webhook not found",
      });
    }

    webhook.active =
      !webhook.active;

    await webhook.save();

    const webhookResponse =
      webhook.toObject();

    delete webhookResponse.secret;

    return res.status(200).json({
      message:
        "Webhook status updated",

      webhook:
        webhookResponse,
    });
  } catch (error) {
    next(error);
  }
};

const getWebhookDeliveries =
  async (req, res, next) => {
    try {
      const { id } =
        req.params;

      const workspaceId =
        req.headers[
          "x-workspace-id"
        ];

      if (!workspaceId) {
        return res.status(400).json({
          message:
            "Workspace is required",
        });
      }

      const workspace =
        await Workspace.findOne({
          _id: workspaceId,
          "members.user":
            req.user._id,
        });

      if (!workspace) {
        return res.status(403).json({
          message:
            "You do not have access to this workspace",
        });
      }

      const webhook =
        await Webhook.findOne({
          _id: id,
          owner: req.user._id,
          workspace: workspaceId,
        });

      if (!webhook) {
        return res.status(404).json({
          message:
            "Webhook not found",
        });
      }

      const deliveries =
        await WebhookDelivery.find({
          webhook: webhook._id,
        })
          .sort({
            receivedAt: -1,
          });

      return res.status(200).json({
        deliveries,
      });
    } catch (error) {
      next(error);
    }
  };

const receiveWebhook = async (
  req,
  res,
  next
) => {
  const startedAt =
    Date.now();

  try {
    const { publicId } =
      req.params;

    const webhook =
      await Webhook.findOne({
        publicId,
      })
        .select("+secret")
        .populate("workflow");

    if (!webhook) {
      return res.status(404).json({
        message:
          "Webhook not found",
      });
    }

    if (!webhook.active) {
      return res.status(403).json({
        message:
          "Webhook is paused",
      });
    }

    const signatureValid =
      verifyWebhookSignature(
        req,
        webhook.secret
      );

    if (!signatureValid) {
      return res.status(401).json({
        message:
          "Invalid webhook signature",
      });
    }

    if (!webhook.workspace) {
      return res.status(500).json({
        message:
          "Webhook workspace is not configured",
      });
    }

    if (!webhook.workflow) {
      return res.status(500).json({
        message:
          "Webhook workflow not found",
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
      req.headers[
        "x-webhook-event"
      ] ||
      req.headers[
        "x-github-event"
      ] ||
      req.body?.event ||
      "unknown";

    const workflowTrigger =
      webhook.workflow.trigger;

    const isGithubTrigger =
      workflowTrigger?.type ===
      "github";

    if (isGithubTrigger) {
      const githubConfig =
        workflowTrigger.config ||
        {};

      const configuredEvent =
        githubConfig.event ||
        "issues";

      const configuredAction =
        githubConfig.action ||
        "opened";

      if (
        event !==
        configuredEvent
      ) {
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
        receivedAction !==
          configuredAction
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
        req.body?.repository
          ?.full_name;

      if (
        configuredRepository &&
        receivedRepository &&
        configuredRepository !==
          receivedRepository
      ) {
        return res.status(400).json({
          message:
            `GitHub repository "${receivedRepository}" does not match ` +
            `configured repository "${configuredRepository}"`,
        });
      }
    }

    if (
      webhook.events.length >
        0 &&
      event !== "unknown" &&
      !webhook.events.includes(
        event
      )
    ) {
      return res.status(400).json({
        message:
          `Event "${event}" is not configured for this webhook`,
      });
    }

    const deliveryId =
      req.headers[
        "x-webhook-delivery-id"
      ] ||
      req.headers[
        "x-github-delivery"
      ];

    if (!deliveryId) {
      return res.status(400).json({
        message:
          "Webhook delivery ID is required",
      });
    }

    const existingDelivery =
      await WebhookDelivery.findOne({
        webhook: webhook._id,
        deliveryId,
      });

    if (existingDelivery) {
      console.log(
        `Duplicate webhook delivery ignored: ` +
        `${webhook._id} | ` +
        `Delivery: ${deliveryId}`
      );

      return res.status(200).json({
        message:
          "Webhook delivery already processed",

        duplicate: true,

        deliveryId,

        executionId:
          existingDelivery.execution ||
          null,

        status:
          existingDelivery.status,
      });
    }

    webhook.lastEventAt =
      new Date();

    await webhook.save();

    const executionInput =
      req.body || {};

    const workflowSnapshot = {
      _id:
        webhook.workflow._id,

      name:
        webhook.workflow.name,

      description:
        webhook.workflow.description,

      workspace:
        webhook.workflow.workspace,

      trigger:
        webhook.workflow.trigger,

      nodes:
        webhook.workflow.nodes ||
        [],

      edges:
        webhook.workflow.edges ||
        [],
    };

    const execution =
      await Execution.create({
        workflow:
          webhook.workflow._id,

        workflowSnapshot,

        owner:
          webhook.owner,

        workspace:
          webhook.workspace,

        status:
          "pending",

        trigger:
          isGithubTrigger
            ? "github"
            : "webhook",

        input:
          executionInput,
      });

    let webhookDelivery;

    try {
      webhookDelivery =
        await WebhookDelivery.create({
          webhook:
            webhook._id,

          deliveryId,

          event,

          status:
            "queued",

          responseCode:
            200,

          duration:
            Date.now() -
            startedAt,

          payload:
            executionInput,

          execution:
            execution._id,
        });
    } catch (deliveryError) {
     
      if (
        deliveryError.code ===
        11000
      ) {
        await Execution.deleteOne({
          _id:
            execution._id,
        });

        const duplicateDelivery =
          await WebhookDelivery.findOne({
            webhook:
              webhook._id,

            deliveryId,
          });

        console.log(
          `Concurrent duplicate webhook ignored: ` +
          `${webhook._id} | ` +
          `Delivery: ${deliveryId}`
        );

        return res.status(200).json({
          message:
            "Webhook delivery already processed",

          duplicate: true,

          deliveryId,

          executionId:
            duplicateDelivery?.execution ||
            null,

          status:
            duplicateDelivery?.status ||
            "queued",
        });
      }

      await Execution.deleteOne({
        _id:
          execution._id,
      });

      throw deliveryError;
    }

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
        `Webhook workflow queued: ` +
        `${webhook.workflow.name} | ` +
        `Execution: ${execution._id} | ` +
        `Delivery: ${deliveryId} | ` +
        `Job: ${job.id}`
      );

      return res.status(200).json({
        message:
          "Webhook received successfully",

        executionId:
          execution._id,

        deliveryId,
      });
    } catch (queueError) {
      const duration =
        Date.now() -
        startedAt;

      const failedExecution =
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
                queueError.message ||
                "Failed to queue workflow execution",

              finishedAt:
                new Date(),
            },
          },
          {
            new: true,
          }
        );

      webhookDelivery.status =
        "failed";

      webhookDelivery.responseCode =
        500;

      webhookDelivery.duration =
        duration;

      webhookDelivery.error =
        queueError.message ||
        "Failed to queue workflow execution";

      await webhookDelivery.save();

      if (failedExecution) {
        return res.status(500).json({
          message:
            "Failed to queue workflow execution",

          error:
            queueError.message,

          executionId:
            failedExecution._id,

          deliveryId,
        });
      }

      return res.status(500).json({
        message:
          "Failed to queue workflow execution",

        error:
          queueError.message,

        executionId:
          execution._id,

        deliveryId,
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWebhook,
  getWebhooks,
  toggleWebhook,
  getWebhookDeliveries,
  receiveWebhook,
};