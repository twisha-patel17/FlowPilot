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

  const uri = integration.credentials?.uri;

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

  const client = new MongoClient(uri);

  try {
    await client.connect();

    const db = client.db(databaseName);
    const collection =
      db.collection(collectionName);

    let output;

    switch (operation) {
      case "insert": {
        const document =
          config.document || input;

        const result =
          await collection.insertOne(document);

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

        const documents =
          await collection
            .find(filter)
            .limit(
              Number(config.limit) || 20
            )
            .toArray();

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

        const result =
          await collection.updateMany(
            filter,
            {
              $set: update,
            }
          );

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

        const result =
          await collection.deleteMany(filter);

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
    await client.close();
  }
};

module.exports = executeMongoDBNode;