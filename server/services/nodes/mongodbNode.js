const { MongoClient } = require("mongodb");
const getIntegration = require("../integrations/getIntegration");

const executeMongoDBNode = async (
  node,
  input = {},
  context = {}
) => {
  const config = node.data?.config || {};

  const integration = await getIntegration({
    integrationId: config.integrationId,
    userId: context.userId,
    workspaceId: context.workspaceId,
    provider: "mongodb",
  });

  const uri =
    integration.credentials?.uri;

  if (!uri) {
    throw new Error(
      "MongoDB connection URI is missing"
    );
  }

  const databaseName =
    config.database ||
    integration.metadata?.database;

  const collectionName =
    config.collection;

  if (!databaseName) {
    throw new Error(
      "MongoDB database name is required"
    );
  }

  if (!collectionName) {
    throw new Error(
      "MongoDB collection name is required"
    );
  }

  const operation =
    config.operation || "insert";

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  const checkAborted = () => {
    if (context.signal?.aborted) {
      const error = new Error(
        "MongoDB node execution was cancelled"
      );

      error.code = "NODE_CANCELLED";

      throw error;
    }
  };

  const abortHandler = () => {
    console.log(
      "MongoDB node cancellation requested"
    );

    client.close().catch(() => {});
  };

  if (context.signal) {
    if (context.signal.aborted) {
      throw new Error(
        "MongoDB node execution was cancelled"
      );
    }

    context.signal.addEventListener(
      "abort",
      abortHandler,
      { once: true }
    );
  }

  try {
    checkAborted();

    await client.connect();

    checkAborted();

    const db =
      client.db(databaseName);

    const collection =
      db.collection(collectionName);

    let output;

    switch (operation) {
      case "insert": {
        const document =
          config.document || input;

        checkAborted();

        const result =
          await collection.insertOne(
            document
          );

        checkAborted();

        output = {
          operation: "insert",
          insertedId:
            result.insertedId.toString(),
          document,
        };

        break;
      }

      case "find": {
        const filter =
          config.filter || {};

        checkAborted();

        const documents =
          await collection
            .find(filter)
            .limit(
              Number(config.limit) || 20
            )
            .toArray();

        checkAborted();

        output = {
          operation: "find",
          count: documents.length,
          documents,
        };

        break;
      }

      case "update": {
        const filter =
          config.filter || {};

        const update =
          config.update || {};

        checkAborted();

        const result =
          await collection.updateMany(
            filter,
            {
              $set: update,
            }
          );

        checkAborted();

        output = {
          operation: "update",
          matchedCount:
            result.matchedCount,
          modifiedCount:
            result.modifiedCount,
        };

        break;
      }

      case "delete": {
        const filter =
          config.filter || {};

        checkAborted();

        const result =
          await collection.deleteMany(
            filter
          );

        checkAborted();

        output = {
          operation: "delete",
          deletedCount:
            result.deletedCount,
        };

        break;
      }

      default:
        throw new Error(
          `Unsupported MongoDB operation: ${operation}`
        );
    }

    console.log(
      `MongoDB ${operation} operation completed`
    );

    return {
      success: true,
      output,
    };
  } finally {
    if (context.signal) {
      context.signal.removeEventListener(
        "abort",
        abortHandler
      );
    }

    await client.close().catch(() => {});
  }
};

module.exports =
  executeMongoDBNode;