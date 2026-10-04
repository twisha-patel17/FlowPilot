const {
  testGithubTrigger,
} = require("./githubService");

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

  if (!context.userId) {
    throw new Error(
      "User context is required for GitHub execution"
    );
  }

  if (!context.workspaceId) {
    throw new Error(
      "Workspace context is required for GitHub execution"
    );
  }

  const result =
    await testGithubTrigger({
      integrationId,
      workspaceId:
        context.workspaceId,
      userId:
        context.userId,
      repository,
      event,
      action,
    });

  if (!result?.payload) {
    throw new Error(
      "GitHub did not return a valid event payload"
    );
  }

  return {
    success: true,

    output: {
      ...input,

      github: {
        event:
          result.event,
        action:
          result.action,
        repository:
          result.repository,
        integrationId:
          result.integrationId,
      },

      ...result.payload,
    },
  };
};

module.exports =
  executeGitHubNode;