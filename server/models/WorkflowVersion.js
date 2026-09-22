const mongoose = require("mongoose");

const workflowVersionSchema =
  new mongoose.Schema(
    {
      workflow: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workflow",
        required: true,
        index: true,
      },

      workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
        index: true,
      },

      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      version: {
        type: Number,
        required: true,
        min: 1,
      },

      name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
      },

      description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: "",
      },

      trigger: {
        type: {
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

        config: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },

      nodes: {
        type: [
          mongoose.Schema.Types.Mixed,
        ],
        default: [],
      },

      edges: {
        type: [
          mongoose.Schema.Types.Mixed,
        ],
        default: [],
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

workflowVersionSchema.index(
  {
    workflow: 1,
    version: 1,
  },
  {
    unique: true,
  }
);

workflowVersionSchema.index({
  workspace: 1,
  createdAt: -1,
});

workflowVersionSchema.index({
  workflow: 1,
  createdAt: -1,
});

const WorkflowVersion =
  mongoose.model(
    "WorkflowVersion",
    workflowVersionSchema
  );

module.exports =
  WorkflowVersion;