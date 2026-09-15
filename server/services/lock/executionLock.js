const redisConnection = require("../../config/redis");

const LOCK_TTL = 60 * 1000; // 60 seconds
const LOCK_RENEW_INTERVAL = 20 * 1000; // 20 seconds

const acquireExecutionLock = async (
  executionId
) => {
  const lockKey =
    `execution-lock:${executionId}`;

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

  let renewing = false;

  const renewLock = async () => {
    if (renewing) {
      return;
    }

    renewing = true;

    try {
      const renewScript = `
        if redis.call("get", KEYS[1]) == ARGV[1]
        then
          return redis.call(
            "pexpire",
            KEYS[1],
            ARGV[2]
          )
        else
          return 0
        end
      `;

      const renewed =
        await redisConnection.eval(
          renewScript,
          1,
          lockKey,
          lockToken,
          LOCK_TTL
        );

      if (renewed === 1) {
        console.log(
          `Execution lock renewed: ${executionId}`
        );
      } else {
        console.error(
          `Execution lock renewal failed: ${executionId}`
        );
      }
    } catch (error) {
      console.error(
        `Execution lock renewal error: ${executionId}`,
        error.message
      );
    } finally {
      renewing = false;
    }
  };

  const renewalTimer =
    setInterval(
      renewLock,
      LOCK_RENEW_INTERVAL
    );

  /*
   * Do not keep Node.js alive only because
   * of the lock renewal timer.
   */
  renewalTimer.unref?.();

  return {
    lockKey,
    lockToken,
    renewalTimer,
  };
};

const releaseExecutionLock = async (
  lockKey,
  lockToken,
  renewalTimer
) => {
  /*
   * Stop renewing before releasing the lock.
   */
  if (renewalTimer) {
    clearInterval(renewalTimer);
  }

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