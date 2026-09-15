const getNestedValue = (object, path) => {
  if (!path) {
    return undefined;
  }

  return path
    .split(".")
    .reduce((current, key) => {
      if (
        current === null ||
        current === undefined
      ) {
        return undefined;
      }

      return current[key];
    }, object);
};

const hasValue = (value) => {
  return (
    value !== undefined &&
    value !== null
  );
};

const evaluateCondition = (
  condition,
  input
) => {
  const field =
    typeof condition.field === "string"
      ? condition.field.trim()
      : "";

  const operator =
    typeof condition.operator === "string"
      ? condition.operator.trim()
      : "";

  const value =
    condition.value;

  const source =
    input?.data &&
    typeof input.data === "object"
      ? input.data
      : input;

  let fieldValue =
    getNestedValue(
      source,
      field
    );

  if (
    fieldValue === undefined &&
    source !== input
  ) {
    fieldValue =
      getNestedValue(
        input,
        field
      );
  }

  switch (operator) {
    case "equals":
      return fieldValue === value;

    case "not_equals":
      return fieldValue !== value;

    case "contains": {
      if (
        typeof fieldValue === "string"
      ) {
        if (
          typeof value !== "string"
        ) {
          throw new Error(
            "Condition contains operator requires a string value"
          );
        }

        return fieldValue.includes(
          value
        );
      }

      if (
        Array.isArray(fieldValue)
      ) {
        return fieldValue.some(
          (item) =>
            item === value
        );
      }

      return false;
    }

    case "greater_than": {
      if (
        !hasValue(fieldValue) ||
        !hasValue(value)
      ) {
        return false;
      }

      const actualNumber =
        Number(fieldValue);

      const expectedNumber =
        Number(value);

      if (
        !Number.isFinite(
          actualNumber
        ) ||
        !Number.isFinite(
          expectedNumber
        )
      ) {
        throw new Error(
          "Condition greater_than operator requires numeric values"
        );
      }

      return (
        actualNumber >
        expectedNumber
      );
    }

    case "less_than": {
      if (
        !hasValue(fieldValue) ||
        !hasValue(value)
      ) {
        return false;
      }

      const actualNumber =
        Number(fieldValue);

      const expectedNumber =
        Number(value);

      if (
        !Number.isFinite(
          actualNumber
        ) ||
        !Number.isFinite(
          expectedNumber
        )
      ) {
        throw new Error(
          "Condition less_than operator requires numeric values"
        );
      }

      return (
        actualNumber <
        expectedNumber
      );
    }

    case "exists":
      return (
        fieldValue !== undefined
      );

    default:
      throw new Error(
        `Unsupported condition operator: ${operator}`
      );
  }
};

const executeConditionNode = async (
  node,
  input = {}
) => {
  console.log(
    "Executing condition node"
  );

  const config =
    node.data?.config || {};

  const field =
    typeof config.field === "string"
      ? config.field.trim()
      : "";

  const operator =
    typeof config.operator === "string"
      ? config.operator.trim()
      : "";

  if (!field) {
    throw new Error(
      "Condition field is required"
    );
  }

  if (!operator) {
    throw new Error(
      "Condition operator is required"
    );
  }

  const supportedOperators = [
    "equals",
    "not_equals",
    "contains",
    "greater_than",
    "less_than",
    "exists",
  ];

  if (
    !supportedOperators.includes(
      operator
    )
  ) {
    throw new Error(
      `Unsupported condition operator: ${operator}`
    );
  }

  const conditionResult =
    evaluateCondition(
      config,
      input
    );

  console.log(
    `Condition: ${field} ${operator} ${JSON.stringify(
      config.value
    )} → ${conditionResult}`
  );

  return {
    success: true,
    output: input || {},
    conditionResult,
  };
};

module.exports =
  executeConditionNode;