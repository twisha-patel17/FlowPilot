const { Queue } = require("bullmq");

const queueRedisConnection = require("../../config/queueRedis");

const workflowQueue = new Queue("workflow-execution", {
  connection: queueRedisConnection,

  defaultJobOptions: {
    attempts: 3,

    backoff: {
      type: "exponential",
      delay: 5000,
    },

    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

module.exports = workflowQueue;