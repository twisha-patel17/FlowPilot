const crypto = require("crypto");

const Webhook = require("../models/Webhook");
const WebhookDelivery = require("../models/WebhookDelivery");
const Workflow = require("../models/Workflow");
const WorkflowVersion = require("../models/WorkflowVersion");
const Execution = require("../models/Execution");
const Workspace = require("../models/Workspace");

const workflowQueue = require("../services/queue/workflowQueue");

const WEBHOOK_DELIVERY_LIMIT = 100;

const sanitizeWebhook = (webhook) => {
  const data = webhook?.toObject
    ? webhook.toObject()
    : { ...webhook };

  delete data.secret;

  return data;
};

const verifyWebhookSignature = (
  req,
  secret
) => {
  if (!secret) {
    return false;
  }

  const signature =
    req.headers["x-flowpilot-signature"] ||
    req.headers["x-hub-signature-256"];

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
      req.headers["x-workspace-id"];

    const trimmedName =
      typeof name === "string"
        ? name.trim()
        : "";

    if (!trimmedName) {
      return res.status(400).json({
        message:
          "Webhook name is required",
      });
    }

    if (
      trimmedName.length < 2 ||
      trimmedName.length > 100
    ) {
      return res.status(400).json({
        message:
          "Webhook name must be between 2 and 100 characters",
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
        _id: workflowId,
        owner: req.user._id,
        workspace: workspaceId,
        status: "active",
      }).select(
        "_id name workspace status publishedVersion"
      );

    if (!workflow) {
      return res.status(404).json({
        message:
          "Active workflow not found",
      });
    }

    if (!workflow.publishedVersion) {
      return res.status(409).json({
        message:
          "Workflow must have a published version before creating a webhook",
      });
    }

    if (
      events !== undefined &&
      (
        !Array.isArray(events) ||
        events.some(
          (event) =>
            typeof event !== "string" ||
            event.trim().length === 0 ||
            event.length > 200
        )
      )
    ) {
      return res.status(400).json({
        message:
          "Webhook events must be an array of valid event names",
      });
    }

    const normalizedEvents = [
      ...new Set(
        Array.isArray(events)
          ? events.map((event) =>
              event.trim()
            )
          : []
      ),
    ];

    let webhook;

    for (
      let attempt = 0;
      attempt < 3;
      attempt++
    ) {
      const publicId =
        crypto
          .randomBytes(16)
          .toString("hex");

      const secret =
        crypto
          .randomBytes(32)
          .toString("hex");

      try {
        webhook =
          await Webhook.create({
            name: trimmedName,
            publicId,
            secret,
            owner: req.user._id,
            workspace: workspaceId,
            workflow: workflow._id,
            events: normalizedEvents,
            active: true,
          });

        break;
      } catch (error) {
        if (
          error.code !== 11000 ||
          attempt === 2
        ) {
          throw error;
        }
      }
    }

    const webhookResponse =
      sanitizeWebhook(webhook);

    return res.status(201).json({
      message:
        "Webhook created successfully",

      webhook:
        webhookResponse,

      secret:
        webhook.secret,

      endpoint:
        `/api/webhooks/${webhook.publicId}`,
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
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
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

    const webhooks =
      await Webhook.find({
        owner: req.user._id,
        workspace: workspaceId,
      })
        .select("-secret")
        .populate(
          "workflow",
          "name status publishedVersion"
        )
        .sort({
          createdAt: -1,
        })
        .limit(100)
        .lean();

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
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
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

    webhook.active =
      !webhook.active;

    await webhook.save();

    return res.status(200).json({
      message:
        "Webhook status updated",

      webhook:
        sanitizeWebhook(
          webhook
        ),
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
        req.headers["x-workspace-id"];

      if (!workspaceId) {
        return res.status(400).json({
          message:
            "Workspace is required",
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

      const webhook =
        await Webhook.findOne({
          _id: id,
          owner: req.user._id,
          workspace: workspaceId,
        })
          .select("_id")
          .lean();

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
          .select(
            "_id webhook deliveryId event status responseCode duration error execution receivedAt createdAt updatedAt"
          )
          .sort({
            receivedAt: -1,
          })
          .limit(
            WEBHOOK_DELIVERY_LIMIT
          )
          .lean();

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

    if (
      webhook.workflow.status !==
      "active"
    ) {
      return res.status(410).json({
        message:
          "Webhook workflow is no longer active",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: webhook.workspace,
        status: "active",
      })
        .select("_id")
        .lean();

    if (!workspace) {
      return res.status(410).json({
        message:
          "Webhook workspace is no longer active",
      });
    }

    /*
     * Resolve the exact immutable
     * published workflow version.
     *
     * External webhook executions must
     * NEVER execute the current draft.
     */
    const publishedVersion =
      webhook.workflow.publishedVersion;

    if (!publishedVersion) {
      return res.status(410).json({
        message:
          "Webhook workflow has no published version",
      });
    }

    const workflowVersion =
      await WorkflowVersion.findOne({
        workflow:
          webhook.workflow._id,

        workspace:
          webhook.workflow.workspace,

        owner:
          webhook.workflow.owner,

        version:
          publishedVersion,
      }).lean();

    if (!workflowVersion) {
      return res.status(500).json({
        message:
          "Published workflow version not found",
      });
    }

    /*
     * The published version must still
     * represent a webhook-compatible trigger.
     */
    const publishedTriggerType =
      workflowVersion.trigger?.type;

    if (
      !["webhook", "github"].includes(
        publishedTriggerType
      )
    ) {
      return res.status(409).json({
        message:
          "Published workflow version is not configured for webhook execution",
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

    /*
     * Use the immutable published workflow
     * version for trigger validation.
     */
    const workflowTrigger =
      workflowVersion.trigger;

    const isGithubTrigger =
      workflowTrigger?.type ===
      "github";

    /*
     * Make sure the webhook type itself
     * matches the published workflow trigger.
     */
    if (
      webhook.triggerType ===
      "github" &&
      publishedTriggerType !==
        "github"
    ) {
      return res.status(409).json({
        message:
          "Webhook is configured for GitHub but the published workflow trigger is different",
      });
    }

    if (
      webhook.triggerType ===
      "webhook" &&
      publishedTriggerType !==
        "webhook"
    ) {
      return res.status(409).json({
        message:
          "Webhook is configured for generic webhook events but the published workflow trigger is different",
      });
    }

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
      webhook.events.length > 0 &&
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

    if (
      typeof deliveryId !==
        "string" ||
      deliveryId.length > 200
    ) {
      return res.status(400).json({
        message:
          "Invalid webhook delivery ID",
      });
    }

    const existingDelivery =
      await WebhookDelivery.findOne({
        webhook: webhook._id,
        deliveryId,
      })
        .select(
          "execution status deliveryId"
        )
        .lean();

    if (existingDelivery) {
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

    const executionInput =
      req.body || {};

    /*
     * Freeze the exact published workflow
     * version used by this execution.
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
        workflowVersion.nodes ||
        [],

      edges:
        workflowVersion.edges ||
        [],
    };

    const execution =
      await Execution.create({
        workflow:
          webhook.workflow._id,

        workflowVersion:
          workflowVersion._id,

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

        attempt: 1,
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
          })
            .select(
              "execution status"
            )
            .lean();

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

      await Webhook.findOneAndUpdate(
        {
          _id:
            webhook._id,

          active: true,
        },
        {
          $set: {
            lastEventAt:
              new Date(),
          },
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
              "Failed to queue workflow execution",

            finishedAt:
              new Date(),
          },
        }
      );

      await WebhookDelivery.findOneAndUpdate(
        {
          _id:
            webhookDelivery._id,
        },
        {
          $set: {
            status:
              "failed",

            responseCode:
              500,

            duration,

            error:
              "Failed to queue workflow execution",
          },
        }
      );

      console.error(
        "Failed to queue webhook workflow:",
        queueError.message
      );

      return res.status(500).json({
        message:
          "Failed to queue workflow execution",

        deliveryId,

        executionId:
          execution._id,
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