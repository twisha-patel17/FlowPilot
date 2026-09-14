const Execution = require("../../models/Execution");
const executeNode = require("../nodes/nodeExecutor");
const { emitExecutionUpdate } = require("../socket/socket");

const {
  acquireExecutionLock,
  releaseExecutionLock,
} = require("../lock/executionLock");

const validateWorkflowGraph = (nodes, edges) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    throw new Error("Workflow has no nodes");
  }

  const nodeIds = new Set();

  for (const node of nodes) {
    if (!node.id) {
      throw new Error(
        "Workflow contains a node without an ID"
      );
    }

    if (nodeIds.has(node.id)) {
      throw new Error(
        `Duplicate workflow node ID: ${node.id}`
      );
    }

    nodeIds.add(node.id);
  }

  for (const edge of edges) {
    if (!edge.source || !edge.target) {
      throw new Error(
        "Workflow contains an invalid edge"
      );
    }

    if (!nodeIds.has(edge.source)) {
      throw new Error(
        `Edge source node not found: ${edge.source}`
      );
    }

    if (!nodeIds.has(edge.target)) {
      throw new Error(
        `Edge target node not found: ${edge.target}`
      );
    }
  }

  const targetNodeIds = new Set(
    edges.map((edge) => edge.target)
  );

  const startNodes = nodes.filter(
    (node) => !targetNodeIds.has(node.id)
  );

  if (startNodes.length === 0) {
    throw new Error(
      "Workflow has no starting node"
    );
  }

  if (startNodes.length > 1) {
    throw new Error(
      "Workflow must have exactly one starting node"
    );
  }

  return startNodes[0];
};

const executeWorkflow = async (
  executionId,
  attemptNumber = 1
) => {
  let lock = null;

  const currentAttempt =
    Number(attemptNumber) >= 1
      ? Number(attemptNumber)
      : 1;

  try {
    
    let execution = await Execution.findById(
      executionId
    );

    if (!execution) {
      throw new Error("Execution not found");
    }

    if (execution.status === "success") {
      console.log(
        `Execution already completed: ${execution._id}`
      );

      return execution;
    }

    if (!execution.workflowSnapshot) {
      throw new Error(
        "Workflow snapshot not found for execution"
      );
    }

    if (execution.attempt > currentAttempt) {
      console.log(
        `Ignoring stale workflow attempt: ` +
        `${execution._id} | ` +
        `Job attempt: ${currentAttempt} | ` +
        `Current execution attempt: ${execution.attempt}`
      );

      return execution;
    }

    lock = await acquireExecutionLock(
      executionId
    );

    if (!lock) {
      const error = new Error(
        "Execution is already being processed"
      );

      error.code = "EXECUTION_LOCKED";

      throw error;
    }

    console.log(
      `Execution lock acquired: ${executionId}`
    );

    execution = await Execution.findById(
      executionId
    );

    if (!execution) {
      throw new Error("Execution not found");
    }

    if (execution.status === "success") {
      console.log(
        `Execution completed before locked worker started: ` +
        `${execution._id}`
      );

      return execution;
    }

    if (execution.attempt > currentAttempt) {
      console.log(
        `Ignoring stale locked attempt: ` +
        `${execution._id} | ` +
        `Job attempt: ${currentAttempt} | ` +
        `Current execution attempt: ${execution.attempt}`
      );

      return execution;
    }

    const workflow =
      execution.workflowSnapshot;

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

    execution.attempt = currentAttempt;
    execution.status = "running";
    execution.startedAt = new Date();
    execution.finishedAt = null;
    execution.error = null;

    await execution.save();
    emitExecutionUpdate(execution);

    console.log(
      `Starting workflow: ${workflow.name} | ` +
      `Attempt: ${currentAttempt}`
    );

    const nodes = Array.isArray(workflow.nodes)
      ? workflow.nodes
      : [];

    const edges = Array.isArray(workflow.edges)
      ? workflow.edges
      : [];

    let currentNode = validateWorkflowGraph(
      nodes,
      edges
    );

    let input = execution.input || {};

    const visitedNodes = new Set();

    while (currentNode) {
      if (visitedNodes.has(currentNode.id)) {
        throw new Error(
          "Workflow contains a cycle"
        );
      }

      visitedNodes.add(currentNode.id);

      const nodeType =
        currentNode.data?.type ||
        currentNode.data?.nodeType ||
        currentNode.type ||
        "unknown";

      console.log(
        `Executing node: ${currentNode.id} ` +
        `(${nodeType}) | Attempt: ${currentAttempt}`
      );

      const stepStartedAt = Date.now();

      const step = {
        nodeId: currentNode.id,
        type: nodeType,
        attempt: currentAttempt,
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

        if (
          !result ||
          result.success === false
        ) {
          throw new Error(
            result?.error ||
              `Node execution failed: ${currentNode.id}`
          );
        }

        step.status = "success";

        step.output =
          result.output || {};

        step.duration =
          Date.now() - stepStartedAt;

        await execution.save();
        emitExecutionUpdate(execution);

        input =
          result.output || {};
      } catch (error) {
        step.status = "failed";

        step.error =
          error.message ||
          "Node execution failed";

        step.duration =
          Date.now() - stepStartedAt;

        await execution.save();
        emitExecutionUpdate(execution);

        throw error;
      }

      const outgoingEdges = edges.filter(
        (edge) =>
          edge.source === currentNode.id
      );

      let nextEdge = null;

      if (nodeType === "condition") {
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
      
        nextEdge =
          outgoingEdges[0] || null;
      }

      if (!nextEdge) {
        currentNode = null;
        continue;
      }

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

    execution.status = "success";
    execution.error = null;
    execution.finishedAt = new Date();

    await execution.save();
    emitExecutionUpdate(execution);

    console.log(
      `Workflow completed successfully: ` +
      `${workflow.name} | ` +
      `Attempt: ${currentAttempt}`
    );

    return execution;
  } catch (error) {
 
    if (error.code === "EXECUTION_LOCKED") {
      console.log(
        `Execution already locked: ` +
        `${executionId} | ` +
        `Attempt: ${currentAttempt}`
      );

      throw error;
    }

    console.error(
      `Workflow execution error | ` +
      `Attempt: ${currentAttempt}:`,
      error
    );

    const failedExecution =
      await Execution.findById(
        executionId
      );

    if (failedExecution) {
      failedExecution.error =
        error.message ||
        "Workflow execution failed";

      await failedExecution.save();
      emitExecutionUpdate(
        failedExecution
      );
    }

    throw error;
  } finally {

    if (lock) {
      try {
        await releaseExecutionLock(
          lock.lockKey,
          lock.lockToken
        );

        console.log(
          `Execution lock released: ${executionId}`
        );
      } catch (releaseError) {
        console.error(
          `Failed to release execution lock: ${executionId}`,
          releaseError
        );
      }
    }
  }
};

module.exports = executeWorkflow;