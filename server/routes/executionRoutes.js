const express = require("express");

const {
  createExecution,
} = require("../controllers/executionController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createExecution);

module.exports = router;