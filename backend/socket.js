let io;

module.exports = {
  initSocket: (server) => {
    const { Server } = require('socket.io');
    io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected to socket:', socket.id);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  },
  getIo: () => {
    if (!io) {
      throw new Error('Socket.io is not initialized!');
    }
    return io;
  }
};
