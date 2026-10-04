const mongoose = require("mongoose");
const Execution = require("../../models/Execution");
const ExecutionEffect = require("../../models/ExecutionEffect");
const executeNode = require("../nodes/nodeExecutor");
const { emitExecutionUpdate } = require("../socket/socket");

const { resolveTemplates } = require("../../utils/templateEngine");
const {
  resolveBranch,
  getOutgoingEdges,
} = require("../../utils/branchResolver");

const {
  createIdempotencyKey,
} = require("../../utils/idempotency");

const {
  acquireExecutionLock,
  releaseExecutionLock,
} = require("../lock/executionLock");

const {
  acquireWorkspaceConcurrencySlot,
  releaseWorkspaceConcurrencySlot,
} = require("./concurrencyLock");

const {
  registerExecution,
  unregisterExecution,
} = require("./executionCancellation");

const WORKFLOW_TIMEOUT =
  Number(process.env.WORKFLOW_TIMEOUT_MS) ||
  5 * 60 * 1000;

/* =========================================================
   WORKFLOW GRAPH VALIDATION
========================================================= */

const validateWorkflowGraph = (nodes, edges) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    throw new Error("Workflow has no nodes");
  }

  if (!Array.isArray(edges)) {
    throw new Error("Workflow edges are invalid");
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

/* =========================================================
   ERROR HELPERS
========================================================= */

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

const createConcurrencyLimitError = () => {
  const error = new Error(
    "Workspace execution concurrency limit reached"
  );

  error.code =
    "WORKSPACE_CONCURRENCY_LIMIT";

  return error;
};

const throwIfCancelled = (signal) => {
  if (signal?.aborted) {
    throw createCancellationError();
  }
};

/* =========================================================
   TIMEOUT
========================================================= */

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

        reject(createTimeoutError());
      }, timeoutMs);
    });

  return Promise.race([
    promise,
    timeoutPromise,
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
};

/* =========================================================
   EXECUTION STEP HELPERS
========================================================= */

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
  return Execution.findById(executionId);
};

/* =========================================================
   SIDE EFFECT / IDEMPOTENCY
========================================================= */

const isSideEffectNode = (nodeType) => {
  return [
    "http",
    "discord",
    "email",
    "mongodb",
  ].includes(nodeType);
};

const getExecutionEffect = async (
  execution,
  node,
  idempotencyKey
) => {
  return ExecutionEffect.findOne({
    effectScopeId: execution.effectScopeId,
    nodeId: node.id,
    idempotencyKey,
  });
};

const createExecutionEffect = async (
  execution,
  node,
  idempotencyKey
) => {
  try {
    return await ExecutionEffect.create({
      execution: execution._id,
      effectScopeId: execution.effectScopeId,
      workflow: execution.workflow,
      workflowVersion:
        execution.workflowVersion,
      workspace: execution.workspace,
      nodeId: node.id,
      nodeType:
        node.data?.type ||
        node.data?.nodeType ||
        node.type ||
        "unknown",
      idempotencyKey,
      status: "pending",
    });
  } catch (error) {
    if (error.code === 11000) {
      return ExecutionEffect.findOne({
        effectScopeId: execution.effectScopeId,
        nodeId: node.id,
        idempotencyKey,
      });
    }

    throw error;
  }
};

const completeExecutionEffect = async (
  execution,
  node,
  idempotencyKey,
  output
) => {
  return ExecutionEffect.findOneAndUpdate(
    {
      effectScopeId: execution.effectScopeId,
      nodeId: node.id,
      idempotencyKey,
    },
    {
      $set: {
        status: "completed",
        output: output || {},
        error: null,
        completedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
    }
  );
};

/* =========================================================
   EXECUTION CONTEXT
========================================================= */

const buildExecutionContext = (
  execution,
  currentInput
) => {
  const steps = {};

  for (const step of execution.steps || []) {
    if (!step.nodeId) continue;

    steps[step.nodeId] = {
      output: step.output || {},
      status: step.status,
      error: step.error || null,
    };
  }

  return {
    ...(currentInput || {}),

    trigger:
      execution.input || {},

    input:
      currentInput || {},

    steps,
  };
};

/* =========================================================
   MAIN WORKFLOW EXECUTOR
========================================================= */

const executeWorkflow = async (
  executionId,
  attemptNumber = 1
) => {
  let lock = null;
  let concurrencySlot = null;

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
    /* =====================================================
       LOAD EXECUTION
    ===================================================== */

    let execution =
      await Execution.findById(
        executionId
      );

    if (!execution) {
      throw new Error(
        "Execution not found"
      );
    }

    console.log(
      `\n========== EXECUTION START ==========\n` +
        `Execution ID: ${executionId}\n` +
        `Attempt: ${currentAttempt}\n` +
        `Status: ${execution.status}\n` +
        `====================================`
    );

    /*
     * Backward compatibility for executions
     * created before effectScopeId was added.
     */
    if (!execution.effectScopeId) {
      execution.effectScopeId =
        new mongoose.Types.ObjectId();

      await execution.save();
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

    /* =====================================================
       WORKSPACE CONCURRENCY
    ===================================================== */

    concurrencySlot =
      await acquireWorkspaceConcurrencySlot(
        execution.workspace,
        executionId
      );

    if (!concurrencySlot.acquired) {
      console.log(
        `Workspace concurrency limit reached: ` +
          `${execution.workspace} | ` +
          `Execution: ${executionId}`
      );

      throw createConcurrencyLimitError();
    }

    console.log(
      `Workspace concurrency slot acquired: ` +
        `${execution.workspace} | ` +
        `Execution: ${executionId}`
    );

    /* =====================================================
       EXECUTION LOCK
    ===================================================== */

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

    /* =====================================================
       RELOAD EXECUTION
    ===================================================== */

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

    /* =====================================================
       ATOMIC EXECUTION CLAIM
    ===================================================== */

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
          returnDocument: "after",
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

    console.log(
      `Execution claimed successfully: ${executionId}`
    );

    /* =====================================================
       REGISTER CANCELLATION
    ===================================================== */

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

    /* =====================================================
       WORKFLOW SNAPSHOT
    ===================================================== */

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

    /* =====================================================
       DEBUG WORKFLOW GRAPH
    ===================================================== */

    console.log(
      "\n========== WORKFLOW GRAPH DEBUG =========="
    );

    console.log(
      "Workflow:",
      workflow.name
    );

    console.log(
      "Workflow ID:",
      workflow._id
    );

    console.log(
      "Node count:",
      nodes.length
    );

    console.log(
      "Edge count:",
      edges.length
    );

    console.log(
      "Nodes:",
      JSON.stringify(
        nodes,
        null,
        2
      )
    );

    console.log(
      "Edges:",
      JSON.stringify(
        edges,
        null,
        2
      )
    );

    console.log(
      "==========================================\n"
    );

    /* =====================================================
       GRAPH VALIDATION
    ===================================================== */

    let currentNode;

    try {
      currentNode =
        validateWorkflowGraph(
          nodes,
          edges
        );
    } catch (graphError) {
      console.error(
        "\n========== GRAPH VALIDATION FAILED =========="
      );

      console.error(
        "Error:",
        graphError.message
      );

      console.error(
        "Nodes:",
        JSON.stringify(
          nodes,
          null,
          2
        )
      );

      console.error(
        "Edges:",
        JSON.stringify(
          edges,
          null,
          2
        )
      );

      console.error(
        "=============================================\n"
      );

      throw graphError;
    }

    console.log(
      "Starting node detected:",
      currentNode.id
    );

    console.log(
      "Starting node type:",
      currentNode.data?.type ||
        currentNode.data?.nodeType ||
        currentNode.type ||
        "unknown"
    );

    /* =====================================================
       INITIAL INPUT
    ===================================================== */

    let input =
      execution.input || {};

    console.log(
      "Initial execution input:",
      JSON.stringify(
        input,
        null,
        2
      )
    );

    const visitedNodes =
      new Set();

    /* =====================================================
       WORKFLOW LOOP
    ===================================================== */

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

      /* ===================================================
         CREATE STEP
      =================================================== */

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

      console.log(
        `Step created successfully: ${currentNode.id}`
      );

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

      /* ===================================================
         TIME REMAINING
      =================================================== */

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

      /* ===================================================
         EXECUTION CONTEXT
      =================================================== */

      const executionContext =
        buildExecutionContext(
          execution,
          input
        );

      const resolvedNode =
        resolveTemplates(
          currentNode,
          executionContext
        );

      const resolvedInput =
        resolveTemplates(
          input,
          executionContext
        );

      console.log(
        `Resolved input for ${currentNode.id}:`,
        JSON.stringify(
          resolvedInput,
          null,
          2
        )
      );

      /* ===================================================
         IDEMPOTENCY
      =================================================== */

      const idempotencyKey =
        createIdempotencyKey(
          execution.effectScopeId.toString(),
          currentNode.id
        );

      if (isSideEffectNode(nodeType)) {
        const existingEffect =
          await getExecutionEffect(
            execution,
            currentNode,
            idempotencyKey
          );

        if (
          existingEffect?.status ===
          "completed"
        ) {
          console.log(
            `Reusing completed side effect: ${currentNode.id}`
          );

          const stepUpdated =
            await updateStep(
              executionId,
              currentAttempt,
              stepId,
              {
                input: resolvedInput,
                status: "success",
                output:
                  existingEffect.output ||
                  {},
                duration:
                  Date.now() -
                  stepStartedAt,
              }
            );

          if (!stepUpdated) {
            throw new Error(
              "Workflow step could not be completed from existing side effect"
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
            existingEffect.output ||
            {};

          const outgoingEdges =
            getOutgoingEdges(
              edges,
              currentNode.id
            );

          const nextEdge =
            outgoingEdges[0] || null;

          if (!nextEdge) {
            currentNode = null;
          } else {
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

          continue;
        }

        await createExecutionEffect(
          execution,
          currentNode,
          idempotencyKey
        );
      }

      /* ===================================================
         EXECUTE NODE
      =================================================== */

      let result;

      try {
        console.log(
          `Calling node executor: ${nodeType}`
        );

        result =
          await withTimeout(
            executeNode(
              resolvedNode,
              resolvedInput,
              {
                userId:
                  execution.owner,
                workspaceId:
                  execution.workspace,
                signal,
                trigger:
                  executionContext.trigger,
                steps:
                  executionContext.steps,
                idempotencyKey,
              }
            ),
            remainingTime,
            controller
          );

        console.log(
          `Node executor result for ${currentNode.id}:`,
          JSON.stringify(
            result,
            null,
            2
          )
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

        /* ===============================================
           COMPLETE SIDE EFFECT
        =============================================== */

        if (isSideEffectNode(nodeType)) {
          const completedEffect =
            await completeExecutionEffect(
              execution,
              currentNode,
              idempotencyKey,
              result.output || {}
            );

          if (!completedEffect) {
            throw new Error(
              "Execution effect could not be marked as completed"
            );
          }
        }

        /* ===============================================
           UPDATE STEP
        =============================================== */

        const stepUpdated =
          await updateStep(
            executionId,
            currentAttempt,
            stepId,
            {
              input: resolvedInput,
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

        console.log(
          `Node completed successfully: ${currentNode.id}`
        );
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

        console.error(
          `Node execution failed: ${currentNode.id}`,
          error
        );

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

      /* ===================================================
         POST-NODE CHECKS
      =================================================== */

      throwIfCancelled(signal);

      if (
        Date.now() -
          workflowStartedAt >=
        WORKFLOW_TIMEOUT
      ) {
        controller.abort();

        throw createTimeoutError();
      }

      /* ===================================================
         BRANCH RESOLUTION
      =================================================== */

      const branch =
        nodeType === "condition"
          ? resolveBranch(result)
          : nodeType === "switch"
            ? result.switchResult
                ?.selectedHandle || null
            : null;

      if (
        nodeType === "condition"
      ) {
        console.log(
          `Condition result:`,
          result.conditionResult
        );

        console.log(
          `Condition branch:`,
          branch
        );
      }

      if (
        nodeType === "switch"
      ) {
        console.log(
          `Switch branch:`,
          branch
        );
      }

      /* ===================================================
         FILTER
      =================================================== */

      if (
        nodeType === "filter"
      ) {
        if (
          typeof result.filterPassed !==
          "boolean"
        ) {
          throw new Error(
            "Filter node did not return a valid filter result"
          );
        }

        console.log(
          `Filter result:`,
          result.filterPassed
        );

        /*
         * Filter acts as a gate.
         *
         * TRUE  → continue to the next node
         * FALSE → stop the workflow successfully
         */

        if (!result.filterPassed) {
          console.log(
            `Filter rejected input. Stopping workflow.`
          );

          currentNode = null;
          continue;
        }
      }

      /* ===================================================
         GET OUTGOING EDGES
      =================================================== */

      const outgoingEdges =
        getOutgoingEdges(
          edges,
          currentNode.id,
          branch
        );

      console.log(
        `Outgoing edges from ${currentNode.id}:`,
        JSON.stringify(
          outgoingEdges,
          null,
          2
        )
      );

      let nextEdge =
        outgoingEdges[0] || null;

      /* ===================================================
         CONDITION
      =================================================== */

      if (
        nodeType === "condition"
      ) {
        if (
          typeof result.conditionResult !==
          "boolean"
        ) {
          throw new Error(
            "Condition node did not return a valid condition result"
          );
        }

        if (!branch) {
          throw new Error(
            "Condition node did not return a valid branch"
          );
        }

        if (!nextEdge) {
          console.log(
            `No "${branch}" branch found for condition node`
          );

          currentNode = null;
          continue;
        }
      }

      /* ===================================================
         SWITCH
      =================================================== */

      if (
        nodeType === "switch"
      ) {
        if (!branch) {
          throw new Error(
            "Switch node did not return a valid selected handle"
          );
        }

        if (!nextEdge) {
          console.log(
            `No "${branch}" branch found for switch node`
          );

          currentNode = null;
          continue;
        }
      }

      /* ===================================================
         NEXT NODE
      =================================================== */

      if (!nextEdge) {
        console.log(
          `No outgoing edge from node: ${currentNode.id}`
        );

        currentNode = null;
        continue;
      }

      console.log(
        `Next edge: ${nextEdge.source} -> ${nextEdge.target}`
      );

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

      console.log(
        `Next node selected: ${currentNode.id}`
      );
    }

    /* =====================================================
       FINAL EXECUTION CHECK
    ===================================================== */

    throwIfCancelled(signal);

    if (
      Date.now() -
        workflowStartedAt >=
      WORKFLOW_TIMEOUT
    ) {
      controller.abort();

      throw createTimeoutError();
    }

    /* =====================================================
       MARK EXECUTION SUCCESS
    ===================================================== */

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
          returnDocument: "after",
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
      `\n========== WORKFLOW SUCCESS ==========\n` +
        `Workflow: ${workflow.name}\n` +
        `Execution: ${executionId}\n` +
        `Attempt: ${currentAttempt}\n` +
        `Duration: ${
          Date.now() -
          workflowStartedAt
        }ms\n` +
        `=====================================\n`
    );

    return execution;
  } catch (error) {
    /* =====================================================
       CONCURRENCY LIMIT
    ===================================================== */

    if (
      error.code ===
      "WORKSPACE_CONCURRENCY_LIMIT"
    ) {
      console.log(
        `Workspace concurrency limit reached; ` +
          `execution will retry: ${executionId}`
      );

      throw error;
    }

    /* =====================================================
       CANCELLATION
    ===================================================== */

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
            returnDocument: "after",
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
      "\n========== WORKFLOW EXECUTION ERROR =========="
    );

    console.error(
      `Execution: ${executionId}`
    );

    console.error(
      `Attempt: ${currentAttempt}`
    );

    console.error(
      `Error: ${error.message}`
    );

    console.error(
      error.stack
    );

    console.error(
      "==============================================\n"
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
            status: "failed",
            error:
              error.message ||
              "Workflow execution failed",
            finishedAt:
              new Date(),
          },
        },
        {
          returnDocument: "after",
        }
      );

    if (failedExecution) {
      emitExecutionUpdate(
        failedExecution
      );

      console.log(
        `Execution marked as failed: ${executionId}`
      );
    } else {
      console.log(
        `Could not mark execution as failed because execution state changed: ${executionId}`
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

    if (concurrencySlot) {
      try {
        await releaseWorkspaceConcurrencySlot(
          concurrencySlot.key,
          concurrencySlot.token
        );

        console.log(
          `Workspace concurrency slot released: ` +
            `${executionId}`
        );
      } catch (releaseError) {
        console.error(
          `Failed to release workspace concurrency slot: ` +
            `${executionId}`,
          releaseError
        );
      }
    }

    console.log(
      `========== EXECUTION END: ${executionId} ==========\n`
    );
  }
};

module.exports = executeWorkflow;