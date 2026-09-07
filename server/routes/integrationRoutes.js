const express = require("express");

const {
  createIntegration,
  getIntegrations,
  getIntegration,
  updateIntegration,
  toggleIntegration,
  deleteIntegration,
} = require("../controllers/integrationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createIntegration);

router.get("/", getIntegrations);

router.get("/:id", getIntegration);

router.patch("/:id", updateIntegration);

router.patch("/:id/toggle", toggleIntegration);

router.delete("/:id", deleteIntegration);

module.exports = router;