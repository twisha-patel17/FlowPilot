const MAX_TRANSACTION_RETRIES = 3;

const isRetryableTransactionError = (
  error
) => {
  if (!error) {
    return false;
  }

  if (
    typeof error.hasErrorLabel ===
    "function"
  ) {
    if (
      error.hasErrorLabel(
        "TransientTransactionError"
      )
    ) {
      return true;
    }

    if (
      error.hasErrorLabel(
        "UnknownTransactionCommitResult"
      )
    ) {
      return true;
    }
  }

  return (
    error.code === 112 ||
    error.codeName ===
      "WriteConflict"
  );
};

const withTransactionRetry = async (
  operation,
  options = {}
) => {
  const maxRetries =
    options.maxRetries ||
    MAX_TRANSACTION_RETRIES;

  let lastError = null;

  for (
    let attempt = 1;
    attempt <= maxRetries;
    attempt++
  ) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (
        !isRetryableTransactionError(
          error
        ) ||
        attempt === maxRetries
      ) {
        throw error;
      }

      const delay =
        50 * Math.pow(2, attempt - 1);

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );
    }
  }

  throw lastError;
};

module.exports = {
  withTransactionRetry,
  isRetryableTransactionError,
};