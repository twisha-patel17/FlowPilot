const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const Execution = require("../../models/Execution");
const Workspace = require("../../models/Workspace");

let io;

const authenticateSocket = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(
        /^Bearer\s+/i,
        ""
      );

    if (!token) {
      return next(
        new Error("Authentication required")
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    if (!decoded?.userId) {
      return next(
        new Error("Invalid authentication token")
      );
    }

    const user = await User.findById(
      decoded.userId
    ).select("_id");

    if (!user) {
      return next(
        new Error("User not found")
      );
    }

    socket.user = {
      id: user._id.toString(),
    };

    next();
  } catch (error) {
    console.error(
      "Socket authentication failed:",
      error.message
    );

    return next(
      new Error("Invalid or expired access token")
    );
  }
};

const canAccessExecution = async (
  userId,
  execution
) => {
  if (!userId || !execution) {
    return false;
  }

  const userIdString = userId.toString();

  if (
    execution.owner?.toString() ===
    userIdString
  ) {
    return true;
  }

  if (!execution.workspace) {
    return false;
  }

  const workspace =
    await Workspace.findOne({
      _id: execution.workspace,
      $or: [
        {
          owner: userId,
        },
        {
          "members.user": userId,
        },
      ],
    }).select("_id");

  return Boolean(workspace);
};

const initializeSocket = (socketIO) => {
  io = socketIO;

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.id} | User: ${socket.user.id}`
    );

    socket.on(
      "join-execution",
      async (executionId) => {
        try {
          if (!executionId) {
            socket.emit("socket-error", {
              message:
                "Execution ID is required",
            });

            return;
          }

          if (!mongoose.Types.ObjectId.isValid(executionId)
          ) {
            socket.emit("socket-error", {
              message:
                "Invalid execution ID",
            });

            return;
          }

          const execution =
            await Execution.findById(
              executionId
            ).select(
              "_id owner workspace"
            );

          if (!execution) {
            socket.emit("socket-error", {
              message:
                "Execution not found",
            });

            return;
          }

          const authorized =
            await canAccessExecution(
              socket.user.id,
              execution
            );

          if (!authorized) {
            socket.emit("socket-error", {
              message:
                "You are not authorized to access this execution",
            });

            return;
          }

          const room =
            `execution:${execution._id}`;

          socket.join(room);

          console.log(
            `Socket ${socket.id} joined ${room}`
          );

          socket.emit(
            "execution-room-joined",
            {
              executionId:
                execution._id.toString(),
            }
          );
        } catch (error) {
          console.error(
            "Failed to join execution room:",
            error
          );

          socket.emit("socket-error", {
            message:
              "Failed to join execution room",
          });
        }
      }
    );

    socket.on(
      "leave-execution",
      (executionId) => {
        if (!executionId) {
          return;
        }

        const room =
          `execution:${executionId}`;

        socket.leave(room);

        console.log(
          `Socket ${socket.id} left ${room}`
        );
      }
    );

    socket.on("disconnect", (reason) => {
      console.log(
        `Socket disconnected: ${socket.id} | User: ${socket.user.id} | Reason: ${reason}`
      );
    });

    socket.on("error", (error) => {
      console.error(
        `Socket error ${socket.id}:`,
        error
      );
    });
  });
};

const emitExecutionUpdate = (execution) => {
  if (!io || !execution) {
    return;
  }

  const executionData =
    typeof execution.toObject === "function"
      ? execution.toObject()
      : execution;

  const safeExecution = {
    _id: executionData._id,
    workflow: executionData.workflow,
    workspace: executionData.workspace,
    status: executionData.status,
    trigger: executionData.trigger,
    input: executionData.input,
    scheduledAt:
      executionData.scheduledAt,
    startedAt:
      executionData.startedAt,
    finishedAt:
      executionData.finishedAt,
    cancelledAt:
      executionData.cancelledAt,
    error: executionData.error,
    steps: executionData.steps,
    createdAt:
      executionData.createdAt,
    updatedAt:
      executionData.updatedAt,
  };

  io.to(
    `execution:${executionData._id}`
  ).emit(
    "execution-update",
    safeExecution
  );
};

module.exports = {
  initializeSocket,
  emitExecutionUpdate,
};