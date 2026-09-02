const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();

const authRoutes = require("./routes/authRoutes");
const workflowRoutes = require("./routes/workflowRoutes");

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

connectDB();

app.listen(PORT, () => {
  console.log(`FlowPilot server running on port ${PORT}`);
});