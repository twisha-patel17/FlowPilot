const { QueueEvents } = require("bullmq");

const queueRedisConnection = require("../../config/queueRedis");

const workflowQueueEvents = new QueueEvents(
  "workflow-execution",
  {
    connection: queueRedisConnection,
  }
);

module.exports = workflowQueueEvents;