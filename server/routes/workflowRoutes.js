const express = require("express");

const {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
} = require("../controllers/workflowController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createWorkflow);

router.get("/", getWorkflows);

router.get("/:id", getWorkflow);

router.patch("/:id", updateWorkflow);

router.delete("/:id", deleteWorkflow);

router.patch("/:id/toggle", toggleWorkflow);

module.exports = router;