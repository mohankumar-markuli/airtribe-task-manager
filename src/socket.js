const { Server } = require('socket.io');

/**
 * Initialise a Socket.io server attached to the given HTTP server.
 * The returned `io` instance is stored on the Express app so that
 * controllers can emit events.
 */
function initSocket(httpServer, app) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
  });

  // Make the io instance available via app locals
  if (app) {
    app.set('io', io);
  }

  io.on('connection', (socket) => {
    // Clients can join their personal user room to receive targeted notifications (e.g. task assignments)
    socket.on('joinUser', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    // Clients can join a task-specific room to receive updates, comments, and attachments
    socket.on('joinTask', (taskId) => {
      if (taskId) {
        socket.join(taskId);
      }
    });

    socket.on('leaveTask', (taskId) => {
      if (taskId) {
        socket.leave(taskId);
      }
    });

    socket.on('disconnect', () => {
      // Disconnect handling
    });
  });

  return io;
}

module.exports = { initSocket };
