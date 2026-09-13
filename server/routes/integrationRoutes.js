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
const validate = require("../middleware/validate");

const {
  createIntegrationSchema,
  updateIntegrationSchema,
} = require("../validators/integrationValidator");

const router = express.Router();

router.use(protect);

router.post(
  "/",
  validate(createIntegrationSchema),
  createIntegration
);

router.get("/", getIntegrations);

router.get("/:id", getIntegration);

router.patch(
  "/:id",
  validate(updateIntegrationSchema),
  updateIntegration
);

router.patch("/:id/toggle", toggleIntegration);

router.delete("/:id", deleteIntegration);

module.exports = router;