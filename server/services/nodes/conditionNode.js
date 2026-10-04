const {
  evaluateCondition,
} = require("../../utils/conditionEvaluator");

const executeConditionNode = async (
  node,
  input = {},
  context = {}
) => {
  console.log("Executing condition node");

  const config = node.data?.config || {};

  const field =
    typeof config.field === "string"
      ? config.field.trim()
      : "";

  const operator =
    typeof config.operator === "string"
      ? config.operator.trim()
      : "";

  if (!field) {
    throw new Error("Condition field is required");
  }

  if (!operator) {
    throw new Error("Condition operator is required");
  }

  const evaluationContext = {
    ...input,

    input,
    trigger: context.trigger || input,
    steps: context.steps || {},
  };

  const conditionResult = evaluateCondition(
    {
      ...config,
      field,
      operator,
    },
    evaluationContext
  );

  console.log(
    `Condition: ${field} ${operator} → ${conditionResult}`
  );

  return {
    success: true,
    output: input || {},
    conditionResult,
    branch: conditionResult ? "true" : "false",
  };
};

module.exports = executeConditionNode;