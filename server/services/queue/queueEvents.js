const { QueueEvents } = require("bullmq");
const redisConnection = require("../../config/redis");

const workflowQueueEvents = new QueueEvents("workflow-execution", {
  connection: redisConnection,
});

module.exports = workflowQueueEvents;