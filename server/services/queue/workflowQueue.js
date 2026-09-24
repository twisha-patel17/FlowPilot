const { Queue } = require("bullmq");

const queueRedisConnection = require("../../config/queueRedis");
const { getRetryPolicy } = require("../../config/retry");

const workflowQueue = new Queue("workflow-execution", {
  connection: queueRedisConnection,

  defaultJobOptions: {
    ...getRetryPolicy(),

    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

module.exports = workflowQueue;