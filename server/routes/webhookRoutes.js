const express = require("express");

const {
  createWebhook,
  getWebhooks,
  toggleWebhook,
  getWebhookDeliveries,
  receiveWebhook,
} = require("../controllers/webhookController");

const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const {
  createWebhookSchema,
  updateWebhookSchema,
} = require("../validators/webhookValidator");

const router = express.Router();

// Public webhook endpoint
router.post("/:publicId", receiveWebhook);

// Protected webhook management routes
router.use(protect);

router.post(
  "/",
  validate(createWebhookSchema),
  createWebhook
);

router.get("/", getWebhooks);

router.patch(
  "/:id/toggle",
  toggleWebhook
);

router.get(
  "/:id/deliveries",
  getWebhookDeliveries
);

module.exports = router;