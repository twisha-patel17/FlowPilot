const mongoose = require("mongoose");
require("dotenv").config();

const Workflow = require("../models/Workflow");

const backfillPublishedVersions = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is not configured"
      );
    }

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "MongoDB connected"
    );

    const activeResult =
      await Workflow.updateMany(
        {
          status: "active",
          $or: [
            {
              publishedVersion: {
                $exists: false,
              },
            },
            {
              publishedVersion: null,
            },
          ],
        },
        [
          {
            $set: {
              publishedVersion:
                "$currentVersion",
            },
          },
        ]
      );

    const inactiveResult =
      await Workflow.updateMany(
        {
          status: "inactive",
          $or: [
            {
              publishedVersion: {
                $exists: false,
              },
            },
            {
              publishedVersion: null,
            },
          ],
        },
        {
          $set: {
            publishedVersion: null,
          },
        }
      );

    console.log("");
    console.log(
      "Published version backfill complete"
    );

    console.log(
      `Active workflows updated: ${activeResult.modifiedCount}`
    );

    console.log(
      `Inactive workflows checked: ${inactiveResult.modifiedCount}`
    );
  } catch (error) {
    console.error(
      "Published version backfill failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();

    console.log(
      "MongoDB connection closed"
    );
  }
};

backfillPublishedVersions();