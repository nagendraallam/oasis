const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const next = require("next");
const dotenv = require("dotenv");

const socket = require("./lib/socket");

dotenv.config();

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

console.log(`starting server in ${process.env.NODE_ENV || 'development'} mode`);

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);
  
  // Create socket.io server with proper configuration
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"]
    },
    path: '/api/socket',
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6 // 1 MB
  });

  socket(io);

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });
});
