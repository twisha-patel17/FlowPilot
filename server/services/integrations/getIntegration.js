const Integration = require("../../models/Integration");

const {
  decryptCredentials,
} = require("../../utils/credentialEncryption");

const getIntegration = async ({
  integrationId,
  userId,
  workspaceId,
  provider,
}) => {
  if (!integrationId) {
    throw new Error(
      "Integration is required"
    );
  }

  if (!userId) {
    throw new Error(
      "User is required"
    );
  }

  if (!workspaceId) {
    throw new Error(
      "Workspace is required"
    );
  }

  const query = {
    _id: integrationId,
    owner: userId,
    workspace: workspaceId,
    status: "connected",
  };

  if (provider) {
    query.provider = provider;
  }

  const integration =
    await Integration.findOne(query)
      .select(
        "+credentialsEncrypted"
      );

  if (!integration) {
    throw new Error(
      "Integration not found or disconnected"
    );
  }

  if (
    !integration.credentialsEncrypted
  ) {
    throw new Error(
      "Integration credentials are not configured"
    );
  }

  let credentials;

  try {
    credentials =
      decryptCredentials(
        integration.credentialsEncrypted
      );
  } catch (error) {
    console.error(
      `Failed to decrypt integration credentials: ${integration._id}`,
      error.message
    );

    throw new Error(
      "Integration credentials could not be decrypted"
    );
  }

  return {
    ...integration.toObject(),
    credentials,
  };
};

module.exports = getIntegration;