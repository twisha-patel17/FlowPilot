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

    // Find starting node
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

      const stepStartedAt = Date.now();

      const step = {
        nodeId: currentNode.id || null,
        type:
          currentNode.data?.type ||
          currentNode.type ||
          "unknown",
        status: "running",
        input,
        output: {},
        error: null,
        duration: 0,
      };

      execution.steps.push(step);

      await execution.save();

      try {
        const result = await executeNode(
          currentNode,
          input
        );

        step.status = result.success
          ? "success"
          : "failed";

        step.output = result.output || {};
        step.duration =
          Date.now() - stepStartedAt;

        await execution.save();

        input = result.output || {};
      } catch (error) {
        step.status = "failed";
        step.error = error.message;
        step.duration =
          Date.now() - stepStartedAt;

        await execution.save();

        throw error;
      }

      // Find next connected node
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
    console.error(
      "Workflow execution error:",
      error
    );

    execution.status = "failed";
    execution.error = error.message;
    execution.finishedAt = new Date();

    await execution.save();

    throw error;
  }
};

module.exports = executeWorkflow;