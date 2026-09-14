const redisConnection = require("../../config/redis");

const LOCK_TTL = 60 * 1000; // 60 seconds

const acquireExecutionLock = async (executionId) => {
  const lockKey = `execution-lock:${executionId}`;

  const lockToken =
    `${process.pid}-${Date.now()}-${Math.random()}`;

  const acquired =
    await redisConnection.set(
      lockKey,
      lockToken,
      "PX",
      LOCK_TTL,
      "NX"
    );

  if (acquired !== "OK") {
    return null;
  }

  return {
    lockKey,
    lockToken,
  };
};

const releaseExecutionLock = async (
  lockKey,
  lockToken
) => {
  const releaseScript = `
    if redis.call("get", KEYS[1]) == ARGV[1]
    then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  await redisConnection.eval(
    releaseScript,
    1,
    lockKey,
    lockToken
  );
};

module.exports = {
  acquireExecutionLock,
  releaseExecutionLock,
};