const Workflow = require("../models/Workflow");
const Execution = require("../models/Execution");

const executeWorkflow = require("../services/workflow/executeWorkflow");

const createExecution = async (req, res) => {
  try {
    const { workflowId } = req.body;

    if (!workflowId) {
      return res.status(400).json({
        message: "Workflow ID is required",
      });
    }

    const workflow = await Workflow.findOne({
      _id: workflowId,
      owner: req.user._id,
    });

    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found",
      });
    }

    const execution = await Execution.create({
      workflow: workflow._id,
      owner: req.user._id,
      status: "pending",
      trigger: "manual",
    });

    const completedExecution = await executeWorkflow(
      execution._id
    );

    return res.status(201).json({
      message: "Workflow executed successfully",
      execution: completedExecution,
    });
  } catch (error) {
    console.error("Create execution error:", error);

    return res.status(500).json({
      message: "Workflow execution failed",
      error: error.message,
    });
  }
};

const getExecutions = async (req, res) => {
  try {
    const executions = await Execution.find({
      owner: req.user._id,
    })
      .populate("workflow", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      executions,
    });
  } catch (error) {
    console.error("Get executions error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getExecution = async (req, res) => {
  try {
    const { id } = req.params;

    const execution = await Execution.findOne({
      _id: id,
      owner: req.user._id,
    }).populate("workflow", "name");

    if (!execution) {
      return res.status(404).json({
        message: "Execution not found",
      });
    }

    return res.status(200).json({
      execution,
    });
  } catch (error) {
    console.error("Get execution error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createExecution,
  getExecutions,
  getExecution,
};