const Execution = require("../../models/Execution");
const executeNode = require("../nodes/nodeExecutor");

const executeWorkflow = async (executionId) => {
  const execution = await Execution.findById(executionId).populate(
    "workflow"
  );

  if (!execution) {
    throw new Error("Execution not found");
  }

  const workflow = execution.workflow;

  try {
    execution.status = "running";
    execution.startedAt = new Date();

    await execution.save();

    console.log(`Starting workflow: ${workflow.name}`);

    const nodes = workflow.nodes || [];

    let input = {};

    for (const node of nodes) {
      console.log(`Executing node: ${node.id || "unknown"}`);

      const result = await executeNode(node, input);

      execution.steps.push({
        nodeId: node.id || null,
        type: node.data?.type || node.type || "unknown",
        status: result.success ? "success" : "failed",
        output: result.output || {},
      });

      await execution.save();

      input = result.output || {};
    }

    execution.status = "success";
    execution.finishedAt = new Date();

    await execution.save();

    console.log(
      `Workflow completed successfully: ${workflow.name}`
    );

    return execution;
  } catch (error) {
    console.error("Workflow execution error:", error);

    execution.status = "failed";
    execution.error = error.message;
    execution.finishedAt = new Date();

    await execution.save();

    throw error;
  }
};

module.exports = executeWorkflow;