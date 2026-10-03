const Integration = require("../models/Integration");

const {
  decryptCredentials,
} = require("../utils/credentialEncryption");

const getGithubHeaders = (token) => {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "FlowPilot",
  };
};

const githubRequest = async (
  url,
  token
) => {
  const response = await fetch(url, {
    method: "GET",
    headers: getGithubHeaders(token),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.message ||
      `GitHub API request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
};

const validateRepository = (
  repository
) => {
  if (!repository) {
    throw new Error(
      "Repository is required"
    );
  }

  const parts =
    repository.trim().split("/");

  if (
    parts.length !== 2 ||
    !parts[0] ||
    !parts[1]
  ) {
    throw new Error(
      "Repository must be in owner/repository format"
    );
  }

  return {
    owner: parts[0],
    repo: parts[1],
  };
};

const buildIssuePayload = (
  issue,
  action
) => {
  return {
    event: "issues",
    action: action || null,

    issue: {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,

      html_url: issue.html_url,

      user: issue.user
        ? {
            login: issue.user.login,
            id: issue.user.id,
          }
        : null,

      labels:
        issue.labels?.map(
          (label) => ({
            name: label.name,
            color: label.color,
          })
        ) || [],

      created_at:
        issue.created_at,

      updated_at:
        issue.updated_at,

      closed_at:
        issue.closed_at,
    },
  };
};

const buildPullRequestPayload = (
  pullRequest,
  action
) => {
  return {
    event: "pull_request",
    action: action || null,

    pull_request: {
      id: pullRequest.id,
      number: pullRequest.number,
      title: pullRequest.title,
      body: pullRequest.body,
      state: pullRequest.state,

      html_url:
        pullRequest.html_url,

      user: pullRequest.user
        ? {
            login:
              pullRequest.user.login,
            id: pullRequest.user.id,
          }
        : null,

      head: pullRequest.head
        ? {
            ref:
              pullRequest.head.ref,
            sha:
              pullRequest.head.sha,
          }
        : null,

      base: pullRequest.base
        ? {
            ref:
              pullRequest.base.ref,
            sha:
              pullRequest.base.sha,
          }
        : null,

      created_at:
        pullRequest.created_at,

      updated_at:
        pullRequest.updated_at,

      closed_at:
        pullRequest.closed_at,

      merged_at:
        pullRequest.merged_at,
    },
  };
};

const buildPushPayload = (
  commit,
  action
) => {
  return {
    event: "push",
    action: action || "pushed",

    commit: {
      sha: commit.sha,

      message:
        commit.commit?.message ||
        "",

      author:
        commit.commit?.author ||
        null,

      committer:
        commit.commit?.committer ||
        null,

      html_url:
        commit.html_url,

      author_user:
        commit.author
          ? {
              login:
                commit.author.login,
              id:
                commit.author.id,
            }
          : null,
    },
  };
};

const buildReleasePayload = (
  release,
  action
) => {
  return {
    event: "release",
    action: action || null,

    release: {
      id: release.id,
      name: release.name,
      tag_name:
        release.tag_name,

      body: release.body,

      draft: release.draft,
      prerelease:
        release.prerelease,

      html_url:
        release.html_url,

      created_at:
        release.created_at,

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
  /*
   * IMPORTANT:
   *
   * Integration.credentials has:
   *
   * select: false
   *
   * in the Mongoose schema.
   *
   * Therefore we must explicitly select
   * credentials here.
   */
  const integration =
    await Integration.findOne({
      _id: integrationId,

      provider: "github",

      owner: userId,

      workspace: workspaceId,

      status: "connected",
    }).select("+credentials");

  if (!integration) {
    throw new Error(
      "GitHub integration not found"
    );
  }

  if (!integration.credentials) {
    throw new Error(
      "GitHub credentials are not configured"
    );
  }

  let credentials;

  try {
    credentials =
      decryptCredentials(
        integration.credentials
      );
  } catch (error) {
    throw new Error(
      "Failed to decrypt GitHub credentials"
    );
  }

  if (!credentials?.token) {
    throw new Error(
      "GitHub token is missing"
    );
  }

  const {
    owner,
    repo,
  } =
    validateRepository(
      repository
    );

  if (!event) {
    throw new Error(
      "GitHub event is required"
    );
  }

  let payload;

  switch (event) {
    case "issues": {
      const url =
        `https://api.github.com/repos/${owner}/${repo}/issues` +
        `?state=all&per_page=10`;

      const issues =
        await githubRequest(
          url,
          credentials.token
        );

      /*
       * GitHub's issues endpoint can also
       * return pull requests.
       *
       * We only want actual issues here.
       */
      const issue =
        issues.find(
          (item) =>
            !item.pull_request
        );

      if (!issue) {
        throw new Error(
          "No GitHub issue found in this repository"
        );
      }

      payload =
        buildIssuePayload(
          issue,
          action
        );

      break;
    }

    case "pull_request": {
      const url =
        `https://api.github.com/repos/${owner}/${repo}/pulls` +
        `?state=all&per_page=10`;

      const pullRequests =
        await githubRequest(
          url,
          credentials.token
        );

      const pullRequest =
        pullRequests[0];

      if (!pullRequest) {
        throw new Error(
          "No pull request found in this repository"
        );
      }

      payload =
        buildPullRequestPayload(
          pullRequest,
          action
        );

      break;
    }

    case "push": {
      const url =
        `https://api.github.com/repos/${owner}/${repo}/commits` +
        `?per_page=1`;

      const commits =
        await githubRequest(
          url,
          credentials.token
        );

      const commit =
        commits[0];

      if (!commit) {
        throw new Error(
          "No commit found in this repository"
        );
      }

      payload =
        buildPushPayload(
          commit,
          action
        );

      break;
    }

    case "release": {
      const url =
        `https://api.github.com/repos/${owner}/${repo}/releases` +
        `?per_page=10`;

      const releases =
        await githubRequest(
          url,
          credentials.token
        );

      const release =
        releases[0];

      if (!release) {
        throw new Error(
          "No GitHub release found in this repository"
        );
      }

      payload =
        buildReleasePayload(
          release,
          action
        );

      break;
    }

    default:
      throw new Error(
        `Unsupported GitHub event: ${event}`
      );
  }

  return {
    integrationId:
      integration._id,

    provider: "github",

    repository: {
      owner,
      name: repo,
      fullName:
        `${owner}/${repo}`,
    },

    event,

    action: action || null,

    payload,

    testedAt:
      new Date().toISOString(),
  };
};

module.exports = {
  testGithubTrigger,
};