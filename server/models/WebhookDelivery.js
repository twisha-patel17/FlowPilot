const mongoose = require("mongoose");

const webhookDeliverySchema =
  new mongoose.Schema(
    {
      webhook: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Webhook",
        required: true,
        index: true,
      },

      deliveryId: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      event: {
        type: String,
        default: "unknown",
        trim: true,
        maxlength: 200,
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
        index: true,
      },

      responseCode: {
        type: Number,
        default: null,
        min: 100,
        max: 599,
      },

      duration: {
        type: Number,
        default: 0,
        min: 0,
      },

      payload: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },

      error: {
        type: String,
        default: null,
        maxlength: 5000,
      },

      execution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Execution",
        default: null,
        index: true,
      },

      receivedAt: {
        type: Date,
        default: Date.now,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

webhookDeliverySchema.index({
  webhook: 1,
  receivedAt: -1,
});

webhookDeliverySchema.index({
  webhook: 1,
  status: 1,
  receivedAt: -1,
});

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

module.exports = WebhookDelivery;