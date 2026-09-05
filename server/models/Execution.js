const mongoose = require("mongoose");

const executionSchema = new mongoose.Schema(
  {
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "running", "success", "failed"],
      default: "pending",
    },

    trigger: {
      type: String,
      enum: [
        "manual",
        "webhook",
        "schedule",
        "github",
        "http",
      ],
      default: "manual",
    },

    startedAt: {
      type: Date,
      default: null,
    },

    finishedAt: {
      type: Date,
      default: null,
    },

    error: {
      type: String,
      default: null,
    },

    steps: {
      type: [
        {
          nodeId: {
            type: String,
            default: null,
          },

          type: {
            type: String,
            default: "unknown",
          },

          status: {
            type: String,
            enum: ["pending", "running", "success", "failed"],
            default: "pending",
          },

          input: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
          },

          output: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
          },

          error: {
            type: String,
            default: null,
          },

          duration: {
            type: Number,
            default: 0,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Execution = mongoose.model(
  "Execution",
  executionSchema
);

module.exports = Execution;