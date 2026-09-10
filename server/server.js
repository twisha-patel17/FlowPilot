const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
require("dotenv").config();

const redisConnection = require("./config/redis");

const app = express();

const authRoutes = require("./routes/authRoutes");
const workflowRoutes = require("./routes/workflowRoutes");
const executionRoutes = require("./routes/executionRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const integrationRoutes = require("./routes/integrationRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");

const startScheduler = require("./services/scheduler/scheduler");
require("./services/worker/workflowWorker");

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "FlowPilot API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/executions", executionRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/workspaces", workspaceRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

const {
  initializeSocket,
} = require("./services/socket/socket");

initializeSocket(io);
connectDB();

startScheduler();

server.listen(PORT, () => {
  console.log(`FlowPilot server running on port ${PORT}`);
});