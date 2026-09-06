const express = require("express");

const {
  createWebhook,
  getWebhooks,
  toggleWebhook,
  getWebhookDeliveries,
  receiveWebhook,
} = require("../controllers/webhookController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/:publicId", receiveWebhook);

router.use(protect);

router.post("/", createWebhook);

router.get("/", getWebhooks);

router.patch("/:id/toggle", toggleWebhook);

router.get("/:id/deliveries", getWebhookDeliveries);

module.exports = router;