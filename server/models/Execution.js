const mongoose = require("mongoose");

const executionSchema = new mongoose.Schema(
  {
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
      index: true,
    },

    workflowVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkflowVersion",
      required: true,
      index: true,
    },

    workflowSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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
      index: true,
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
      index: true,
    },

    input: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    scheduledAt: {
      type: Date,
      default: null,
      index: true,
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
      maxlength: 5000,
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
            maxlength: 200,
          },

          type: {
            type: String,
            default: "unknown",
            maxlength: 100,
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
            maxlength: 5000,
          },

          duration: {
            type: Number,
            default: 0,
            min: 0,
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

executionSchema.index({
  workspace: 1,
  createdAt: -1,
});

executionSchema.index({
  workflow: 1,
  createdAt: -1,
});

executionSchema.index({
  workspace: 1,
  status: 1,
  createdAt: -1,
});

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