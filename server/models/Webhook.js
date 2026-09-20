const mongoose = require("mongoose");

const webhookSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    publicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      maxlength: 200,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
      index: true,
    },

    events: {
      type: [String],
      default: [],
    },

    secret: {
      type: String,
      required: true,
      select: false,
      minlength: 32,
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastEventAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

webhookSchema.index({
  workspace: 1,
  createdAt: -1,
});

webhookSchema.index({
  workflow: 1,
  active: 1,
});

const Webhook = mongoose.model(
  "Webhook",
  webhookSchema
);

module.exports = Webhook;