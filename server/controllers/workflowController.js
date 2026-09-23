const mongoose = require("mongoose");

const Workflow = require("../models/Workflow");
const WorkflowVersion = require("../models/WorkflowVersion");
const Workspace = require("../models/Workspace");
const {
  withTransactionRetry,
} = require("../utils/withTransactionRetry");

const createWorkflow = async (
  req,
  res,
  next
) => {
  const session =
    await mongoose.startSession();

  try {
    const {
      name,
      description,
      trigger,
      nodes,
      edges,
    } = req.body;

    const workspaceId =
      req.headers["x-workspace-id"];

    if (!name) {
      return res.status(400).json({
        message:
          "Workflow name is required",
      });
    }

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        "members.user": req.user._id,
        status: "active",
      });

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    let workflow;

    await session.withTransaction(
      async () => {
        const createdWorkflows =
          await Workflow.create(
            [
              {
                name,
                description,
                trigger,
                nodes,
                edges,
                owner: req.user._id,
                workspace: workspaceId,
                currentVersion: 1,
              },
            ],
            {
              session,
            }
          );

        workflow =
          createdWorkflows[0];

        await WorkflowVersion.create(
          [
            {
              workflow:
                workflow._id,

              workspace:
                workflow.workspace,

              owner:
                workflow.owner,

              version: 1,

              name:
                workflow.name,

              description:
                workflow.description,

              trigger:
                workflow.trigger,

              nodes:
                workflow.nodes,

              edges:
                workflow.edges,

              createdBy:
                req.user._id,
            },
          ],
          {
            session,
          }
        );
      }
    );

    return res.status(201).json({
      message:
        "Workflow created successfully",

      workflow,
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

const getWorkflows = async (
  req,
  res,
  next
) => {
  try {
    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        "members.user": req.user._id,
        status: "active",
      });

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const workflows =
      await Workflow.find({
        owner: req.user._id,
        workspace: workspaceId,
      }).sort({
        createdAt: -1,
      });

    return res.status(200).json({
      workflows,
    });
  } catch (error) {
    next(error);
  }
};

const getWorkflow = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        "members.user": req.user._id,
        status: "active",
      });

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const workflow =
      await Workflow.findOne({
        _id: id,
        owner: req.user._id,
        workspace: workspaceId,
      });

    if (!workflow) {
      return res.status(404).json({
        message:
          "Workflow not found",
      });
    }

    return res.status(200).json({
      workflow,
    });
  } catch (error) {
    next(error);
  }
};
const updateWorkflow = async (
  req,
  res,
  next
) => {
  try {
    const {
      id,
    } = req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    const userId =
      req.user._id;

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        status: "active",
        "members.user": userId,
      });

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const {
      name,
      description,
      trigger,
      nodes,
      edges,
    } = req.body;

    const session =
      await mongoose.startSession();

    let updatedWorkflow = null;

    try {
      await withTransactionRetry(
        async () => {
          await session.withTransaction(
            async () => {
              const workflow =
                await Workflow.findOne({
                  _id: id,
                  workspace: workspaceId,
                  owner: userId,
                }).session(session);

              if (!workflow) {
                const error =
                  new Error(
                    "WORKFLOW_NOT_FOUND"
                  );

                throw error;
              }

              if (
                name !== undefined
              ) {
                workflow.name =
                  name;
              }

              if (
                description !==
                undefined
              ) {
                workflow.description =
                  description;
              }

              if (
                trigger !== undefined
              ) {
                workflow.trigger =
                  trigger;
              }

              if (
                nodes !== undefined
              ) {
                workflow.nodes =
                  nodes;
              }

              if (
                edges !== undefined
              ) {
                workflow.edges =
                  edges;
              }

              const nextVersion =
                workflow.currentVersion +
                1;

              await WorkflowVersion.create(
                [
                  {
                    workflow:
                      workflow._id,

                    workspace:
                      workflow.workspace,

                    owner:
                      workflow.owner,

                    version:
                      nextVersion,

                    name:
                      workflow.name,

                    description:
                      workflow.description,

                    trigger:
                      workflow.trigger,

                    nodes:
                      workflow.nodes,

                    edges:
                      workflow.edges,

                    createdBy:
                      userId,
                  },
                ],
                {
                  session,
                }
              );

              workflow.currentVersion =
                nextVersion;

              await workflow.save({
                session,
              });

              updatedWorkflow =
                workflow.toObject();
            }
          );
        }
      );
    } finally {
      await session.endSession();
    }

    return res.status(200).json({
      message:
        "Workflow updated successfully",
      workflow:
        updatedWorkflow,
    });
  } catch (error) {
    if (
      error.message ===
      "WORKFLOW_NOT_FOUND"
    ) {
      return res.status(404).json({
        message:
          "Workflow not found",
      });
    }

    next(error);
  }
};
const deleteWorkflow = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        "members.user": req.user._id,
        status: "active",
      });

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const workflow =
      await Workflow.findOneAndDelete({
        _id: id,
        owner: req.user._id,
        workspace: workspaceId,
      });

    if (!workflow) {
      return res.status(404).json({
        message:
          "Workflow not found",
      });
    }

    return res.status(200).json({
      message:
        "Workflow deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const toggleWorkflow = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        "members.user": req.user._id,
        status: "active",
      });

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const workflow =
      await Workflow.findOne({
        _id: id,
        owner: req.user._id,
        workspace: workspaceId,
      });

    if (!workflow) {
      return res.status(404).json({
        message:
          "Workflow not found",
      });
    }

    if (
      workflow.status ===
      "active"
    ) {
      workflow.status = "inactive";

      await workflow.save();

      return res.status(200).json({
        message:
          "Workflow deactivated successfully",

        workflow,
      });
    }

    if (
      !workflow.publishedVersion
    ) {
      return res.status(409).json({
        message:
          "Workflow must be published before it can be activated",
      });
    }

    const publishedVersion =
      await WorkflowVersion.findOne({
        workflow:
          workflow._id,

        workspace:
          workspaceId,

        owner:
          req.user._id,

        version:
          workflow.publishedVersion,
      });

    if (!publishedVersion) {
      return res.status(409).json({
        message:
          "Published workflow version does not exist",
      });
    }

    workflow.status = "active";

    await workflow.save();

    return res.status(200).json({
      message:
        "Workflow activated successfully",

      workflow,
    });
  } catch (error) {
    next(error);
  }
};

const getWorkflowVersions = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    const userId = req.user._id;

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        status: "active",
        "members.user": userId,
      });

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const workflow =
      await Workflow.findOne({
        _id: id,
        workspace: workspaceId,
        owner: userId,
      }).lean();

    if (!workflow) {
      return res.status(404).json({
        message:
          "Workflow not found",
      });
    }

    const versions =
      await WorkflowVersion.find({
        workflow: workflow._id,
        workspace: workspaceId,
        owner: userId,
      })
        .select(
          "_id workflow version name description trigger createdBy createdAt updatedAt"
        )
        .sort({
          version: -1,
        })
        .lean();

    const result = versions.map(
      (version) => ({
        ...version,
        isCurrent:
          version.version ===
          workflow.currentVersion,
      })
    );

    return res.status(200).json({
      workflowId: workflow._id,
      currentVersion:
        workflow.currentVersion,
      versions: result,
    });
  } catch (error) {
    next(error);
  }
};

const getWorkflowVersion = async (
  req,
  res,
  next
) => {
  try {
    const {
      id,
      version,
    } = req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    const userId = req.user._id;

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const versionNumber =
      Number(version);

    if (
      !Number.isInteger(
        versionNumber
      ) ||
      versionNumber < 1
    ) {
      return res.status(400).json({
        message:
          "Invalid workflow version",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        status: "active",
        "members.user": userId,
      });

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const workflow =
      await Workflow.findOne({
        _id: id,
        workspace: workspaceId,
        owner: userId,
      }).lean();

    if (!workflow) {
      return res.status(404).json({
        message:
          "Workflow not found",
      });
    }

    const workflowVersion =
      await WorkflowVersion.findOne({
        workflow: workflow._id,
        workspace: workspaceId,
        owner: userId,
        version: versionNumber,
      }).lean();

    if (!workflowVersion) {
      return res.status(404).json({
        message:
          "Workflow version not found",
      });
    }

    return res.status(200).json({
      version: {
        ...workflowVersion,
        isCurrent:
          workflowVersion.version ===
          workflow.currentVersion,
      },
    });
  } catch (error) {
    next(error);
  }
};
const restoreWorkflowVersion = async (
  req,
  res,
  next
) => {
  const session =
    await mongoose.startSession();

  try {
    const {
      id,
      version,
    } = req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    const userId =
      req.user._id;

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const versionNumber =
      Number(version);

    if (
      !Number.isInteger(
        versionNumber
      ) ||
      versionNumber < 1
    ) {
      return res.status(400).json({
        message:
          "Invalid workflow version",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        status: "active",
        "members.user": userId,
      });

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    let restoredWorkflow = null;

    await withTransactionRetry(
      async () => {
        await session.withTransaction(
          async () => {
            const workflow =
              await Workflow.findOne({
                _id: id,
                workspace: workspaceId,
                owner: userId,
              }).session(session);

            if (!workflow) {
              const error =
                new Error(
                  "WORKFLOW_NOT_FOUND"
                );

              throw error;
            }

            const sourceVersion =
              await WorkflowVersion.findOne({
                workflow:
                  workflow._id,

                workspace:
                  workspaceId,

                owner:
                  userId,

                version:
                  versionNumber,
              }).session(session);

            if (!sourceVersion) {
              const error =
                new Error(
                  "VERSION_NOT_FOUND"
                );

              throw error;
            }

            if (
              sourceVersion.version ===
              workflow.currentVersion
            ) {
              restoredWorkflow = {
                workflow:
                  workflow.toObject(),

                version:
                  sourceVersion.toObject(),

                alreadyCurrent:
                  true,
              };

              return;
            }

            const nextVersion =
              workflow.currentVersion +
              1;

            const createdVersions =
              await WorkflowVersion.create(
                [
                  {
                    workflow:
                      workflow._id,

                    workspace:
                      workflow.workspace,

                    owner:
                      workflow.owner,

                    version:
                      nextVersion,

                    name:
                      sourceVersion.name,

                    description:
                      sourceVersion.description,

                    trigger:
                      sourceVersion.trigger,

                    nodes:
                      sourceVersion.nodes,

                    edges:
                      sourceVersion.edges,

                    createdBy:
                      userId,
                  },
                ],
                {
                  session,
                }
              );

            const newVersion =
              createdVersions[0];

            workflow.name =
              sourceVersion.name;

            workflow.description =
              sourceVersion.description;

            workflow.trigger =
              sourceVersion.trigger;

            workflow.nodes =
              sourceVersion.nodes;

            workflow.edges =
              sourceVersion.edges;

            workflow.currentVersion =
              nextVersion;

            await workflow.save({
              session,
            });

            restoredWorkflow = {
              workflow:
                workflow.toObject(),

              version:
                newVersion.toObject(),

              alreadyCurrent:
                false,
            };
          }
        );
      }
    );

    if (
      restoredWorkflow.alreadyCurrent
    ) {
      return res.status(200).json({
        message:
          "Workflow is already using this version",

        workflow:
          restoredWorkflow.workflow,

        version:
          restoredWorkflow.version,
      });
    }

    return res.status(200).json({
      message:
        "Workflow version restored successfully",

      workflow:
        restoredWorkflow.workflow,

      version:
        restoredWorkflow.version,
    });
  } catch (error) {
    if (
      error.message ===
      "WORKFLOW_NOT_FOUND"
    ) {
      return res.status(404).json({
        message:
          "Workflow not found",
      });
    }

    if (
      error.message ===
      "VERSION_NOT_FOUND"
    ) {
      return res.status(404).json({
        message:
          "Workflow version not found",
      });
    }

    next(error);
  } finally {
    await session.endSession();
  }
};

const publishWorkflow = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    const userId = req.user._id;

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        status: "active",
        "members.user": userId,
      });

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const workflow =
      await Workflow.findOne({
        _id: id,
        workspace: workspaceId,
        owner: userId,
      });

    if (!workflow) {
      return res.status(404).json({
        message:
          "Workflow not found",
      });
    }

    const currentVersion =
      await WorkflowVersion.findOne({
        workflow: workflow._id,
        workspace: workspaceId,
        owner: userId,
        version:
          workflow.currentVersion,
      });

    if (!currentVersion) {
      return res.status(409).json({
        message:
          "Current workflow version does not exist",
      });
    }

    workflow.publishedVersion =
      workflow.currentVersion;

    await workflow.save();

    return res.status(200).json({
      message:
        "Workflow published successfully",

      workflow,
    });
  } catch (error) {
    next(error);
  }
};

const unpublishWorkflow = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const workspaceId =
      req.headers["x-workspace-id"];

    const userId = req.user._id;

    if (!workspaceId) {
      return res.status(400).json({
        message:
          "Workspace is required",
      });
    }

    const workspace =
      await Workspace.findOne({
        _id: workspaceId,
        status: "active",
        "members.user": userId,
      });

    if (!workspace) {
      return res.status(403).json({
        message:
          "You do not have access to this workspace",
      });
    }

    const workflow =
      await Workflow.findOne({
        _id: id,
        workspace: workspaceId,
        owner: userId,
      });

    if (!workflow) {
      return res.status(404).json({
        message:
          "Workflow not found",
      });
    }

    workflow.publishedVersion = null;
    workflow.status = "inactive";

    await workflow.save();

    return res.status(200).json({
      message:
        "Workflow unpublished successfully",

      workflow,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  publishWorkflow,
  unpublishWorkflow,
  getWorkflowVersion,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  getWorkflowVersions,
  restoreWorkflowVersion,
};