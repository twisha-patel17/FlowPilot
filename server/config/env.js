const requiredEnvVars = [
  "MONGO_URI",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
  "CLIENT_URL",
  "REDIS_URL",
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  if (
    process.env.ACCESS_TOKEN_SECRET.length < 32
  ) {
    throw new Error(
      "ACCESS_TOKEN_SECRET must be at least 32 characters"
    );
  }

  if (
    process.env.REFRESH_TOKEN_SECRET.length < 32
  ) {
    throw new Error(
      "REFRESH_TOKEN_SECRET must be at least 32 characters"
    );
  }

  try {
    new URL(process.env.CLIENT_URL);
  } catch {
    throw new Error(
      "CLIENT_URL must be a valid URL"
    );
  }
};

module.exports = validateEnv;