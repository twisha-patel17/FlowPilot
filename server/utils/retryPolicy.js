const isRetryableError = (error) => {
  if (!error) {
    return true;
  }

  const statusCode =
    error.statusCode ||
    error.response?.status;

  const permanentStatusCodes = [
    400,
    401,
    403,
    404,
    422,
  ];

  if (
    permanentStatusCodes.includes(
      statusCode
    )
  ) {
    return false;
  }

  const message = String(
    error.message || ""
  ).toLowerCase();

  const permanentPatterns = [
    "unsupported node type",
    "invalid workflow",
    "configuration is required",
    "invalid credentials",
    "authentication failed",
    "unauthorized",
    "forbidden",
  ];

  if (
    permanentPatterns.some((pattern) =>
      message.includes(pattern)
    )
  ) {
    return false;
  }
  return true;
};

module.exports = {
  isRetryableError,
};