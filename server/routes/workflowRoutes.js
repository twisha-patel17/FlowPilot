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
const validate = require("../middleware/validate");

const {
  createWorkflowSchema,
  updateWorkflowSchema,
} = require("../validators/workflowValidator");

const router = express.Router();

router.use(protect);

router.post(
  "/",
  validate(createWorkflowSchema),
  createWorkflow
);

router.get("/", getWorkflows);

router.get("/:id", getWorkflow);

router.patch(
  "/:id",
  validate(updateWorkflowSchema),
  updateWorkflow
);

router.delete("/:id", deleteWorkflow);

router.patch("/:id/toggle", toggleWorkflow);

module.exports = router;