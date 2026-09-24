const DEFAULT_MAX_ATTEMPTS = 3;

const DEFAULT_BACKOFF_DELAY = 2000;

const MAX_BACKOFF_DELAY = 30000;

const getRetryPolicy = () => {
  const maxAttempts =
    Number(process.env.WORKFLOW_MAX_ATTEMPTS) ||
    DEFAULT_MAX_ATTEMPTS;

  const backoffDelay =
    Number(process.env.WORKFLOW_RETRY_DELAY_MS) ||
    DEFAULT_BACKOFF_DELAY;

  return {
    attempts: Math.max(1, Math.min(maxAttempts, 10)),

    backoff: {
      type: "exponential",
      delay: Math.max(
        100,
        Math.min(backoffDelay, MAX_BACKOFF_DELAY)
      ),
    },
  };
};

module.exports = {
  getRetryPolicy,
};