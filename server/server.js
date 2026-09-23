const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const {
  connectDB,
  disconnectDB,
} = require("./config/db");

require("dotenv").config();

const validateEnv = require("./config/env");

validateEnv();

const redisConnection = require("./config/redis");

const errorHandler = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const workflowRoutes = require("./routes/workflowRoutes");
const executionRoutes = require("./routes/executionRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const integrationRoutes = require("./routes/integrationRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");

console.log("authRoutes:", typeof authRoutes);
console.log("workflowRoutes:", typeof workflowRoutes);
console.log("executionRoutes:", typeof executionRoutes);
console.log("webhookRoutes:", typeof webhookRoutes);
console.log("integrationRoutes:", typeof integrationRoutes);
console.log("workspaceRoutes:", typeof workspaceRoutes);
console.log("scheduleRoutes:", typeof scheduleRoutes);

const {
  startScheduler,
  stopScheduler,
} = require("./services/scheduler/scheduler");

const workflowWorker = require("./services/worker/workflowWorker");

const {
  initializeSocket,
} = require("./services/socket/socket");

const app = express();

const PORT = process.env.PORT || 5000;

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again later.",
  },
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many authentication attempts. Please try again later.",
  },
});

const webhookRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many webhook requests. Please try again later.",
  },
});

app.use("/api", apiRateLimiter);

const clientUrl = process.env.CLIENT_URL;

if (!clientUrl) {
  throw new Error("CLIENT_URL is not configured");
}

const allowedOrigins = [clientUrl].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Origin not allowed by CORS")
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Workspace-Id",
      "X-Webhook-Signature",
      "X-Hub-Signature-256",
      "X-Webhook-Delivery-Id",
      "X-GitHub-Delivery",
    ],
  })
);

app.use(
  express.json({
    limit: "1mb",

    verify: (req, res, buf) => {
      req.rawBody = Buffer.from(buf);
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "FlowPilot API is running",
  });
});

app.use(
  "/api/auth",
  authRateLimiter,
  authRoutes
);

app.use(
  "/api/workflows",
  workflowRoutes
);

app.use(
  "/api/executions",
  executionRoutes
);

app.use(
  "/api/webhooks",
  webhookRateLimiter,
  webhookRoutes
);

app.use(
  "/api/integrations",
  integrationRoutes
);

app.use(
  "/api/workspaces",
  workspaceRoutes
);

app.use(
  "/api/schedules",
  scheduleRoutes
);

app.use((req, res, next) => {
  const error = new Error(
    `Route not found: ${req.method} ${req.originalUrl}`
  );

  error.statusCode = 404;

  next(error);
});

app.use(errorHandler);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    credentials: true,
  },
});

initializeSocket(io);

let isShuttingDown = false;

const startServer = async () => {
  try {
    await connectDB();

    startScheduler();

    server.listen(PORT, () => {
      console.log(
        `FlowPilot server running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start FlowPilot:",
      error
    );

    process.exit(1);
  }
};

startServer();

const shutdown = async (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(
    `${signal} received. Starting graceful shutdown...`
  );

  stopScheduler();

  server.close(async () => {
    console.log("HTTP server closed");

    try {
      io.close(() => {
        console.log("Socket.IO server closed");
      });

      if (workflowWorker) {
        await workflowWorker.close();

        console.log(
          "Workflow worker closed"
        );
      }

      if (
        redisConnection &&
        redisConnection.status !== "end"
      ) {
        await redisConnection.quit();

        console.log(
          "Redis connection closed"
        );
      }

      await disconnectDB();

      console.log(
        "FlowPilot shutdown complete"
      );

      process.exit(0);
    } catch (error) {
      console.error(
        "Error during graceful shutdown:",
        error
      );

      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error(
      "Graceful shutdown timed out. Forcing exit."
    );

    process.exit(1);
  }, 30000).unref();
};

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
});