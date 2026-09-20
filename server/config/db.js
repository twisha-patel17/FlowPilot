const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is not configured"
      );
    }

    mongoose.connection.on(
      "error",
      (error) => {
        console.error(
          "MongoDB runtime error:",
          error.message
        );
      }
    );

    mongoose.connection.on(
      "disconnected",
      () => {
        console.warn(
          "MongoDB disconnected"
        );
      }
    );

    mongoose.connection.on(
      "reconnected",
      () => {
        console.log(
          "MongoDB reconnected"
        );
      }
    );

    const connection = await mongoose.connect(
      process.env.MONGO_URI,
      {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
      }
    );

    console.log(
      `MongoDB connected: ${connection.connection.host}`
    );

    console.log(
      `Database: ${connection.connection.name}`
    );
  } catch (error) {
    console.error(
      "MongoDB connection error:",
      error.message
    );

    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();

      console.log(
        "MongoDB connection closed"
      );
    }
  } catch (error) {
    console.error(
      "MongoDB shutdown error:",
      error.message
    );
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};