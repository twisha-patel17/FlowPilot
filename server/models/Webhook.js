const mongoose = require("mongoose");

const webhookSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    publicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },

    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
    },

    events: {
      type: [String],
      default: [],
    },

    active: {
      type: Boolean,
      default: true,
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

const Webhook = mongoose.model("Webhook", webhookSchema);

module.exports = Webhook;