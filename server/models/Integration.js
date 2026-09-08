const mongoose = require("mongoose");

const integrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    provider: {
      type: String,
      required: true,
      enum: [
        "github",
        "discord",
        "email",
        "mongodb",
        "http",
      ],
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
      enum: ["connected", "disconnected"],
      default: "connected",
    },

    credentials: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Integration = mongoose.model(
  "Integration",
  integrationSchema
);

module.exports = Integration;