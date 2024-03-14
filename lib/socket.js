const { generateUsername } = require("unique-username-generator");
const RedisClient = require("./redis");
const { createPlayerAtLocation } = require("../game/client");

const redisConnection = new RedisClient();

module.exports = function (io) {
  io.on("connection", (socket) => {
    socket.username = generateUsername();

    redisConnection.addUser(socket);

    // create player
    redisConnection.setPlayerPosition(socket, createPlayerAtLocation(socket));

    redisConnection.listUsers().then((users) => {
      io.emit("refreshPlayers", users);
    });

    redisConnection.getPlayerPositions().then((positions) => {
      io.emit("refreshPositions", positions);
    });

    socket.on("close", (id) => {
      if (id) redisConnection.removeUser(id);
    });

    socket.on("disconnect", () => {
      redisConnection.removeUser(socket.id);
    });

    socket.on("updatePosition", ({ s, position }) => {
      redisConnection.setPlayerPosition(socket, position).then(() => {
        redisConnection.getPlayerPositions().then((positions) => {
          io.emit("refreshPositions", positions);
        });
      });
    });
  });
};
