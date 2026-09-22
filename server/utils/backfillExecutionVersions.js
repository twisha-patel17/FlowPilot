const mongoose = require("mongoose");
require("dotenv").config();

const Execution = require("../models/Execution");
const WorkflowVersion = require("../models/WorkflowVersion");

const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "object" &&
    value?._bsontype === "ObjectID"
  ) {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (typeof value === "object") {
    const normalized = {};

    for (const key of Object.keys(value).sort()) {
      normalized[key] =
        normalizeValue(value[key]);
    }

    return normalized;
  }

  return value;
};

const stableStringify = (value) => {
  return JSON.stringify(
    normalizeValue(value)
  );
};

const snapshotsMatchVersion = (
  snapshot,
  version
) => {
  if (!snapshot || !version) {
    return false;
  }

  const snapshotData = {
    name: snapshot.name,
    description:
      snapshot.description || "",
    trigger: snapshot.trigger,
    nodes: snapshot.nodes || [],
    edges: snapshot.edges || [],
  };

  const versionData = {
    name: version.name,
    description:
      version.description || "",
    trigger: version.trigger,
    nodes: version.nodes || [],
    edges: version.edges || [],
  };

  return (
    stableStringify(
      snapshotData
    ) ===
    stableStringify(
      versionData
    )
  );
};

const backfillExecutionVersions =
  async () => {
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

      const executions =
        await Execution.find({
          $or: [
            {
              workflowVersion: {
                $exists: false,
              },
            },
            {
              workflowVersion: null,
            },
          ],
        }).lean();

      console.log(
        `Found ${executions.length} executions requiring migration`
      );

      let migrated = 0;
      let unresolved = 0;

      for (const execution of executions) {
        try {
          if (!execution.workflow) {
            console.log(
              `Skipping execution ${execution._id}: workflow reference missing`
            );

            unresolved++;
            continue;
          }

          const versions =
            await WorkflowVersion.find({
              workflow:
                execution.workflow,
            })
              .sort({
                version: 1,
              })
              .lean();

          if (
            versions.length === 0
          ) {
            console.log(
              `Could not migrate execution ${execution._id}: no workflow versions found`
            );

            unresolved++;
            continue;
          }

          let matchedVersion =
            null;

          /*
           * First preference:
           * use the explicit version stored
           * inside the execution snapshot.
           */
          const snapshotVersion =
            execution
              .workflowSnapshot
              ?.version;

          if (
            Number.isInteger(
              snapshotVersion
            )
          ) {
            matchedVersion =
              versions.find(
                (version) =>
                  version.version ===
                  snapshotVersion
              );
          }

          /*
           * Second preference:
           * compare the actual workflow
           * configuration stored in the
           * execution snapshot.
           */
          if (
            !matchedVersion &&
            execution.workflowSnapshot
          ) {
            matchedVersion =
              versions.find(
                (version) =>
                  snapshotsMatchVersion(
                    execution.workflowSnapshot,
                    version
                  )
              );
          }

          if (!matchedVersion) {
            console.log(
              `Could not safely identify version for execution ${execution._id}`
            );

            unresolved++;
            continue;
          }

          await Execution.updateOne(
            {
              _id: execution._id,
              $or: [
                {
                  workflowVersion: {
                    $exists: false,
                  },
                },
                {
                  workflowVersion: null,
                },
              ],
            },
            {
              $set: {
                workflowVersion:
                  matchedVersion._id,
              },
            }
          );

          migrated++;

          console.log(
            `Migrated execution ${execution._id} -> version ${matchedVersion.version}`
          );
        } catch (error) {
          console.error(
            `Failed to migrate execution ${execution._id}:`,
            error.message
          );

          unresolved++;
        }
      }

      console.log("");
      console.log(
        "Execution version backfill complete"
      );
      console.log(
        `Migrated: ${migrated}`
      );
      console.log(
        `Unresolved: ${unresolved}`
      );

      if (unresolved > 0) {
        console.log("");
        console.log(
          "WARNING: Some executions could not be safely matched to a workflow version."
        );
        console.log(
          "Those executions were intentionally left unchanged."
        );
      }
    } catch (error) {
      console.error(
        "Execution version backfill failed:",
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

backfillExecutionVersions();