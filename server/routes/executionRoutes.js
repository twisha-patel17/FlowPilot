const express = require("express");

const {
  createExecution,
  getExecutions,
  getExecution,
} = require("../controllers/executionController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createExecution);

router.get("/", getExecutions);

router.get("/:id", getExecution);

module.exports = router;