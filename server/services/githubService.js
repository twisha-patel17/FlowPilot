const Integration = require("../models/Integration");
const { decryptCredentials } = require("../utils/credentialEncryption");

const GITHUB_API_BASE = "https://api.github.com";

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

  let data = null;

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
    error.status = response.status;
    error.code = "GITHUB_API_ERROR";

    throw error;
  }

  return data;
};

const getGithubIntegration = async ({
  integrationId,
  workspaceId,
  userId,
}) => {
  if (!integrationId) {
    const error = new Error(
      "GitHub integration is required"
    );

    error.status = 400;
    error.code = "GITHUB_INTEGRATION_REQUIRED";

    throw error;
  }

  const integration =
    await Integration.findOne({
      _id: integrationId,
      provider: "github",
      workspace: workspaceId,
      owner: userId,
      status: "connected",
    });

  if (!integration) {
    const error = new Error(
      "Connected GitHub integration not found"
    );

    error.status = 404;
    error.code = "GITHUB_INTEGRATION_NOT_FOUND";

    throw error;
  }

  const credentials =
    decryptCredentials(
      integration.credentials
    );

  if (!credentials?.token) {
    const error = new Error(
      "GitHub integration token is missing"
    );

    error.status = 400;
    error.code = "GITHUB_TOKEN_MISSING";

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

    error.status = 400;
    error.code = "GITHUB_REPOSITORY_REQUIRED";

    throw error;
  }

  const normalized =
    repository.trim();

  if (
    !/^[^/\s]+\/[^/\s]+$/.test(
      normalized
    )
  ) {
    const error = new Error(
      "Repository must use the owner/repository format"
    );

    error.status = 400;
    error.code =
      "GITHUB_INVALID_REPOSITORY";

    throw error;
  }

  return normalized;
};

const buildIssuePayload = ({
  repository,
  action,
  issue,
}) => {
  return {
    event: "issues",
    action,
    repository: {
      full_name: repository,
      name: repository.split("/")[1],
      owner: repository.split("/")[0],
    },
    issue: {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      url: issue.html_url,
      labels: Array.isArray(issue.labels)
        ? issue.labels.map(
            (label) =>
              typeof label === "string"
                ? label
                : label.name
          )
        : [],
      user: issue.user
        ? {
            login: issue.user.login,
            id: issue.user.id,
          }
        : null,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    },
  };
};

const buildPullRequestPayload = ({
  repository,
  action,
  pullRequest,
}) => {
  return {
    event: "pull_request",
    action,
    repository: {
      full_name: repository,
      name: repository.split("/")[1],
      owner: repository.split("/")[0],
    },
    pull_request: {
      id: pullRequest.id,
      number: pullRequest.number,
      title: pullRequest.title,
      body: pullRequest.body,
      state: pullRequest.state,
      merged: pullRequest.merged_at !== null,
      url: pullRequest.html_url,
      user: pullRequest.user
        ? {
            login: pullRequest.user.login,
            id: pullRequest.user.id,
          }
        : null,
      created_at:
        pullRequest.created_at,
      updated_at:
        pullRequest.updated_at,
    },
  };
};

const buildPushPayload = ({
  repository,
  commit,
}) => {
  return {
    event: "push",
    action: "pushed",
    repository: {
      full_name: repository,
      name: repository.split("/")[1],
      owner: repository.split("/")[0],
    },
    commit: {
      sha: commit.sha,
      message: commit.commit?.message || "",
      url: commit.html_url,
      author: commit.author
        ? {
            login: commit.author.login,
          }
        : null,
    },
  };
};

const buildReleasePayload = ({
  repository,
  action,
  release,
}) => {
  return {
    event: "release",
    action,
    repository: {
      full_name: repository,
      name: repository.split("/")[1],
      owner: repository.split("/")[0],
    },
    release: {
      id: release.id,
      name: release.name,
      tag_name: release.tag_name,
      body: release.body,
      draft: release.draft,
      prerelease: release.prerelease,
      url: release.html_url,
      created_at: release.created_at,
      published_at:
        release.published_at,
    },
  };
};

const testGithubTrigger = async ({
  integrationId,
  workspaceId,
  userId,
  repository,
  event,
  action,
}) => {
  const normalizedRepository =
    validateRepository(repository);

  const {
    token,
  } = await getGithubIntegration({
    integrationId,
    workspaceId,
    userId,
  });

  const encodedRepository =
    normalizedRepository
      .split("/")
      .map(encodeURIComponent)
      .join("/");

  switch (event) {
    case "issues": {
      const issues =
        await githubRequest(
          `${GITHUB_API_BASE}/repos/${encodedRepository}/issues?state=all&per_page=10`,
          token
        );

      const issue =
        Array.isArray(issues)
          ? issues.find(
              (item) =>
                !item.pull_request
            )
          : null;

      if (!issue) {
        const error = new Error(
          "No issues were found in this repository"
        );

        error.status = 404;
        error.code =
          "GITHUB_NO_ISSUES";

        throw error;
      }

      return buildIssuePayload({
        repository:
          normalizedRepository,
        action:
          action || "opened",
        issue,
      });
    }

    case "pull_request": {
      const pullRequests =
        await githubRequest(
          `${GITHUB_API_BASE}/repos/${encodedRepository}/pulls?state=all&per_page=10`,
          token
        );

      const pullRequest =
        Array.isArray(pullRequests)
          ? pullRequests[0]
          : null;

      if (!pullRequest) {
        const error = new Error(
          "No pull requests were found in this repository"
        );

        error.status = 404;
        error.code =
          "GITHUB_NO_PULL_REQUESTS";

        throw error;
      }

      return buildPullRequestPayload({
        repository:
          normalizedRepository,
        action:
          action || "opened",
        pullRequest,
      });
    }

    case "push": {
      const commits =
        await githubRequest(
          `${GITHUB_API_BASE}/repos/${encodedRepository}/commits?per_page=1`,
          token
        );

      const commit =
        Array.isArray(commits)
          ? commits[0]
          : null;

      if (!commit) {
        const error = new Error(
          "No commits were found in this repository"
        );

        error.status = 404;
        error.code =
          "GITHUB_NO_COMMITS";

        throw error;
      }

      return buildPushPayload({
        repository:
          normalizedRepository,
        commit,
      });
    }

    case "release": {
      const releases =
        await githubRequest(
          `${GITHUB_API_BASE}/repos/${encodedRepository}/releases?per_page=10`,
          token
        );

      const release =
        Array.isArray(releases)
          ? releases[0]
          : null;

      if (!release) {
        const error = new Error(
          "No releases were found in this repository"
        );

        error.status = 404;
        error.code =
          "GITHUB_NO_RELEASES";

        throw error;
      }

      return buildReleasePayload({
        repository:
          normalizedRepository,
        action:
          action || "published",
        release,
      });
    }

    default: {
      const error = new Error(
        `Unsupported GitHub event: ${event}`
      );

      error.status = 400;
      error.code =
        "GITHUB_UNSUPPORTED_EVENT";

      throw error;
    }
  }
};

module.exports = {
  testGithubTrigger,
};