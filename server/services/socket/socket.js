const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const User = require("../../models/User");
const Execution = require("../../models/Execution");
const Workspace = require("../../models/Workspace");

let io;

const authenticateSocket = async (
  socket,
  next
) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(
        /^Bearer\s+/i,
        ""
      );

    if (
      typeof token !== "string" ||
      !token.trim()
    ) {
      return next(
        new Error(
          "Authentication required"
        )
      );
    }

    if (
      !process.env.ACCESS_TOKEN_SECRET
    ) {
      console.error(
        "ACCESS_TOKEN_SECRET is not configured"
      );

      return next(
        new Error(
          "Socket authentication unavailable"
        )
      );
    }

    const decoded =
      jwt.verify(
        token.trim(),
        process.env
          .ACCESS_TOKEN_SECRET
      );

    if (
      !decoded ||
      typeof decoded.userId !==
        "string"
    ) {
      return next(
        new Error(
          "Invalid authentication token"
        )
      );
    }

    const user =
      await User.findById(
        decoded.userId
      )
        .select("_id")
        .lean();

    if (!user) {
      return next(
        new Error(
          "Invalid authentication token"
        )
      );
    }

    socket.user = {
      id: user._id.toString(),
    };

    return next();
  } catch (error) {
    if (
      error.name !==
        "TokenExpiredError" &&
      error.name !==
        "JsonWebTokenError" &&
      error.name !==
        "NotBeforeError"
    ) {
      console.error(
        "Socket authentication error:",
        error.message
      );
    }

    return next(
      new Error(
        "Invalid or expired access token"
      )
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

  const userIdString =
    userId.toString();

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
      status: "active",
      "members.user": userId,
    })
      .select("_id")
      .lean();

  return Boolean(workspace);
};

const initializeSocket = (
  socketIO
) => {
  io = socketIO;

  io.use(authenticateSocket);

  io.on(
    "connection",
    (socket) => {
      console.log(
        `Socket connected: ${socket.id} | User: ${socket.user.id}`
      );

      socket.on(
        "join-execution",
        async (executionId) => {
          try {
            if (
              typeof executionId !==
                "string" ||
              !executionId
            ) {
              socket.emit(
                "socket-error",
                {
                  message:
                    "Execution ID is required",
                }
              );

              return;
            }

            if (
              !mongoose.Types.ObjectId.isValid(
                executionId
              )
            ) {
              socket.emit(
                "socket-error",
                {
                  message:
                    "Invalid execution ID",
                }
              );

              return;
            }

            const execution =
              await Execution.findById(
                executionId
              )
                .select(
                  "_id owner workspace"
                )
                .lean();

            if (!execution) {
              socket.emit(
                "socket-error",
                {
                  message:
                    "Execution not found",
                }
              );

              return;
            }

            const authorized =
              await canAccessExecution(
                socket.user.id,
                execution
              );

            if (!authorized) {
              socket.emit(
                "socket-error",
                {
                  message:
                    "You are not authorized to access this execution",
                }
              );

              return;
            }

            const room =
              `execution:${execution._id.toString()}`;

            socket.join(room);

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
              error.message
            );

            socket.emit(
              "socket-error",
              {
                message:
                  "Failed to join execution room",
              }
            );
          }
        }
      );

      socket.on(
        "leave-execution",
        (executionId) => {
          if (
            typeof executionId !==
              "string" ||
            !executionId
          ) {
            return;
          }

          if (
            !mongoose.Types.ObjectId.isValid(
              executionId
            )
          ) {
            return;
          }

          const room =
            `execution:${executionId}`;

          socket.leave(room);
        }
      );

      socket.on(
        "disconnect",
        (reason) => {
          console.log(
            `Socket disconnected: ${socket.id} | User: ${socket.user.id} | Reason: ${reason}`
          );
        }
      );

      socket.on(
        "error",
        (error) => {
          console.error(
            `Socket error ${socket.id}:`,
            error?.message ||
              error
          );
        }
      );
    }
  );
};

const emitExecutionUpdate = (
  execution
) => {
  if (
    !io ||
    !execution
  ) {
    return;
  }

  const executionData =
    typeof execution.toObject ===
    "function"
      ? execution.toObject()
      : execution;

  if (
    !executionData._id
  ) {
    return;
  }

  const safeExecution = {
    _id:
      executionData._id,

    workflow:
      executionData.workflow,

    workspace:
      executionData.workspace,

    status:
      executionData.status,

    trigger:
      executionData.trigger,

    input:
      executionData.input,

    scheduledAt:
      executionData.scheduledAt,

    startedAt:
      executionData.startedAt,

    finishedAt:
      executionData.finishedAt,

    cancelledAt:
      executionData.cancelledAt,

    error:
      executionData.error,

    steps:
      executionData.steps,

    createdAt:
      executionData.createdAt,

    updatedAt:
      executionData.updatedAt,
  };

  io.to(
    `execution:${executionData._id.toString()}`
  ).emit(
    "execution-update",
    safeExecution
  );
};

module.exports = {
  initializeSocket,
  emitExecutionUpdate,
};