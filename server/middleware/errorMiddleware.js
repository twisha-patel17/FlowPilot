const errorHandler = (err, req, res, next) => {
  console.error("Server Error:", {
    name: err.name,
    message: err.message,
    code: err.code,
    path: req.originalUrl,
    method: req.method,
  });

  let statusCode =
    Number.isInteger(err.statusCode) &&
    err.statusCode >= 400 &&
    err.statusCode < 600
      ? err.statusCode
      : 500;

  let message =
    statusCode >= 500
      ? "Internal server error"
      : err.message || "Request failed";

  if (err.isJoi) {
    statusCode = 400;
    message = "Validation failed";
  }

  if (err.code === 11000) {
    statusCode = 409;

    const field =
      Object.keys(
        err.keyValue || {}
      )[0];

    message = field
      ? `${field} already exists`
      : "Duplicate value already exists";
  }

  if (
    err.name ===
    "ValidationError"
  ) {
    statusCode = 400;
    message =
      "Database validation failed";
  }

  if (
    err.name ===
    "CastError"
  ) {
    statusCode = 400;
    message =
      "Invalid resource ID";
  }

  if (statusCode >= 500) {
    message =
      process.env.NODE_ENV ===
      "production"
        ? "Internal server error"
        : message;
  }

  return res
    .status(statusCode)
    .json({
      message,
    });
};

module.exports = errorHandler;