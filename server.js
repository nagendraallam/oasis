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

console.log(`starting server in ${process.env.NODE_ENV} mode`);

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);
  const io = new Server(httpServer);

  socket(io);

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });
});
