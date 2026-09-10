const { Queue } = require("bullmq");

const redisConnection = require("../../config/redis");

const workflowQueue = new Queue("workflow-execution", {
  connection: redisConnection,

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