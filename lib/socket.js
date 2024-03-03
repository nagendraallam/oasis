const { generateUsername } = require("unique-username-generator");
const RedisClient = require("./redis");

const redisConnection = new RedisClient();

module.exports = function (io) {
  io.on("connection", (socket) => {
    socket.username = generateUsername();

    redisConnection.addUser(socket);

    redisConnection.listUsers().then((users) => {
      io.emit("refreshPlayers", users);
    });

    socket.on("close", (id) => {
      if (id) redisConnection.removeUser(id);
    });

    socket.on("disconnect", () => {
      redisConnection.removeUser(socket.id);
    });
  });
};
