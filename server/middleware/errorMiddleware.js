const errorHandler = (err, req, res, next) => {
  console.error("Server Error:", err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.isJoi) {
    statusCode = 400;
    message = "Validation failed";
  }

  if (err.code === 11000) {
    statusCode = 409;

    const field = Object.keys(err.keyValue || {})[0];

    message = field
      ? `${field} already exists`
      : "Duplicate value already exists";
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Database validation failed";
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID";
  }

  res.status(statusCode).json({
    message,
  });
};

module.exports = errorHandler;