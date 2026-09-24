const TEMPLATE_REGEX = /\{\{\s*([^{}]+?)\s*\}\}/g;

const isSafeKey = (key) => {
  return ![
    "__proto__",
    "prototype",
    "constructor",
  ].includes(key);
};

const getValueByPath = (object, path) => {
  if (!path) return undefined;

  const parts = path.split(".");

  let current = object;

  for (const part of parts) {
    if (!isSafeKey(part)) return undefined;

    if (
      current === null ||
      current === undefined
    ) {
      return undefined;
    }

    if (
      typeof current !== "object" &&
      typeof current !== "function"
    ) {
      return undefined;
    }

    current = current[part];
  }

  return current;
};

const resolveTemplateString = (
  value,
  context
) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(
    TEMPLATE_REGEX,
    (match, expression) => {
      const path = expression.trim();

      const resolved = getValueByPath(
        context,
        path
      );

      if (
        resolved === undefined ||
        resolved === null
      ) {
        return "";
      }

      if (
        typeof resolved === "object"
      ) {
        return JSON.stringify(resolved);
      }

      return String(resolved);
    }
  );
};

const resolveTemplates = (
  value,
  context
) => {
  if (typeof value === "string") {
    return resolveTemplateString(
      value,
      context
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      resolveTemplates(item, context)
    );
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    const resolved = {};

    for (const [key, item] of Object.entries(
      value
    )) {
      resolved[key] = resolveTemplates(
        item,
        context
      );
    }

    return resolved;
  }

  return value;
};

module.exports = {
  resolveTemplates,
  resolveTemplateString,
  getValueByPath,
};