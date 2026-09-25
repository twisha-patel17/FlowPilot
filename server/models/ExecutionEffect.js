const mongoose = require("mongoose");

const executionEffectSchema =
  new mongoose.Schema(
    {
      execution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Execution",
        required: true,
        index: true,
      },

      effectScopeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
      },

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

      workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
        index: true,
      },

      nodeId: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      nodeType: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      idempotencyKey: {
        type: String,
        required: true,
        trim: true,
        maxlength: 128,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "completed",
          "failed",
        ],
        default: "pending",
        index: true,
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

      completedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

executionEffectSchema.index(
  {
    effectScopeId: 1,
    nodeId: 1,
  },
  {
    unique: true,
  }
);

executionEffectSchema.index({
  workspace: 1,
  createdAt: -1,
});

executionEffectSchema.index({
  effectScopeId: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "ExecutionEffect",
  executionEffectSchema
);