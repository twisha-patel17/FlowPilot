const Execution = require("../../models/Execution");

let io;

const initializeSocket = (socketIO) => {
  io = socketIO;

  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.id}`
    );

    socket.on(
      "join-execution",
      async (executionId) => {
        try {
          if (!executionId) {
            socket.emit("socket-error", {
              message: "Execution ID is required",
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
              message: "Execution not found",
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

    socket.on("disconnect", () => {
      console.log(
        `Socket disconnected: ${socket.id}`
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