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

const executeSwitchNode = async (
  node,
  input = {}
) => {
  console.log(
    "Executing switch node"
  );

  const config =
    node.data?.config || {};

  const field =
    typeof config.field === "string"
      ? config.field.trim()
      : "";

  if (!field) {
    throw new Error(
      "Switch field is required"
    );
  }

  if (
    typeof config.cases !== "string"
  ) {
    throw new Error(
      "Switch cases are required"
    );
  }
  const cases =
    config.cases
      .split(",")
      .map((value) =>
        value.trim()
      )
      .filter(Boolean);

  if (cases.length === 0) {
    throw new Error(
      "At least one switch case is required"
    );
  }

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
  const normalizedValue =
    fieldValue === null ||
    fieldValue === undefined
      ? ""
      : String(fieldValue).trim();

  const matchedIndex =
    cases.findIndex(
      (caseValue) =>
        normalizedValue ===
        caseValue
    );

  const matched =
    matchedIndex !== -1;

  const selectedHandle =
    matched
      ? `case-${matchedIndex}`
      : "default";

  const result = {
    field,
    value: fieldValue,

    matched,

    matchedIndex,

    matchedCase:
      matched
        ? cases[matchedIndex]
        : null,

    selectedHandle,

    cases,
  };

  console.log(
    `Switch: ${field} = ${JSON.stringify(
      fieldValue
    )} → ${selectedHandle}`
  );

  return {
    success: true,

    output: {
      ...input,
      switchResult: result,
    },

    switchResult: result,
  };
};

module.exports =
  executeSwitchNode;