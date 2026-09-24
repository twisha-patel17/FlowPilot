const getValueByPath = (object, path) => {
  if (!path) return undefined;

  let current = object;

  for (const key of path.split(".")) {
    if (
      key === "__proto__" ||
      key === "prototype" ||
      key === "constructor"
    ) {
      return undefined;
    }

    if (current === null || current === undefined) {
      return undefined;
    }

    current = current[key];
  }

  return current;
};

const compareValues = (left, operator, right) => {
  switch (operator) {
    case "equals":
      return left === right;

    case "not_equals":
      return left !== right;

    case "contains":
      return typeof left === "string"
        ? left.includes(String(right))
        : Array.isArray(left)
          ? left.includes(right)
          : false;

    case "not_contains":
      return typeof left === "string"
        ? !left.includes(String(right))
        : Array.isArray(left)
          ? !left.includes(right)
          : true;

    case "greater_than":
      return Number(left) > Number(right);

    case "less_than":
      return Number(left) < Number(right);

    case "greater_than_or_equal":
      return Number(left) >= Number(right);

    case "less_than_or_equal":
      return Number(left) <= Number(right);

    case "exists":
      return left !== undefined && left !== null;

    case "not_exists":
      return left === undefined || left === null;

    case "is_true":
      return left === true;

    case "is_false":
      return left === false;

    default:
      throw new Error(`Unsupported condition operator: ${operator}`);
  }
};

const evaluateCondition = (condition, context) => {
  const left = getValueByPath(
    context,
    condition.field
  );

  return compareValues(
    left,
    condition.operator,
    condition.value
  );
};

const evaluateConditions = (conditions, logic = "AND", context) => {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return true;
  }

  const results = conditions.map((condition) =>
    evaluateCondition(condition, context)
  );

  return logic === "OR"
    ? results.some(Boolean)
    : results.every(Boolean);
};

module.exports = {
  evaluateCondition,
  evaluateConditions,
  getValueByPath,
};