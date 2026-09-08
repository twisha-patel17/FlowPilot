const Workflow = require("../models/Workflow");
const Workspace = require("../models/Workspace");

const createWorkflow = async (req, res) => {
  try {
    const { name, description, trigger, nodes, edges } = req.body;
    const workspaceId = req.headers["x-workspace-id"];

    if (!name) {
      return res.status(400).json({
        message: "Workflow name is required",
      });
    }

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
    });

    if (!workspace) {
      return res.status(403).json({
        message: "You do not have access to this workspace",
      });
    }

    const workflow = await Workflow.create({
      name,
      description,
      trigger,
      nodes,
      edges,
      owner: req.user._id,
      workspace: workspaceId,
    });

    return res.status(201).json({
      message: "Workflow created successfully",
      workflow,
    });
  } catch (error) {
    console.error("Create workflow error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getWorkflows = async (req, res) => {
  try {
    const workspaceId = req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
    });

    if (!workspace) {
      return res.status(403).json({
        message: "You do not have access to this workspace",
      });
    }

    const workflows = await Workflow.find({
      owner: req.user._id,
      workspace: workspaceId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      workflows,
    });
  } catch (error) {
    console.error("Get workflows error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
    });

    if (!workspace) {
      return res.status(403).json({
        message: "You do not have access to this workspace",
      });
    }

    const workflow = await Workflow.findOne({
      _id: id,
      owner: req.user._id,
      workspace: workspaceId,
    });

    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found",
      });
    }

    return res.status(200).json({
      workflow,
    });
  } catch (error) {
    console.error("Get workflow error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const updateWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      status,
      trigger,
      nodes,
      edges,
    } = req.body;

    const workspaceId = req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
    });

    if (!workspace) {
      return res.status(403).json({
        message: "You do not have access to this workspace",
      });
    }

    const workflow = await Workflow.findOne({
      _id: id,
      owner: req.user._id,
      workspace: workspaceId,
    });

    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found",
      });
    }

    if (name !== undefined) workflow.name = name;
    if (description !== undefined) {
      workflow.description = description;
    }
    if (status !== undefined) workflow.status = status;
    if (trigger !== undefined) workflow.trigger = trigger;
    if (nodes !== undefined) workflow.nodes = nodes;
    if (edges !== undefined) workflow.edges = edges;

    await workflow.save();

    return res.status(200).json({
      message: "Workflow updated successfully",
      workflow,
    });
  } catch (error) {
    console.error("Update workflow error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
    });

    if (!workspace) {
      return res.status(403).json({
        message: "You do not have access to this workspace",
      });
    }

    const workflow = await Workflow.findOneAndDelete({
      _id: id,
      owner: req.user._id,
      workspace: workspaceId,
    });

    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found",
      });
    }

    return res.status(200).json({
      message: "Workflow deleted successfully",
    });
  } catch (error) {
    console.error("Delete workflow error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const toggleWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.headers["x-workspace-id"];

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace is required",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
    });

    if (!workspace) {
      return res.status(403).json({
        message: "You do not have access to this workspace",
      });
    }

    const workflow = await Workflow.findOne({
      _id: id,
      owner: req.user._id,
      workspace: workspaceId,
    });

    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found",
      });
    }

    workflow.status =
      workflow.status === "active"
        ? "inactive"
        : "active";

    await workflow.save();

    return res.status(200).json({
      message: "Workflow status updated successfully",
      workflow,
    });
  } catch (error) {
    console.error("Toggle workflow error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
};