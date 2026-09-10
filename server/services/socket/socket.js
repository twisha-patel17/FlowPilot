let io;

const initializeSocket = (socketIO) => {
  io = socketIO;

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join-execution", (executionId) => {
      socket.join(`execution:${executionId}`);

      console.log(
        `Socket ${socket.id} joined execution:${executionId}`
      );
    });

    socket.on("leave-execution", (executionId) => {
      socket.leave(`execution:${executionId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

const emitExecutionUpdate = (execution) => {
  if (!io || !execution) return;

  io.to(`execution:${execution._id}`).emit(
    "execution-update",
    execution
  );
};

module.exports = {
  initializeSocket,
  emitExecutionUpdate,
};