const Integration = require("../models/Integration");

const {
  decryptCredentials,
} = require("../utils/encryption");

const getGithubHeaders = (token) => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
});

const githubRequest = async (url, token) => {
  const response = await fetch(url, {
    method: "GET",
    headers: getGithubHeaders(token),
  });

  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      `GitHub API request failed with status ${response.status}`;

    const error = new Error(message);

    error.statusCode = response.status;

    throw error;
  }

  return data;
};

const getGithubIntegration = async ({
  integrationId,
  workspaceId,
  userId,
}) => {
  const integration =
    await Integration.findOne({
      _id: integrationId,
      provider: "github",
      workspace: workspaceId,
      owner: userId,
      connected: true,
    });

  if (!integration) {
    const error = new Error(
      "Connected GitHub integration not found"
    );

    error.statusCode = 404;

    throw error;
  }

  const encryptedCredentials =
    integration.credentialsEncrypted ||
    integration.credentials;

  if (!encryptedCredentials) {
    const error = new Error(
      "GitHub credentials are not configured"
    );

    error.statusCode = 400;

    throw error;
  }

  const credentials =
    decryptCredentials(
      encryptedCredentials
    );

  if (!credentials?.token) {
    const error = new Error(
      "GitHub token is missing"
    );

    error.statusCode = 400;

    throw error;
  }

  return {
    integration,
    token: credentials.token,
  };
};

const validateRepository = (
  repository
) => {
  if (
    typeof repository !== "string" ||
    !repository.trim()
  ) {
    const error = new Error(
      "Repository is required"
    );

    error.statusCode = 400;

    throw error;
  }

  const value = repository.trim();

  const parts = value.split("/");

  if (
    parts.length !== 2 ||
    !parts[0] ||
    !parts[1]
  ) {
    const error = new Error(
      "Repository must be in owner/repository format"
    );

    error.statusCode = 400;

    throw error;
  }

  return {
    owner: parts[0],
    repo: parts[1],
  };
};

const buildIssuePayload = ({
  issue,
  repository,
  action,
}) => ({
  event: "issues",
  action,
  issue: {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body: issue.body,
    state: issue.state,
    labels: issue.labels || [],
    user: issue.user
      ? {
          login: issue.user.login,
          id: issue.user.id,
        }
      : null,
    html_url: issue.html_url,
  },
  repository: {
    id: repository.id,
    name: repository.name,
    full_name:
      repository.full_name,
    html_url: repository.html_url,
  },
});

const buildPullRequestPayload = ({
  pullRequest,
  repository,
  action,
}) => ({
  event: "pull_request",
  action,
  pull_request: {
    id: pullRequest.id,
    number: pullRequest.number,
    title: pullRequest.title,
    body: pullRequest.body,
    state: pullRequest.state,
    merged: pullRequest.merged,
    user: pullRequest.user
      ? {
          login:
            pullRequest.user.login,
          id: pullRequest.user.id,
        }
      : null,
    html_url:
      pullRequest.html_url,
  },
  repository: {
    id: repository.id,
    name: repository.name,
    full_name:
      repository.full_name,
    html_url:
      repository.html_url,
  },
});

const buildPushPayload = ({
  commit,
  repository,
  action,
}) => ({
  event: "push",
  action,
  after: commit.sha,
  head_commit: {
    id: commit.sha,
    message:
      commit.commit?.message || "",
    author:
      commit.commit?.author || null,
    url: commit.html_url,
  },
  repository: {
    id: repository.id,
    name: repository.name,
    full_name:
      repository.full_name,
    html_url: repository.html_url,
  },
});

const buildReleasePayload = ({
  release,
  repository,
  action,
}) => ({
  event: "release",
  action,
  release: {
    id: release.id,
    name: release.name,
    tag_name: release.tag_name,
    body: release.body,
    draft: release.draft,
    prerelease: release.prerelease,
    html_url: release.html_url,
  },
  repository: {
    id: repository.id,
    name: repository.name,
    full_name:
      repository.full_name,
    html_url: repository.html_url,
  },
});

const testGithubTrigger = async ({
  integrationId,
  workspaceId,
  userId,
  repository,
  event,
  action,
}) => {
  const {
    token,
  } = await getGithubIntegration({
    integrationId,
    workspaceId,
    userId,
  });

  const {
    owner,
    repo,
  } = validateRepository(repository);

  const encodedOwner =
    encodeURIComponent(owner);

  const encodedRepo =
    encodeURIComponent(repo);

  const baseUrl =
    `https://api.github.com/repos/${encodedOwner}/${encodedRepo}`;

  const repositoryData =
    await githubRequest(
      baseUrl,
      token
    );

  switch (event) {
    case "issues": {
      const issues =
        await githubRequest(
          `${baseUrl}/issues?state=all&per_page=10`,
          token
        );

      const issue = issues.find(
        (item) => !item.pull_request
      );

      if (!issue) {
        const error = new Error(
          "No GitHub issue found in this repository"
        );

        error.statusCode = 404;

        throw error;
      }

      return buildIssuePayload({
        issue,
        repository: repositoryData,
        action,
      });
    }

    case "pull_request": {
      const pullRequests =
        await githubRequest(
          `${baseUrl}/pulls?state=all&per_page=10`,
          token
        );

      const pullRequest =
        pullRequests[0];

      if (!pullRequest) {
        const error = new Error(
          "No pull request found in this repository"
        );

        error.statusCode = 404;

        throw error;
      }

      return buildPullRequestPayload({
        pullRequest,
        repository:
          repositoryData,
        action,
      });
    }

    case "push": {
      const commits =
        await githubRequest(
          `${baseUrl}/commits?per_page=1`,
          token
        );

      const commit = commits[0];

      if (!commit) {
        const error = new Error(
          "No commit found in this repository"
        );

        error.statusCode = 404;

        throw error;
      }

      return buildPushPayload({
        commit,
        repository:
          repositoryData,
        action,
      });
    }

    case "release": {
      const releases =
        await githubRequest(
          `${baseUrl}/releases?per_page=10`,
          token
        );

      const release = releases[0];

      if (!release) {
        const error = new Error(
          "No release found in this repository"
        );

        error.statusCode = 404;

        throw error;
      }

      return buildReleasePayload({
        release,
        repository:
          repositoryData,
        action,
      });
    }

    default: {
      const error = new Error(
        `Unsupported GitHub event: ${event}`
      );

      error.statusCode = 400;

      throw error;
    }
  }
};

module.exports = {
  testGithubTrigger,
};