const Integration = require("../models/Integration");

const createIntegration = async (req, res) => {
  try {
    const {
      name,
      provider,
      credentials,
      metadata,
    } = req.body;

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

    const integration = await Integration.create({
      name,
      provider,
      owner: req.user._id,
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
    const integrations = await Integration.find({
      owner: req.user._id,
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

    const integration = await Integration.findOne({
      _id: id,
      owner: req.user._id,
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

    const integration = await Integration.findOne({
      _id: id,
      owner: req.user._id,
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
      message: "Integration updated successfully",
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

    const integration = await Integration.findOne({
      _id: id,
      owner: req.user._id,
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
      message: "Integration status updated",
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

    const integration =
      await Integration.findOneAndDelete({
        _id: id,
        owner: req.user._id,
      });

    if (!integration) {
      return res.status(404).json({
        message: "Integration not found",
      });
    }

    return res.status(200).json({
      message: "Integration deleted successfully",
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