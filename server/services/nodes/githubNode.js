const executeGitHubNode = async (
  node,
  input = {},
  context = {}
) => {
  if (context.signal?.aborted) {
    const error = new Error(
      "GitHub node execution was cancelled"
    );

    error.code = "NODE_CANCELLED";

    throw error;
  }

  const config =
    node?.data?.config || {};

  const integrationId =
    config.integrationId ||
    config.connectionId ||
    config.connection ||
    node?.data?.integrationId ||
    node?.data?.connectionId ||
    node?.data?.connection;

  const repository =
    config.repository ||
    node?.data?.repository;

  const event =
    config.event ||
    node?.data?.event ||
    "issues";

  const action =
    config.action ||
    node?.data?.action ||
    "opened";

  if (!integrationId) {
    throw new Error(
      "GitHub connection is required"
    );
  }

  if (!repository) {
    throw new Error(
      "GitHub repository is required"
    );
  }

  return {
    success: true,

    output: {
      ...input,

      github: {
        event,
        action,
        repository,
        integrationId,
      },
    },
  };
};

module.exports = executeGitHubNode;