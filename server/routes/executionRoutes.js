const express = require("express");

const {
  createExecution,
  getExecutions,
  getExecution,
} = require("../controllers/executionController");

const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const {
  createExecutionSchema,
} = require("../validators/executionValidator");

const router = express.Router();

router.use(protect);

router.post("/", validate(createExecutionSchema), createExecution);

router.get("/", getExecutions);

router.get("/:id", getExecution);

module.exports = router;