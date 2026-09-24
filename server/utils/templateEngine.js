const TEMPLATE_REGEX = /\{\{\s*([^{}]+?)\s*\}\}/g;
const EXACT_TEMPLATE_REGEX = /^\{\{\s*([^{}]+?)\s*\}\}$/;

const isSafeKey = (key) =>
  !["__proto__", "prototype", "constructor"].includes(key);

const getValueByPath = (object, path) => {
  if (!path) return undefined;

  let current = object;

  for (const part of path.split(".")) {
    if (!isSafeKey(part)) return undefined;
    if (current === null || current === undefined) return undefined;

    current = current[part];
  }

  return current;
};

const resolveTemplateString = (value, context) => {
  if (typeof value !== "string") return value;

  const exactMatch = value.match(EXACT_TEMPLATE_REGEX);

  if (exactMatch) {
    const resolved = getValueByPath(
      context,
      exactMatch[1].trim()
    );

    return resolved === undefined ? "" : resolved;
  }

  return value.replace(TEMPLATE_REGEX, (match, expression) => {
    const resolved = getValueByPath(
      context,
      expression.trim()
    );

    if (resolved === undefined || resolved === null) {
      return "";
    }

    return typeof resolved === "object"
      ? JSON.stringify(resolved)
      : String(resolved);
  });
};

const resolveTemplates = (value, context) => {
  if (typeof value === "string") {
    return resolveTemplateString(value, context);
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      resolveTemplates(item, context)
    );
  }

  if (value !== null && typeof value === "object") {
    const resolved = {};

    for (const [key, item] of Object.entries(value)) {
      resolved[key] = resolveTemplates(item, context);
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