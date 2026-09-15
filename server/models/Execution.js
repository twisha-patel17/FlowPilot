const mongoose = require("mongoose");

const executionSchema = new mongoose.Schema(
  {
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
    },

    workflowSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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

    status: {
      type: String,
      enum: [
        "pending",
        "running",
        "success",
        "failed",
        "cancelled",
      ],
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

    input: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    scheduledAt: {
      type: Date,
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    finishedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    error: {
      type: String,
      default: null,
    },

    attempt: {
      type: Number,
      default: 1,
      min: 1,
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

          attempt: {
            type: Number,
            default: 1,
            min: 1,
          },

          status: {
            type: String,
            enum: [
              "pending",
              "running",
              "success",
              "failed",
            ],
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

executionSchema.index(
  {
    workspace: 1,
    workflow: 1,
    trigger: 1,
    scheduledAt: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      trigger: "schedule",
      scheduledAt: {
        $type: "date",
      },
    },
  }
);

const Execution = mongoose.model(
  "Execution",
  executionSchema
);

module.exports = Execution;