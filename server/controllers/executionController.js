const Workflow = require("../models/Workflow");
const Execution = require("../models/Execution");

const executeWorkflow = require("../services/workflow/executeWorkflow");

// CREATE AND RUN MANUAL EXECUTION
const createExecution = async (req, res) => {
  try {
    const { workflowId } = req.body;

    if (!workflowId) {
      return res.status(400).json({
        message: "Workflow ID is required",
      });
    }

    // Find workflow belonging to logged-in user
    const workflow = await Workflow.findOne({
      _id: workflowId,
      owner: req.user._id,
    });

    if (!workflow) {
      return res.status(404).json({
        message: "Workflow not found",
      });
    }

    // Create execution
    const execution = await Execution.create({
      workflow: workflow._id,
      owner: req.user._id,
      status: "pending",
      trigger: "manual",
    });

    // Execute workflow
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

module.exports = {
  createExecution,
};