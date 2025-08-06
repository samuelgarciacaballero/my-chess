import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const rooms = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (e) {
      return;
    }
    if (msg.type === 'join') {
      const room = rooms.get(msg.room) || { sockets: [], colors: [] };
      if (room.sockets.length >= 2) {
        ws.send(JSON.stringify({ type: 'full' }));
        return;
      }
      const color = room.colors.includes('w') ? 'b' : 'w';
      room.sockets.push(ws);
      room.colors.push(color);
      rooms.set(msg.room, room);
      ws.room = msg.room;
      ws.color = color;
      ws.send(JSON.stringify({ type: 'joined', color }));
    } else if (msg.type === 'move') {
      const room = rooms.get(ws.room);
      if (!room) return;
      room.sockets.forEach((client) => {
        if (client !== ws) {
          client.send(JSON.stringify(msg));
        }
      });
    }
  });

  ws.on('close', () => {
    const room = rooms.get(ws.room);
    if (room) {
      const idx = room.sockets.indexOf(ws);
      if (idx >= 0) {
        room.sockets.splice(idx, 1);
        room.colors.splice(idx, 1);
      }
      if (room.sockets.length === 0) {
        rooms.delete(ws.room);
      }
    }
  });
});
