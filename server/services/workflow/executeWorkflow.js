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
    const edges = workflow.edges || [];

    if (nodes.length === 0) {
      throw new Error("Workflow has no nodes");
    }

    const targetNodeIds = new Set(
      edges.map((edge) => edge.target)
    );

    let currentNode = nodes.find(
      (node) => !targetNodeIds.has(node.id)
    );

    if (!currentNode) {
      currentNode = nodes[0];
    }

    let input = {};
    const visitedNodes = new Set();

    while (currentNode) {
 
      if (visitedNodes.has(currentNode.id)) {
        throw new Error("Workflow contains a cycle");
      }

      visitedNodes.add(currentNode.id);

      console.log(
        `Executing node: ${currentNode.id || "unknown"}`
      );

      const result = await executeNode(
        currentNode,
        input
      );

      execution.steps.push({
        nodeId: currentNode.id || null,
        type:
          currentNode.data?.type ||
          currentNode.type ||
          "unknown",
        status: result.success ? "success" : "failed",
        output: result.output || {},
      });

      await execution.save();

      input = result.output || {};

      const nextEdge = edges.find(
        (edge) => edge.source === currentNode.id
      );

      if (!nextEdge) {
        currentNode = null;
      } else {
        currentNode = nodes.find(
          (node) => node.id === nextEdge.target
        );

        if (!currentNode) {
          throw new Error(
            `Next node not found: ${nextEdge.target}`
          );
        }
      }
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