const express = require("express");

const {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  getWorkflowVersions,
  getWorkflowVersion,
  restoreWorkflowVersion,
  publishWorkflow,
  unpublishWorkflow,
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

router.get(
  "/",
  getWorkflows
);

router.get(
  "/:id/versions",
  getWorkflowVersions
);

router.get(
  "/:id/versions/:version",
  getWorkflowVersion
);

router.post(
  "/:id/versions/:version/restore",
  restoreWorkflowVersion
);

router.get(
  "/:id",
  getWorkflow
);

router.patch(
  "/:id",
  validate(updateWorkflowSchema),
  updateWorkflow
);

router.delete(
  "/:id",
  deleteWorkflow
);

router.patch(
  "/:id/toggle",
  toggleWorkflow
);

router.post(
  "/:id/publish",
  publishWorkflow
);

router.post(
  "/:id/unpublish",
  unpublishWorkflow
);

module.exports = router;