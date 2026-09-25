const redisConnection = require("../../config/redis");

const DEFAULT_WORKSPACE_LIMIT = 5;

const getWorkspaceConcurrencyLimit = () => {
  const configuredLimit =
    Number(
      process.env.WORKSPACE_CONCURRENCY_LIMIT
    );

  if (
    !Number.isFinite(
      configuredLimit
    )
  ) {
    return DEFAULT_WORKSPACE_LIMIT;
  }

  return Math.max(
    1,
    Math.min(
      Math.floor(configuredLimit),
      100
    )
  );
};

const acquireWorkspaceConcurrencySlot =
  async (workspaceId, executionId) => {
    if (!workspaceId) {
      throw new Error(
        "Workspace ID is required for concurrency control"
      );
    }

    if (!executionId) {
      throw new Error(
        "Execution ID is required for concurrency control"
      );
    }

    const limit =
      getWorkspaceConcurrencyLimit();

    const key =
      `workspace-concurrency:${workspaceId}`;

    const token =
      executionId.toString();

    const script = `
      local key = KEYS[1]
      local token = ARGV[1]
      local limit = tonumber(ARGV[2])

      if redis.call("SISMEMBER", key, token) == 1 then
        return 1
      end

      local count =
        redis.call("SCARD", key)

      if count >= limit then
        return 0
      end

      redis.call("SADD", key, token)

      return 1
    `;

    const acquired =
      await redisConnection.eval(
        script,
        1,
        key,
        token,
        limit
      );

    return {
      acquired: acquired === 1,
      key,
      token,
    };
  };

const releaseWorkspaceConcurrencySlot =
  async (
    key,
    token
  ) => {
    if (!key || !token) {
      return;
    }

    const script = `
      return redis.call(
        "SREM",
        KEYS[1],
        ARGV[1]
      )
    `;

    await redisConnection.eval(
      script,
      1,
      key,
      token
    );

    const remaining =
      await redisConnection.scard(
        key
      );

    if (remaining === 0) {
      await redisConnection.del(
        key
      );
    }
  };

module.exports = {
  acquireWorkspaceConcurrencySlot,
  releaseWorkspaceConcurrencySlot,
  getWorkspaceConcurrencyLimit,
};