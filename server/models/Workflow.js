const mongoose = require("mongoose");

const workflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
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
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    edges: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Workflow = mongoose.model("Workflow", workflowSchema);

module.exports = Workflow;