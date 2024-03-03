const redis = require("redis");

class RedisClient {
  constructor() {
    console.log("Creating Redis client");
    this.client = redis.createClient();
    this.client.connect();
  }

  addUser(socket) {
    this.client.hSet("online", socket.id, socket.username);
  }

  removeUser(id) {
    this.client.hDel("online", id);
  }

  async listUsers(callback) {
    let users = await this.client.hGetAll("online");
    let UsernameArray = [];

    Object.values(users).forEach((value) => {
      UsernameArray.push(value);
    });

    return UsernameArray;
  }
}

module.exports = RedisClient;
