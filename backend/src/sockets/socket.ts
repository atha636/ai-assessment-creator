import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

let io: Server | undefined;

export const initSocket = (server: HttpServer, origins: string[]) => {
  io = new Server(server, {
    cors: { origin: origins },
  });

  io.on("connection", () => {
    console.log("Socket Connected");
  });
};

export const getIO = () => io;