const express = require("express");

const {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
} = require("../controllers/workspaceController");

const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const {
  createWorkspaceSchema,
  updateWorkspaceSchema,
} = require("../validators/workspaceValidator");

const router = express.Router();

router.use(protect);

router.post(
  "/",
  validate(createWorkspaceSchema),
  createWorkspace
);

router.get("/", getWorkspaces);

router.get("/:id", getWorkspace);

router.patch(
  "/:id",
  validate(updateWorkspaceSchema),
  updateWorkspace
);

router.delete("/:id", deleteWorkspace);

module.exports = router;