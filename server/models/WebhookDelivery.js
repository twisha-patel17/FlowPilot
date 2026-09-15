const mongoose = require("mongoose");

const webhookDeliverySchema =
  new mongoose.Schema(
    {
      webhook: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Webhook",
        required: true,
      },

      deliveryId: {
        type: String,
        required: true,
        trim: true,
      },

      event: {
        type: String,
        default: "unknown",
      },

      status: {
        type: String,
        enum: [
          "queued",
          "running",
          "success",
          "failed",
          "cancelled",
        ],
        required: true,
      },

      responseCode: {
        type: Number,
        default: null,
      },

      duration: {
        type: Number,
        default: 0,
      },

      payload: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },

      error: {
        type: String,
        default: null,
      },

      execution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Execution",
        default: null,
      },

      receivedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

webhookDeliverySchema.index(
  {
    webhook: 1,
    deliveryId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      deliveryId: {
        $type: "string",
      },
    },
  }
);

const WebhookDelivery =
  mongoose.model(
    "WebhookDelivery",
    webhookDeliverySchema
  );

module.exports =
  WebhookDelivery;