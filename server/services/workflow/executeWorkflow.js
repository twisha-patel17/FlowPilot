const Execution = require("../../models/Execution");
const executeNode = require("../nodes/nodeExecutor");
const { emitExecutionUpdate } = require("../socket/socket");

const executeWorkflow = async (executionId) => {
  const execution = await Execution.findById(
    executionId
  ).populate("workflow");

  if (!execution) {
    throw new Error("Execution not found");
  }

  if (!execution.workflow) {
    throw new Error("Workflow not found");
  }

  const workflow = execution.workflow;

  if (
    !execution.workspace ||
    !workflow.workspace ||
    execution.workspace.toString() !==
      workflow.workspace.toString()
  ) {
    throw new Error(
      "Execution and workflow belong to different workspaces"
    );
  }

  try {
    execution.status = "running";
    execution.startedAt = new Date();
    execution.error = null;

    await execution.save();
    emitExecutionUpdate(execution);

    console.log(
      `Starting workflow: ${workflow.name}`
    );

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

    let input = execution.input || {};
    const visitedNodes = new Set();

    while (currentNode) {
      if (visitedNodes.has(currentNode.id)) {
        throw new Error(
          "Workflow contains a cycle"
        );
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
      emitExecutionUpdate(execution);

      let result;

      try {
        result = await executeNode(
          currentNode,
          input,
          {
            userId: execution.owner,
            workspaceId: execution.workspace,
          }
        );

        step.status = result.success
          ? "success"
          : "failed";

        step.output = result.output || {};

        step.duration =
          Date.now() - stepStartedAt;

        await execution.save();
        emitExecutionUpdate(execution);

        input = result.output || {};
      } catch (error) {
        step.status = "failed";
        step.error = error.message;

        step.duration =
          Date.now() - stepStartedAt;

        await execution.save();
        emitExecutionUpdate(execution);

        throw error;
      }

      /*
       * Find the next edge.
       *
       * Normal nodes:
       *   source → target
       *
       * Condition nodes:
       *   conditionResult === true
       *      → edge with sourceHandle "true"
       *
       *   conditionResult === false
       *      → edge with sourceHandle "false"
       */

      const outgoingEdges = edges.filter(
        (edge) =>
          edge.source === currentNode.id
      );

      let nextEdge = null;

      const currentNodeType =
        currentNode.data?.type ||
        currentNode.data?.nodeType ||
        currentNode.type;

      if (
        currentNodeType === "condition"
      ) {
        if (outgoingEdges.length === 0) {
          currentNode = null;
          continue;
        }

        if (
          typeof result.conditionResult !==
          "boolean"
        ) {
          throw new Error(
            "Condition node did not return a valid condition result"
          );
        }

        const handle =
          result.conditionResult
            ? "true"
            : "false";

        nextEdge = outgoingEdges.find(
          (edge) =>
            edge.sourceHandle === handle
        );

        if (!nextEdge) {
          console.log(
            `No "${handle}" branch found for condition node`
          );

          currentNode = null;
          continue;
        }
      } else {
        nextEdge = outgoingEdges[0] || null;
      }

      if (!nextEdge) {
        currentNode = null;
      } else {
        currentNode = nodes.find(
          (node) =>
            node.id === nextEdge.target
        );

        if (!currentNode) {
          throw new Error(
            `Next node not found: ${nextEdge.target}`
          );
        }
      }
    }

    execution.status = "success";
    execution.error = null;
    execution.finishedAt = new Date();

    await execution.save();
    emitExecutionUpdate(execution);

    console.log(
      `Workflow completed successfully: ${workflow.name}`
    );

    return execution;
  } catch (error) {
    console.error(
      "Workflow execution error:",
      error
    );

    execution.error = error.message;

    await execution.save();
    emitExecutionUpdate(execution);

    throw error;
  }
};

module.exports = executeWorkflow;