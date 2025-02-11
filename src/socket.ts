import { Server } from "socket.io";

let io: Server;

export const initSocket = (server: any): Server => {
  io = new Server(server, {
    cors: {
      origin: ["https://swissmote-events.vercel.app", "http://localhost:3000"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
