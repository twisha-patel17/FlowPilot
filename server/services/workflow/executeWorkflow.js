const mongoose = require("mongoose");
const Execution = require("../../models/Execution");
const executeNode = require("../nodes/nodeExecutor");
const { emitExecutionUpdate } = require("../socket/socket");

const {
  acquireExecutionLock,
  releaseExecutionLock,
} = require("../lock/executionLock");

const {
  registerExecution,
  unregisterExecution,
} = require("./executionCancellation");

const WORKFLOW_TIMEOUT =
  Number(process.env.WORKFLOW_TIMEOUT_MS) ||
  5 * 60 * 1000;

const validateWorkflowGraph = (
  nodes,
  edges
) => {
  if (
    !Array.isArray(nodes) ||
    nodes.length === 0
  ) {
    throw new Error(
      "Workflow has no nodes"
    );
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
    (node) =>
      !targetNodeIds.has(node.id)
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

const createTimeoutError = () => {
  const error = new Error(
    "Workflow execution timed out"
  );

  error.code = "WORKFLOW_TIMEOUT";

  return error;
};

const createCancellationError = () => {
  const error = new Error(
    "Workflow execution was cancelled"
  );

  error.code = "EXECUTION_CANCELLED";

  return error;
};

const throwIfCancelled = (
  signal
) => {
  if (signal?.aborted) {
    throw createCancellationError();
  }
};

const withTimeout = (
  promise,
  timeoutMs,
  controller
) => {
  let timeoutId;

  const timeoutPromise =
    new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        console.error(
          `Workflow node timeout reached after ${timeoutMs}ms`
        );

        if (controller) {
          controller.abort();
        }

        reject(
          createTimeoutError()
        );
      }, timeoutMs);
    });

  return Promise.race([
    promise,
    timeoutPromise,
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
};

const appendStep = async (
  executionId,
  attempt,
  step
) => {
  const result =
    await Execution.updateOne(
      {
        _id: executionId,
        status: "running",
        attempt,
      },
      {
        $push: {
          steps: step,
        },
      }
    );

  return result.modifiedCount === 1;
};

const updateStep = async (
  executionId,
  attempt,
  stepId,
  updates
) => {
  const result =
    await Execution.updateOne(
      {
        _id: executionId,
        status: "running",
        attempt,
        "steps._id": stepId,
      },
      {
        $set: Object.fromEntries(
          Object.entries(updates).map(
            ([key, value]) => [
              `steps.$.${key}`,
              value,
            ]
          )
        ),
      }
    );

  return result.modifiedCount === 1;
};

const getLatestExecution = async (
  executionId
) => {
  return Execution.findById(
    executionId
  );
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

  const workflowStartedAt =
    Date.now();

  const controller =
    new AbortController();

  const signal =
    controller.signal;

  let registered = false;

  try {
    let execution =
      await Execution.findById(
        executionId
      );

    if (!execution) {
      throw new Error(
        "Execution not found"
      );
    }

    if (
      execution.status === "success"
    ) {
      console.log(
        `Execution already completed: ${execution._id}`
      );

      return execution;
    }

    if (
      execution.status === "cancelled"
    ) {
      console.log(
        `Execution already cancelled: ${execution._id}`
      );

      return execution;
    }

    if (!execution.workflowSnapshot) {
      throw new Error(
        "Workflow snapshot not found for execution"
      );
    }

    if (
      execution.attempt >
      currentAttempt
    ) {
      console.log(
        `Ignoring stale workflow attempt: ` +
        `${execution._id} | ` +
        `Job attempt: ${currentAttempt} | ` +
        `Current execution attempt: ${execution.attempt}`
      );

      return execution;
    }

    lock =
      await acquireExecutionLock(
        executionId
      );

    if (!lock) {
      const error = new Error(
        "Execution is already being processed"
      );

      error.code =
        "EXECUTION_LOCKED";

      throw error;
    }

    console.log(
      `Execution lock acquired: ${executionId}`
    );

    execution =
      await Execution.findById(
        executionId
      );

    if (!execution) {
      throw new Error(
        "Execution not found"
      );
    }

    if (
      execution.status === "cancelled"
    ) {
      console.log(
        `Execution cancelled before claim: ${executionId}`
      );

      return execution;
    }

    if (
      execution.status === "success"
    ) {
      console.log(
        `Execution completed before locked worker started: ` +
        `${execution._id}`
      );

      return execution;
    }

    if (
      execution.attempt >
      currentAttempt
    ) {
      console.log(
        `Ignoring stale locked attempt: ` +
        `${execution._id} | ` +
        `Job attempt: ${currentAttempt} | ` +
        `Current execution attempt: ${execution.attempt}`
      );

      return execution;
    }

    const claimedExecution =
      await Execution.findOneAndUpdate(
        {
          _id: executionId,

          status: {
            $in: [
              "pending",
              "running",
            ],
          },

          attempt: {
            $lte: currentAttempt,
          },
        },
        {
          $set: {
            status: "running",
            startedAt: new Date(),
            finishedAt: null,
            cancelledAt: null,
            error: null,
            attempt: currentAttempt,
          },
        },
        {
          new: true,
        }
      );

    if (!claimedExecution) {
      const latestExecution =
        await getLatestExecution(
          executionId
        );

      if (
        latestExecution?.status ===
        "success"
      ) {
        return latestExecution;
      }

      if (
        latestExecution?.status ===
        "cancelled"
      ) {
        return latestExecution;
      }

      if (
        latestExecution &&
        latestExecution.attempt >
          currentAttempt
      ) {
        return latestExecution;
      }

      throw new Error(
        "Execution could not be atomically claimed"
      );
    }

    execution =
      claimedExecution;

    registerExecution(
      executionId,
      controller
    );

    registered = true;

    throwIfCancelled(signal);

    const cancellationCheck =
      await getLatestExecution(
        executionId
      );

    if (!cancellationCheck) {
      throw new Error(
        "Execution not found"
      );
    }

    if (
      cancellationCheck.status ===
      "cancelled"
    ) {
      controller.abort();

      throw createCancellationError();
    }

    execution =
      cancellationCheck;

    emitExecutionUpdate(
      execution
    );

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

    console.log(
      `Starting workflow: ${workflow.name} | ` +
      `Attempt: ${currentAttempt} | ` +
      `Timeout: ${WORKFLOW_TIMEOUT}ms`
    );

    const nodes =
      Array.isArray(workflow.nodes)
        ? workflow.nodes
        : [];

    const edges =
      Array.isArray(workflow.edges)
        ? workflow.edges
        : [];

    let currentNode =
      validateWorkflowGraph(
        nodes,
        edges
      );

    let input =
      execution.input || {};

    const visitedNodes =
      new Set();

    while (currentNode) {
      throwIfCancelled(signal);

      const workflowElapsed =
        Date.now() -
        workflowStartedAt;

      if (
        workflowElapsed >=
        WORKFLOW_TIMEOUT
      ) {
        controller.abort();

        throw createTimeoutError();
      }

      if (
        visitedNodes.has(
          currentNode.id
        )
      ) {
        throw new Error(
          "Workflow contains a cycle"
        );
      }

      visitedNodes.add(
        currentNode.id
      );

      const nodeType =
        currentNode.data?.type ||
        currentNode.data?.nodeType ||
        currentNode.type ||
        "unknown";

      console.log(
        `Executing node: ${currentNode.id} ` +
        `(${nodeType}) | ` +
        `Attempt: ${currentAttempt}`
      );

      const stepStartedAt =
        Date.now();

      const stepId =
        new mongoose.Types.ObjectId();

      const step = {
        _id: stepId,
        nodeId: currentNode.id,
        type: nodeType,
        attempt: currentAttempt,
        status: "running",
        input,
        output: {},
        error: null,
        duration: 0,
      };

      const stepCreated =
        await appendStep(
          executionId,
          currentAttempt,
          step
        );

      if (!stepCreated) {
        const latestExecution =
          await getLatestExecution(
            executionId
          );

        if (
          latestExecution?.status ===
          "cancelled"
        ) {
          throw createCancellationError();
        }

        throw new Error(
          "Workflow step could not be created because execution state changed"
        );
      }

      execution =
        await getLatestExecution(
          executionId
        );

      if (!execution) {
        throw new Error(
          "Execution not found"
        );
      }

      emitExecutionUpdate(
        execution
      );

      throwIfCancelled(signal);

      const elapsed =
        Date.now() -
        workflowStartedAt;

      const remainingTime =
        WORKFLOW_TIMEOUT -
        elapsed;

      if (remainingTime <= 0) {
        controller.abort();

        const timeoutError =
          createTimeoutError();

        await updateStep(
          executionId,
          currentAttempt,
          stepId,
          {
            status: "failed",
            error:
              timeoutError.message,
            duration:
              Date.now() -
              stepStartedAt,
          }
        );

        execution =
          await getLatestExecution(
            executionId
          );

        if (execution) {
          emitExecutionUpdate(
            execution
          );
        }

        throw timeoutError;
      }

      let result;

      try {
        result =
          await withTimeout(
            executeNode(
              currentNode,
              input,
              {
                userId:
                  execution.owner,

                workspaceId:
                  execution.workspace,

                signal,
              }
            ),
            remainingTime,
            controller
          );

        throwIfCancelled(signal);

        if (
          !result ||
          result.success === false
        ) {
          throw new Error(
            result?.error ||
              `Node execution failed: ${currentNode.id}`
          );
        }

        const stepUpdated =
          await updateStep(
            executionId,
            currentAttempt,
            stepId,
            {
              status: "success",
              output:
                result.output || {},
              duration:
                Date.now() -
                stepStartedAt,
            }
          );

        if (!stepUpdated) {
          const latestExecution =
            await getLatestExecution(
              executionId
            );

          if (
            latestExecution?.status ===
            "cancelled"
          ) {
            throw createCancellationError();
          }

          throw new Error(
            "Workflow step could not be completed because execution state changed"
          );
        }

        execution =
          await getLatestExecution(
            executionId
          );

        if (!execution) {
          throw new Error(
            "Execution not found"
          );
        }

        emitExecutionUpdate(
          execution
        );

        input =
          result.output || {};
      } catch (error) {
        if (
          signal.aborted
        ) {
          error =
            error.code ===
            "WORKFLOW_TIMEOUT"
              ? error
              : createCancellationError();
        }

        const stepError =
          error.code ===
          "WORKFLOW_TIMEOUT"
            ? "Workflow execution timed out"
            : error.code ===
              "EXECUTION_CANCELLED"
              ? "Workflow execution was cancelled"
              : error.code ===
                "ERR_CANCELED"
              ? "Workflow execution timed out"
              : error.message ||
                "Node execution failed";

        await updateStep(
          executionId,
          currentAttempt,
          stepId,
          {
            status: "failed",
            error: stepError,
            duration:
              Date.now() -
              stepStartedAt,
          }
        );

        execution =
          await getLatestExecution(
            executionId
          );

        if (execution) {
          emitExecutionUpdate(
            execution
          );
        }

        throw error;
      }

      throwIfCancelled(signal);

      if (
        Date.now() -
          workflowStartedAt >=
        WORKFLOW_TIMEOUT
      ) {
        controller.abort();

        throw createTimeoutError();
      }

      const outgoingEdges =
        edges.filter(
          (edge) =>
            edge.source ===
            currentNode.id
        );

      let nextEdge = null;

      /*
       * CONDITION BRANCHING
       *
       * ConditionConfig returns:
       *
       * conditionResult: true / false
       *
       * WorkflowCanvas handles:
       *
       * true  → sourceHandle="true"
       * false → sourceHandle="false"
       */
      if (
        nodeType === "condition"
      ) {
        if (
          outgoingEdges.length ===
          0
        ) {
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

        nextEdge =
          outgoingEdges.find(
            (edge) =>
              edge.sourceHandle ===
              handle
          );

        if (!nextEdge) {
          console.log(
            `No "${handle}" branch found for condition node`
          );

          currentNode = null;
          continue;
        }
      }

      /*
       * SWITCH BRANCHING
       *
       * switchNode.js returns:
       *
       * case-0
       * case-1
       * case-2
       * ...
       * default
       *
       * WorkflowCanvas uses the same IDs
       * for its source handles.
       */
      else if (
        nodeType === "switch"
      ) {
        if (
          outgoingEdges.length ===
          0
        ) {
          currentNode = null;
          continue;
        }

        const selectedHandle =
          result.switchResult
            ?.selectedHandle;

        if (
          typeof selectedHandle !==
          "string" ||
          !selectedHandle
        ) {
          throw new Error(
            "Switch node did not return a valid selected handle"
          );
        }

        nextEdge =
          outgoingEdges.find(
            (edge) =>
              edge.sourceHandle ===
              selectedHandle
          );

        if (!nextEdge) {
          console.log(
            `No "${selectedHandle}" branch found for switch node`
          );

          currentNode = null;
          continue;
        }
      }

      /*
       * NORMAL NODE
       *
       * Nodes without branching simply
       * follow their first outgoing edge.
       */
      else {
        nextEdge =
          outgoingEdges[0] ||
          null;
      }

      if (!nextEdge) {
        currentNode = null;
        continue;
      }

      currentNode =
        nodes.find(
          (node) =>
            node.id ===
            nextEdge.target
        );

      if (!currentNode) {
        throw new Error(
          `Next node not found: ${nextEdge.target}`
        );
      }
    }

    throwIfCancelled(signal);

    if (
      Date.now() -
        workflowStartedAt >=
      WORKFLOW_TIMEOUT
    ) {
      controller.abort();

      throw createTimeoutError();
    }

    const completedExecution =
      await Execution.findOneAndUpdate(
        {
          _id: executionId,

          status: "running",

          attempt: currentAttempt,
        },
        {
          $set: {
            status: "success",
            error: null,
            finishedAt: new Date(),
          },
        },
        {
          new: true,
        }
      );

    if (!completedExecution) {
      const latestExecution =
        await getLatestExecution(
          executionId
        );

      if (
        latestExecution?.status ===
        "cancelled"
      ) {
        return latestExecution;
      }

      throw new Error(
        "Execution could not be completed atomically"
      );
    }

    execution =
      completedExecution;

    emitExecutionUpdate(
      execution
    );

    console.log(
      `Workflow completed successfully: ` +
      `${workflow.name} | ` +
      `Attempt: ${currentAttempt} | ` +
      `Duration: ${
        Date.now() -
        workflowStartedAt
      }ms`
    );

    return execution;
  } catch (error) {
    if (
      error.code ===
      "EXECUTION_CANCELLED"
    ) {
      console.log(
        `Workflow execution cancelled: ` +
        `${executionId} | ` +
        `Attempt: ${currentAttempt}`
      );

      const cancelledExecution =
        await Execution.findOneAndUpdate(
          {
            _id: executionId,

            status: {
              $in: [
                "pending",
                "running",
              ],
            },

            attempt: currentAttempt,
          },
          {
            $set: {
              status: "cancelled",

              error:
                "Workflow execution was cancelled",

              finishedAt:
                new Date(),

              cancelledAt:
                new Date(),
            },
          },
          {
            new: true,
          }
        );

      if (cancelledExecution) {
        emitExecutionUpdate(
          cancelledExecution
        );

        return cancelledExecution;
      }

      const latestExecution =
        await getLatestExecution(
          executionId
        );

      if (
        latestExecution?.status ===
        "cancelled"
      ) {
        return latestExecution;
      }

      throw error;
    }

    if (
      error.code ===
      "EXECUTION_LOCKED"
    ) {
      console.log(
        `Execution already locked: ` +
        `${executionId} | ` +
        `Attempt: ${currentAttempt}`
      );

      throw error;
    }

    const latestExecution =
      await getLatestExecution(
        executionId
      );

    if (
      latestExecution?.status ===
      "cancelled"
    ) {
      console.log(
        `Execution was cancelled while processing: ${executionId}`
      );

      return latestExecution;
    }

    console.error(
      `Workflow execution error | ` +
      `Attempt: ${currentAttempt}:`,
      error
    );

    const failedExecution =
      await Execution.findOneAndUpdate(
        {
          _id: executionId,

          status: {
            $in: [
              "running",
              "pending",
            ],
          },

          attempt: currentAttempt,
        },
        {
          $set: {
            error:
              error.message ||
              "Workflow execution failed",
          },
        },
        {
          new: true,
        }
      );

    if (failedExecution) {
      emitExecutionUpdate(
        failedExecution
      );
    }

    throw error;
  } finally {
    if (registered) {
      unregisterExecution(
        executionId
      );
    }

    if (lock) {
      try {
        await releaseExecutionLock(
          lock.lockKey,
          lock.lockToken,
          lock.renewalTimer
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