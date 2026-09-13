const crypto = require("crypto");
const mongoose = require("mongoose");

require("dotenv").config();

const Webhook = require("../models/Webhook");

const addWebhookSecrets = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const webhooks =
      await Webhook.find({
        $or: [
          { secret: { $exists: false } },
          { secret: null },
          { secret: "" },
        ],
      }).select("+secret");

    console.log(
      `Webhooks without secrets: ${webhooks.length}`
    );

    for (const webhook of webhooks) {
      webhook.secret = crypto
        .randomBytes(32)
        .toString("hex");

      await webhook.save();

      console.log(
        `Secret added: ${webhook.publicId}`
      );
    }

    console.log(
      "Webhook secret migration completed"
    );
  } catch (error) {
    console.error(
      "Webhook secret migration failed:",
      error
    );
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

addWebhookSecrets();