import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  socket: WebSocket;
  room: string;
  username: string;
}
let allSocket: User[] = [];

wss.on("connection", (socket) => {
  socket.on("disconnect", () => {
    const senderData: User[] = allSocket.filter((x) => x.socket == socket);
    const senderRoomId = senderData[0].room;
    const username = senderData[0].username;
    for (const s of allSocket) {
      if (s.room === senderRoomId) {
        if (s.socket != socket) {
          s.socket.send(
            JSON.stringify({
              username: username,
              message: "Disconected",
            })
          );
        }
      }
    }
    allSocket = allSocket.filter((s) => s.socket != socket);
  });

  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === "join") {
        allSocket.push({
          socket,
          room: data.payload.roomId,
          username: data.payload.username,
        });

        const senderData: User[] = allSocket.filter((x) => x.socket == socket);
        const senderRoomId = senderData[0].room;
        const username = senderData[0].username;
        for (const s of allSocket) {
          if (s.room === senderRoomId) {
            if (s.socket != socket) {
              s.socket.send(
                JSON.stringify({
                  username: username,
                  message: "Connected",
                })
              );
            }
          }
        }
      }

      if (data.type === "chat") {
        const senderData: User[] = allSocket.filter((x) => x.socket == socket);
        const senderRoomId = senderData[0].room;
        const username = senderData[0].username;

        for (const s of allSocket) {
          if (s.room === senderRoomId) {
            if (s.socket != socket) {
              s.socket.send(
                JSON.stringify({
                  username: username,
                  message: data.payload.message,
                })
              );
            }
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  });
});
