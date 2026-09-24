const express = require("express");

const {
  createExecution,
  getExecutions,
  getExecution,
  retryExecution,
  replayExecution,
  cancelExecutionController,
} = require("../controllers/executionController");

const protect =
  require("../middleware/authMiddleware");

const validate =
  require("../middleware/validate");

const {
  createExecutionSchema,
} = require("../validators/executionValidator");

const router =
  express.Router();

router.use(protect);

router.post(
  "/",
  validate(createExecutionSchema),
  createExecution
);

router.get(
  "/",
  getExecutions
);

router.post(
  "/:id/retry",
  retryExecution
);

router.post(
  "/:id/replay",
  replayExecution
);

router.post(
  "/:id/cancel",
  cancelExecutionController
);

router.get(
  "/:id",
  getExecution
);

module.exports = router;