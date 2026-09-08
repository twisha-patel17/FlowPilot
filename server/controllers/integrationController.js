const Integration = require("../models/Integration");
const Workspace = require("../models/Workspace");

const getWorkspace = async (workspaceId, userId) => {
  if (!workspaceId) {
    return null;
  }

  return Workspace.findOne({
    _id: workspaceId,
    "members.user": userId,
  });
};

const createIntegration = async (req, res) => {
  try {
    const {
      name,
      provider,
      credentials,
      metadata,
    } = req.body;

    const workspaceId =
      req.headers["x-workspace-id"];

    if (!name) {
      return res.status(400).json({
        message: "Integration name is required",
      });
    }

    if (!provider) {
      return res.status(400).json({
        message: "Integration provider is required",
      });
    }

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await getWorkspace(
      workspaceId,
      req.user._id
    );

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const integration = await Integration.create({
      name,
      provider,
      owner: req.user._id,
      workspace: workspaceId,
      credentials: credentials || {},
      metadata: metadata || {},
      status: "connected",
    });

    return res.status(201).json({
      message: "Integration created successfully",
      integration,
    });
  } catch (error) {
    console.error(
      "Create integration error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getIntegrations = async (req, res) => {
  try {
    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await getWorkspace(
      workspaceId,
      req.user._id
    );

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const integrations = await Integration.find({
      owner: req.user._id,
      workspace: workspaceId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      integrations,
    });
  } catch (error) {
    console.error(
      "Get integrations error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getIntegration = async (req, res) => {
  try {
    const { id } = req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await getWorkspace(
      workspaceId,
      req.user._id
    );

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const integration = await Integration.findOne({
      _id: id,
      owner: req.user._id,
      workspace: workspaceId,
    });

    if (!integration) {
      return res.status(404).json({
        message: "Integration not found",
      });
    }

    return res.status(200).json({
      integration,
    });
  } catch (error) {
    console.error(
      "Get integration error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const updateIntegration = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      credentials,
      metadata,
    } = req.body;

    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await getWorkspace(
      workspaceId,
      req.user._id
    );

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const integration = await Integration.findOne({
      _id: id,
      owner: req.user._id,
      workspace: workspaceId,
    });

    if (!integration) {
      return res.status(404).json({
        message: "Integration not found",
      });
    }

    if (name !== undefined) {
      integration.name = name;
    }

    if (credentials !== undefined) {
      integration.credentials = credentials;
    }

    if (metadata !== undefined) {
      integration.metadata = metadata;
    }

    await integration.save();

    return res.status(200).json({
      message:
        "Integration updated successfully",
      integration,
    });
  } catch (error) {
    console.error(
      "Update integration error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const toggleIntegration = async (req, res) => {
  try {
    const { id } = req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await getWorkspace(
      workspaceId,
      req.user._id
    );

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const integration = await Integration.findOne({
      _id: id,
      owner: req.user._id,
      workspace: workspaceId,
    });

    if (!integration) {
      return res.status(404).json({
        message: "Integration not found",
      });
    }

    integration.status =
      integration.status === "connected"
        ? "disconnected"
        : "connected";

    await integration.save();

    return res.status(200).json({
      message:
        "Integration status updated",
      integration,
    });
  } catch (error) {
    console.error(
      "Toggle integration error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteIntegration = async (req, res) => {
  try {
    const { id } = req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await getWorkspace(
      workspaceId,
      req.user._id
    );

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const integration =
      await Integration.findOneAndDelete({
        _id: id,
        owner: req.user._id,
        workspace: workspaceId,
      });

    if (!integration) {
      return res.status(404).json({
        message: "Integration not found",
      });
    }

    return res.status(200).json({
      message:
        "Integration deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete integration error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createIntegration,
  getIntegrations,
  getIntegration,
  updateIntegration,
  toggleIntegration,
  deleteIntegration,
};