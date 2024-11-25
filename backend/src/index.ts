import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  socket: WebSocket;
  room: string;
}
let allSocket: User[] = [];

wss.on("connection", (socket) => {
  socket.on("disconnect", () => {
    allSocket = allSocket.filter((s) => s.socket != socket);
  });

  socket.on("message", (message) => {
    const data = JSON.parse(message.toString());
    if (data.type === "join") {
      allSocket.push({
        socket,
        room: data.payload.roomId,
      });
    }

    if (data.type === "chat") {
      const senderData: User[] = allSocket.filter((x) => x.socket == socket);
      const senderRoomId = senderData[0].room;

      for (const s of allSocket) {
        if (s.room === senderRoomId) {
          if (s.socket != socket) {
            s.socket.send(data.payload.message);
          }
        }
      }
    }
  });
});
