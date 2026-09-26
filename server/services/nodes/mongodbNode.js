const { MongoClient } = require("mongodb");
const getIntegration = require("../integrations/getIntegration");

const IDEMPOTENCY_FIELD = "_flowPilotIdempotencyKey";

const MAX_FIND_LIMIT = 100;
const MAX_NAME_LENGTH = 255;

const ensureIdempotencyIndex = async (collection, options = {}) => {
  const indexes = await collection
    .listIndexes()
    .toArray();

  const existingIndex = indexes.find((index) => {
    const keys = Object.keys(index.key || {});

    return (
      keys.length === 1 &&
      keys[0] === IDEMPOTENCY_FIELD
    );
  });

  if (existingIndex) {
    if (
      existingIndex.unique === true &&
      existingIndex.sparse === true
    ) {
      return;
    }

    throw new Error(
      "MongoDB idempotency index exists but is not configured correctly. It must be unique and sparse."
    );
  }

  try {
    await collection.createIndex(
      {
        [IDEMPOTENCY_FIELD]: 1,
      },
      {
        unique: true,
        sparse: true,
        name: "flowpilot_idempotency_unique",
        ...options,
      }
    );
  } catch (error) {
    // Another worker may have created the index concurrently.
    if (
      error.code === 85 ||
      error.code === 86
    ) {
      const latestIndexes = await collection
        .listIndexes()
        .toArray();

      const latestIndex = latestIndexes.find(
        (index) => {
          const keys = Object.keys(
            index.key || {}
          );

          return (
            keys.length === 1 &&
            keys[0] === IDEMPOTENCY_FIELD
          );
        }
      );

      if (
        latestIndex?.unique === true &&
        latestIndex?.sparse === true
      ) {
        return;
      }
    }

    throw new Error(
      "MongoDB idempotency index could not be created. Existing duplicate FlowPilot idempotency keys may need cleanup."
    );
  }
};

const validateName = (value, fieldName) => {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `${fieldName} is required`
    );
  }

  if (value.length > MAX_NAME_LENGTH) {
    throw new Error(
      `${fieldName} is too long`
    );
  }

  return value.trim();
};

const normalizeLimit = (value) => {
  const limit = Number(value);

  if (!Number.isFinite(limit)) {
    return 20;
  }

  return Math.min(
    Math.max(Math.floor(limit), 1),
    MAX_FIND_LIMIT
  );
};

const createMongoError = (error, operation) => {
  const wrappedError = new Error(
    `MongoDB ${operation} operation failed`
  );

  wrappedError.code = error?.code;
  wrappedError.codeName = error?.codeName;

  if (error?.statusCode) {
    wrappedError.statusCode =
      error.statusCode;
  }

  return wrappedError;
};

const executeMongoDBNode = async (
  node,
  input = {},
  context = {}
) => {
  const config =
    node.data?.config || {};

  const integration =
    await getIntegration({
      integrationId:
        config.integrationId,
      userId:
        context.userId,
      workspaceId:
        context.workspaceId,
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

  const safeDatabaseName =
    validateName(
      databaseName,
      "MongoDB database name"
    );

  const safeCollectionName =
    validateName(
      collectionName,
      "MongoDB collection name"
    );

  const operation =
    config.operation || "insert";

  const client =
    new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      maxPoolSize: 5,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
    });

  const checkAborted = () => {
    if (context.signal?.aborted) {
      const error = new Error(
        "MongoDB node execution was cancelled"
      );

      error.code =
        "NODE_CANCELLED";

      throw error;
    }
  };

  const abortHandler = () => {
    client
      .close()
      .catch(() => {});
  };

  if (context.signal) {
    if (context.signal.aborted) {
      const error = new Error(
        "MongoDB node execution was cancelled"
      );

      error.code =
        "NODE_CANCELLED";

      throw error;
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
      client.db(safeDatabaseName);

    const collection =
      db.collection(
        safeCollectionName
      );

    const mongoOptions = context.signal
      ? {
          signal: context.signal,
        }
      : {};

    let output;

    switch (operation) {
      case "insert": {
        const document = {
          ...(config.document ||
            input),
        };

        if (
          context.idempotencyKey
        ) {
          await ensureIdempotencyIndex(
            collection,
            mongoOptions
          );

          checkAborted();

          document[
            IDEMPOTENCY_FIELD
          ] =
            context.idempotencyKey;

          try {
            const result =
              await collection.insertOne(
                document,
                mongoOptions
              );

            checkAborted();

            output = {
              operation: "insert",
              insertedId:
                result.insertedId.toString(),
              document,
              idempotent: true,
            };
          } catch (error) {
            if (
              error.code === 11000
            ) {
              checkAborted();

              const existingDocument =
                await collection.findOne(
                  {
                    [IDEMPOTENCY_FIELD]:
                      context.idempotencyKey,
                  },
                  mongoOptions
                );

              checkAborted();

              if (
                !existingDocument
              ) {
                throw error;
              }

              output = {
                operation: "insert",
                insertedId:
                  existingDocument._id.toString(),
                document:
                  existingDocument,
                idempotent: true,
              };

              break;
            }

            throw error;
          }

          break;
        }

        checkAborted();

        const result =
          await collection.insertOne(
            document,
            mongoOptions
          );

        checkAborted();

        output = {
          operation: "insert",
          insertedId:
            result.insertedId.toString(),
          document,
          idempotent: false,
        };

        break;
      }

      case "find": {
        const filter =
          config.filter || {};

        const limit =
          normalizeLimit(
            config.limit
          );

        checkAborted();

        const documents =
          await collection
            .find(
              filter,
              mongoOptions
            )
            .limit(limit)
            .toArray();

        checkAborted();

        output = {
          operation: "find",
          count:
            documents.length,
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
            },
            mongoOptions
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
            filter,
            mongoOptions
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

    return {
      success: true,
      output,
    };
  } catch (error) {
    if (
      error?.code ===
      "NODE_CANCELLED"
    ) {
      throw error;
    }

    throw createMongoError(
      error,
      operation
    );
  } finally {
    if (context.signal) {
      context.signal.removeEventListener(
        "abort",
        abortHandler
      );
    }

    await client
      .close()
      .catch(() => {});
  }
};

module.exports =
  executeMongoDBNode;