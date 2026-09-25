const mongoose = require("mongoose");

const integrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
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
      index: true,
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
        "connected",
        "disconnected",
      ],
      default: "connected",
      index: true,
    },

    credentials: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      select: false,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

integrationSchema.index({
  workspace: 1,
  createdAt: -1,
});

integrationSchema.index({
  workspace: 1,
  provider: 1,
});

integrationSchema.index({
  workspace: 1,
  status: 1,
});

integrationSchema.index(
  {
    workspace: 1,
    provider: 1,
    name: 1,
  },
  {
    unique: true,
  }
);

const Integration =
  mongoose.model(
    "Integration",
    integrationSchema
  );

module.exports = Integration;