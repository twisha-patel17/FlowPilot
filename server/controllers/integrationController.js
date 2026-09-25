const Integration = require("../models/Integration");
const Workspace = require("../models/Workspace");

const { encryptCredentials } = require("../utils/credentialEncryption");
const { credentialsByProvider } = require("../validators/integrationValidator");

const getWorkspace = async (
  workspaceId,
  userId
) => {
  if (!workspaceId) {
    return null;
  }

  return Workspace.findOne({
    _id: workspaceId,

    "members.user": userId,

    status: "active",
  }).select("_id");
};

const sanitizeIntegration = (
  integration
) => {
  const data =
    integration?.toObject
      ? integration.toObject()
      : {
          ...integration,
        };

  delete data.credentials;
  delete data.credentialsEncrypted;

  return data;
};


const validateProviderCredentials = (
  provider,
  credentials
) => {
  const schema =
    credentialsByProvider[provider];

  if (!schema) {
    return {
      error:
        "Unsupported integration provider",
    };
  }

  const {
    error,
    value,
  } = schema.validate(
    credentials
  );

  if (error) {
    return {
      error:
        error.details?.[0]?.message ||
        "Invalid integration credentials",
    };
  }

  return {
    value,
  };
};

const createIntegration = async (
  req,
  res,
  next
) => {
  try {
    const {
      name,
      provider,
      credentials,
      metadata,
    } = req.body;

    const workspaceId =
      req.headers[
        "x-workspace-id"
      ];

    if (!name) {
      return res.status(400).json({
        message:
          "Integration name is required",
      });
    }

    if (!provider) {
      return res.status(400).json({
        message:
          "Integration provider is required",
      });
    }

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    if (
      credentials ===
        undefined ||
      credentials === null
    ) {
      return res.status(400).json({
        message:
          "Integration credentials are required",
      });
    }

    const workspace =
      await getWorkspace(
        workspaceId,
        req.user._id
      );

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const validation =
      validateProviderCredentials(
        provider,
        credentials
      );

    if (validation.error) {
      return res.status(400).json({
        message:
          validation.error,
      });
    }
    const encryptedCredentials =
      encryptCredentials(
        validation.value
      );

    const integration =
      await Integration.create({
        name,
        provider,

        owner:
          req.user._id,

        workspace:
          workspaceId,

        credentials:
          encryptedCredentials,

        metadata:
          metadata || {},

        status:
          "connected",
      });

    return res.status(201).json({
      message:
        "Integration created successfully",

      integration:
        sanitizeIntegration(
          integration
        ),
    });
  } catch (error) {
   
    if (
      error?.code === 11000
    ) {
      return res.status(409).json({
        message:
          "An integration with this name already exists for this provider in this workspace",
      });
    }

    next(error);
  }
};

const getIntegrations = async (
  req,
  res,
  next
) => {
  try {
    const workspaceId =
      req.headers[
        "x-workspace-id"
      ];

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await getWorkspace(
        workspaceId,
        req.user._id
      );

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const integrations =
      await Integration.find({
        owner:
          req.user._id,

        workspace:
          workspaceId,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      integrations:
        integrations.map(
          sanitizeIntegration
        ),
    });
  } catch (error) {
    next(error);
  }
};

const getIntegration = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    const workspaceId =
      req.headers[
        "x-workspace-id"
      ];

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await getWorkspace(
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
      await Integration.findOne({
        _id: id,

        owner:
          req.user._id,

        workspace:
          workspaceId,
      }).lean();

    if (!integration) {
      return res.status(404).json({
        message:
          "Integration not found",
      });
    }

    return res.status(200).json({
      integration:
        sanitizeIntegration(
          integration
        ),
    });
  } catch (error) {
    next(error);
  }
};

const updateIntegration = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    const {
      name,
      credentials,
      metadata,
    } = req.body;

    const workspaceId =
      req.headers[
        "x-workspace-id"
      ];

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await getWorkspace(
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
      await Integration.findOne({
        _id: id,

        owner:
          req.user._id,

        workspace:
          workspaceId,
      });

    if (!integration) {
      return res.status(404).json({
        message:
          "Integration not found",
      });
    }

    if (
      name !== undefined
    ) {
      integration.name =
        name;
    }
    if (
      credentials !== undefined
    ) {
      const validation =
        validateProviderCredentials(
          integration.provider,
          credentials
        );

      if (validation.error) {
        return res.status(400).json({
          message:
            validation.error,
        });
      }

      integration.credentials =
        encryptCredentials(
          validation.value
        );
    }

    if (
      metadata !== undefined
    ) {
      integration.metadata =
        metadata;
    }

    await integration.save();

    return res.status(200).json({
      message:
        "Integration updated successfully",

      integration:
        sanitizeIntegration(
          integration
        ),
    });
  } catch (error) {
    if (
      error?.code === 11000
    ) {
      return res.status(409).json({
        message:
          "An integration with this name already exists for this provider in this workspace",
      });
    }

    next(error);
  }
};

const toggleIntegration = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    const workspaceId =
      req.headers[
        "x-workspace-id"
      ];

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await getWorkspace(
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
      await Integration.findOne({
        _id: id,

        owner:
          req.user._id,

        workspace:
          workspaceId,
      });

    if (!integration) {
      return res.status(404).json({
        message:
          "Integration not found",
      });
    }

    integration.status =
      integration.status ===
      "connected"
        ? "disconnected"
        : "connected";

    await integration.save();

    return res.status(200).json({
      message:
        "Integration status updated",

      integration:
        sanitizeIntegration(
          integration
        ),
    });
  } catch (error) {
    next(error);
  }
};

const deleteIntegration = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    const workspaceId =
      req.headers[
        "x-workspace-id"
      ];

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await getWorkspace(
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

        owner:
          req.user._id,

        workspace:
          workspaceId,
      });

    if (!integration) {
      return res.status(404).json({
        message:
          "Integration not found",
      });
    }

    return res.status(200).json({
      message:
        "Integration deleted successfully",
    });
  } catch (error) {
    next(error);
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