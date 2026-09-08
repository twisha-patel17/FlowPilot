const express = require("express");

const {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
} = require("../controllers/workspaceController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createWorkspace);

router.get("/", getWorkspaces);

router.get("/:id", getWorkspace);

router.patch("/:id", updateWorkspace);

router.delete("/:id", deleteWorkspace);

module.exports = router;