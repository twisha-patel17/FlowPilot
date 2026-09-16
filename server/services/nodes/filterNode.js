const getNestedValue = (obj, path) =>
  path
    ? path.split(".").reduce((current, key) =>
        current == null ? undefined : current[key], obj)
    : undefined;

const hasValue = (value) =>
  value !== undefined && value !== null;

const executeFilterNode = async (node, input = {}) => {
  const config = node.data?.config || {};
  const field = typeof config.field === "string"
    ? config.field.trim() : "";
  const operator = typeof config.operator === "string"
    ? config.operator.trim() : "";
  const value = config.value;

  if (!field) throw new Error("Filter field is required");
  if (!operator) throw new Error("Filter operator is required");

  const supportedOperators = [
    "equals",
    "not_equals",
    "contains",
    "starts_with",
    "greater_than",
    "less_than",
    "exists",
  ];

  if (!supportedOperators.includes(operator)) {
    throw new Error(`Unsupported filter operator: ${operator}`);
  }

  const source = input?.data &&
    typeof input.data === "object" ? input.data : input;

  let actualValue = getNestedValue(source, field);

  if (actualValue === undefined && source !== input) {
    actualValue = getNestedValue(input, field);
  }

  let passed = false;

  switch (operator) {
    case "equals":
      passed = actualValue === value;
      break;

    case "not_equals":
      passed = actualValue !== value;
      break;

    case "contains":
      if (typeof actualValue === "string") {
        if (typeof value !== "string") {
          throw new Error(
            "Filter contains operator requires a string value"
          );
        }
        passed = actualValue.includes(value);
      } else if (Array.isArray(actualValue)) {
        passed = actualValue.some((item) => item === value);
      }
      break;

    case "starts_with":
      if (typeof actualValue !== "string") break;
      if (typeof value !== "string") {
        throw new Error(
          "Filter starts_with operator requires a string value"
        );
      }
      passed = actualValue.startsWith(value);
      break;

    case "greater_than":
    case "less_than": {
      if (!hasValue(actualValue) || !hasValue(value)) break;

      const actualNumber = Number(actualValue);
      const expectedNumber = Number(value);

      if (
        !Number.isFinite(actualNumber) ||
        !Number.isFinite(expectedNumber)
      ) {
        throw new Error(
          `Filter ${operator} operator requires numeric values`
        );
      }

      passed = operator === "greater_than"
        ? actualNumber > expectedNumber
        : actualNumber < expectedNumber;

      break;
    }

    case "exists":
      passed = actualValue !== undefined;
      break;
  }

  console.log(
    `Filter: ${field} ${operator} ${JSON.stringify(value)} → ${passed}`
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