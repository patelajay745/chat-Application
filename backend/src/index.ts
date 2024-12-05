import { WebSocketServer, WebSocket, VerifyClientCallbackSync } from "ws";

type VerifyClientInfo = Parameters<VerifyClientCallbackSync>[0];

const wss = new WebSocketServer({
  port: 8080,
  verifyClient: (info: VerifyClientInfo) => {
    const allowedOrigins = ["http://localhost:5173"];

    const origin = info.origin;

    if (!origin) {
      console.log("Accepted connection with no origin");
      return true;
    }

    console.log(origin);

    if (!allowedOrigins.includes(origin)) {
      console.log(`Rejected connection from origin: ${origin}`);
      return false;
    }

    console.log(`Accepted connection from origin: ${origin}`);
    return true;
  },
});

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
