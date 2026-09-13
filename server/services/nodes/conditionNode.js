const evaluateCondition = (condition, input) => {
  const fieldValue = input?.[condition.field];

  switch (condition.operator) {
    case "equals":
      return fieldValue === condition.value;

    case "not_equals":
      return fieldValue !== condition.value;

    case "contains":
      return String(fieldValue ?? "").includes(
        String(condition.value ?? "")
      );

    case "greater_than":
      return Number(fieldValue) > Number(condition.value);

    case "less_than":
      return Number(fieldValue) < Number(condition.value);

    case "exists":
      return (
        fieldValue !== undefined &&
        fieldValue !== null
      );

    default:
      throw new Error(
        `Unsupported condition operator: ${condition.operator}`
      );
  }
};

const executeConditionNode = async (node, input) => {
  console.log("Executing condition node");

  const config = node.data?.config || {};

  if (!config.field) {
    throw new Error("Condition field is required");
  }

  if (!config.operator) {
    throw new Error("Condition operator is required");
  }

  const result = evaluateCondition(
    config,
    input
  );

  return {
    success: true,
    output: input || {},
    conditionResult: result,
  };
};

module.exports = executeConditionNode;