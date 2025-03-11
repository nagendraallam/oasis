const redis = require("redis");

class RedisClient {
  constructor() {
    console.log("Creating Redis client");
    try {
      // Create Redis client with proper error handling
      this.client = redis.createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379",
        socket: {
          reconnectStrategy: (retries) => {
            // Exponential backoff with max 10 second delay
            return Math.min(retries * 500, 10000);
          }
        }
      });
      
      this.client.on("error", (err) => {
        console.error("Redis client error:", err);
      });
      
      this.client.on("connect", () => {
        console.log("Redis client connected");
      });
      
      this.client.on("reconnecting", () => {
        console.log("Redis client reconnecting...");
      });
      
      this.client.connect().catch(err => {
        console.error("Redis connection error:", err);
      });

      // Setup player activity timer
      this.playerActivityTimers = new Map();
      this.PLAYER_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    } catch (err) {
      console.error("Failed to create Redis client:", err);
    }
  }

  // Reset all game data when server starts
  async resetGameData() {
    try {
      console.log("Resetting all game data...");
      
      // Delete all players, positions and activity data
      await this.client.del("online");
      await this.client.del("players");
      await this.client.del("positions");
      await this.client.del("last_activity");
      
      // Keep chat history, but you could uncomment this if you want to clear it too
      // await this.client.del("chat_history");
      
      console.log("Game data reset complete");
      return true;
    } catch (err) {
      console.error("Error resetting game data:", err);
      return false;
    }
  }

  async addUser(socket, playerData) {
    try {
      if (!socket || !socket.id) {
        console.error("Invalid socket provided to addUser");
        return;
      }
      
      // Store the basic socket ID to username mapping
      await this.client.hSet("online", socket.id, socket.username || "Anonymous");
      
      // Store the full player data
      if (playerData) {
        await this.client.hSet("players", socket.id, JSON.stringify(playerData));
        
        // Initialize player position if provided
        if (playerData.position) {
          await this.setPlayerPosition(socket, playerData.position);
        }
      }
      
      // Record activity time
      await this.updatePlayerActivity(socket.id);
      
      console.log(`User added: ${socket.id}`);
    } catch (err) {
      console.error("Error adding user:", err);
    }
  }

  async removeUser(id) {
    try {
      if (!id) {
        console.error("Invalid ID provided to removeUser");
        return;
      }
      
      // Clear any activity timeout
      this.clearActivityTimeout(id);
      
      await this.client.hDel("positions", id);
      await this.client.hDel("online", id);
      await this.client.hDel("players", id);
      await this.client.hDel("last_activity", id);
      
      console.log(`User removed: ${id}`);
    } catch (err) {
      console.error("Error removing user:", err);
    }
  }

  async updatePlayerActivity(id) {
    if (!id) return;
    
    try {
      // Update last activity timestamp
      const timestamp = Date.now();
      await this.client.hSet("last_activity", id, timestamp);

      // Clear any existing timeout
      this.clearActivityTimeout(id);
      
      // Set new timeout
      const timeout = setTimeout(() => {
        console.log(`Player ${id} timed out due to inactivity`);
        this.removeUser(id);
      }, this.PLAYER_TIMEOUT_MS);
      
      this.playerActivityTimers.set(id, timeout);
    } catch (err) {
      console.error("Error updating player activity:", err);
    }
  }

  clearActivityTimeout(id) {
    if (this.playerActivityTimers.has(id)) {
      clearTimeout(this.playerActivityTimers.get(id));
      this.playerActivityTimers.delete(id);
    }
  }

  async setPlayerPosition(socket, position) {
    try {
      if (!socket || !socket.id) {
        console.error("Invalid socket provided to setPlayerPosition");
        return;
      }
      
      if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
        console.error("Invalid position data:", position);
        return;
      }
      
      await this.client.hSet("positions", socket.id, JSON.stringify(position));
      
      // Update activity timestamp whenever position is updated
      await this.updatePlayerActivity(socket.id);
    } catch (err) {
      console.error("Error setting player position:", err);
      throw err; // Re-throw to allow proper handling in caller
    }
  }

  async getPlayerPosition(id) {
    try {
      if (!id) return null;
      
      let position = await this.client.hGet("positions", id);
      return position ? JSON.parse(position) : null;
    } catch (err) {
      console.error("Error getting player position:", err);
      return null;
    }
  }

  async getPlayerPositions() {
    try {
      // Get all positions
      let positions = await this.client.hGetAll("positions");
      // Get all player data
      let players = await this.client.hGetAll("players");
      
      let result = [];

      // Process each position entry
      for (const id of Object.keys(positions)) {
        try {
          // Get player data
          const playerData = players[id] ? JSON.parse(players[id]) : null;
          const positionData = JSON.parse(positions[id]);
          
          // Skip invalid data
          if (!positionData || typeof positionData.x !== 'number' || typeof positionData.y !== 'number') {
            console.warn(`Invalid position data for player ${id}`);
            continue;
          }
          
          result.push({
            id: id,
            position: positionData,
            username: playerData?.username || "Unknown",
            shape: playerData?.shape || "box",
            color: playerData?.color || "red"
          });
        } catch (err) {
          console.error("Error parsing data for player", id, err);
        }
      }

      return result;
    } catch (err) {
      console.error("Error getting player positions:", err);
      return [];
    }
  }

  async listUsers() {
    try {
      let players = await this.client.hGetAll("players");
      let result = [];

      for (const id of Object.keys(players)) {
        try {
          const playerData = JSON.parse(players[id]);
          if (playerData && playerData.id) {
            result.push(playerData);
          }
        } catch (err) {
          console.error("Error parsing player data", id, err);
        }
      }

      return result;
    } catch (err) {
      console.error("Error listing users:", err);
      return [];
    }
  }
  
  async addChatMessage(message) {
    try {
      if (!message || !message.id || !message.text) {
        console.error("Invalid chat message:", message);
        return false;
      }
      
      // Update player activity when they send a message
      if (message.id) {
        await this.updatePlayerActivity(message.id);
      }
      
      // Store up to 100 recent messages
      const listLength = await this.client.lLen("chat_history");
      
      // If we have 100 messages already, remove the oldest
      if (listLength >= 100) {
        await this.client.rPop("chat_history");
      }
      
      // Add new message to the beginning of the list
      await this.client.lPush("chat_history", JSON.stringify(message));
      
      return true;
    } catch (err) {
      console.error("Error adding chat message:", err);
      return false;
    }
  }
  
  async getChatHistory(limit = 50) {
    try {
      // Get the most recent messages (up to limit)
      const messages = await this.client.lRange("chat_history", 0, limit - 1);
      
      // Parse all messages
      return messages.map(msg => {
        try {
          return JSON.parse(msg);
        } catch (err) {
          console.error("Error parsing chat message:", err);
          return null;
        }
      }).filter(msg => msg !== null); // Remove any null messages
    } catch (err) {
      console.error("Error getting chat history:", err);
      return [];
    }
  }
}

module.exports = RedisClient;
