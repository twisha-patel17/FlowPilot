const Workspace = require("../models/Workspace");

const {
  testGithubTrigger,
} = require("../services/githubService");

const testTrigger = async (req, res, next) => {
  try {
    const {
      integrationId,
      repository,
      event,
      action,
    } = req.body;

    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
      status: "active",
    }).select("_id");

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    if (!integrationId) {
      return res.status(400).json({
        message:
          "GitHub integration is required",
      });
    }

    if (!repository) {
      return res.status(400).json({
        message: "Repository is required",
      });
    }

    if (!event) {
      return res.status(400).json({
        message: "GitHub event is required",
      });
    }

    const payload = await testGithubTrigger({
      integrationId,
      workspaceId,
      userId: req.user._id,
      repository,
      event,
      action,
    });

    return res.status(200).json({
      message:
        "GitHub trigger test successful",
      payload,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  testTrigger,
};