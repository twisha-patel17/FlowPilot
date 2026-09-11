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
    const collection = db.collection(collectionName);

    let result;

    switch (operation) {
      case "insert": {
        const document =
          config.document || input;

        result = await collection.insertOne(
          document
        );

        break;
      }

      case "find": {
        const filter =
          config.filter || {};

        result = await collection
          .find(filter)
          .limit(Number(config.limit) || 20)
          .toArray();

        break;
      }

      case "update": {
        const filter =
          config.filter || {};

        const update =
          config.update || {};

        result = await collection.updateMany(
          filter,
          { $set: update }
        );

        break;
      }

      case "delete": {
        const filter =
          config.filter || {};

        result = await collection.deleteMany(
          filter
        );

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
      output: {
        operation,
        result,
      },
    };
  } finally {
    await client.close();
  }
};

module.exports = executeMongoDBNode;