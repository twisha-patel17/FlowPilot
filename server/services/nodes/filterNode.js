const executeFilterNode = async (node, input = {}) => {
  const config = node.data?.config || {};

  const field = config.field;
  const operator = config.operator;
  const value = config.value;

  if (!field) {
    throw new Error("Filter field is required");
  }

  if (!operator) {
    throw new Error("Filter operator is required");
  }

  const actualValue = input?.data?.[field] ?? input?.[field];

  let passed = false;

  switch (operator) {
    case "equals":
      passed = actualValue == value;
      break;

    case "not_equals":
      passed = actualValue != value;
      break;

    case "contains":
      passed =
        typeof actualValue === "string" &&
        actualValue.includes(value);
      break;

    case "greater_than":
      passed = Number(actualValue) > Number(value);
      break;

    case "less_than":
      passed = Number(actualValue) < Number(value);
      break;

    default:
      throw new Error(`Unsupported filter operator: ${operator}`);
  }

  console.log(
    `Filter: ${field} ${operator} ${value} → ${passed}`
  );

  return {
    success: true,
    output: {
      ...input,
      filterPassed: passed,
    },
  };
};

module.exports = executeFilterNode;