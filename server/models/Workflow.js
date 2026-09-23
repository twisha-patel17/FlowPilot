const mongoose = require("mongoose");

const workflowSchema =
  new mongoose.Schema(
    {
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
        enum: ["active", "inactive"],
        default: "inactive",
        index: true,
      },

      currentVersion: {
        type: Number,
        default: 1,
        min: 1,
      },

      publishedVersion: {
        type: Number,
        default: null,
        min: 1,
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
    },
    {
      timestamps: true,
    }
  );

workflowSchema.index({
  workspace: 1,
  status: 1,
});

workflowSchema.index({
  status: 1,
  "trigger.type": 1,
});

workflowSchema.index({
  workspace: 1,
  currentVersion: 1,
});

const Workflow =
  mongoose.model(
    "Workflow",
    workflowSchema
  );

module.exports = Workflow;