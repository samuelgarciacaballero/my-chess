import { createServer } from 'node:http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  socket.on('join', ({ room, name }) => {
    socket.data.name = name;
    socket.data.room = room;
    socket.join(room);
    const roomSet = io.sockets.adapter.rooms.get(room) || new Set();
    if (roomSet.size === 1) {
      socket.emit('waiting');
    } else if (roomSet.size === 2) {
      const [id1, id2] = Array.from(roomSet);
      const s1 = io.sockets.sockets.get(id1);
      const s2 = io.sockets.sockets.get(id2);
      const assignWhite = Math.random() < 0.5;
      const white = assignWhite ? s1 : s2;
      const black = assignWhite ? s2 : s1;
      white.emit('start', { color: 'w', opponent: black.data.name });
      black.emit('start', { color: 'b', opponent: white.data.name });
    } else {
      socket.emit('full');
    }
  });

  socket.on('move', ({ from, to, effectKey }) => {
    const room = socket.data.room;
    if (room) {
      socket.to(room).emit('move', { from, to, effectKey });
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log('Server listening on', PORT);
});
