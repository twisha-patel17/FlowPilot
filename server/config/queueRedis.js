const Redis = require("ioredis");

const queueRedisConnection = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
  }
);

queueRedisConnection.on("connect", () => {
  console.log("Queue Redis connected successfully");
});

queueRedisConnection.on("ready", () => {
  console.log("Queue Redis ready");
});

queueRedisConnection.on("reconnecting", (delay) => {
  console.log(
    `Queue Redis reconnecting in ${delay}ms`
  );
});

queueRedisConnection.on("close", () => {
  console.warn(
    "Queue Redis connection closed"
  );
});

queueRedisConnection.on("error", (error) => {
  console.error(
    "Queue Redis error:",
    error.message
  );
});

module.exports = queueRedisConnection;