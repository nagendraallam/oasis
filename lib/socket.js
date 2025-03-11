const { generateUsername } = require("unique-username-generator");
const RedisClient = require("./redis");

const redisConnection = new RedisClient();

// Reset all game data on server start
(async function resetOnStartup() {
  await redisConnection.resetGameData();
})();

module.exports = function (io) {
  console.log("Socket.io server initialized");
  
  // Store active players with their data
  const activePlayers = new Map();
  
  io.on("connection", (socket) => {
    console.log(`New socket connection: ${socket.id}`);
    
    // Handle player join
    socket.on('player:join', (playerData) => {
      console.log('Player joined:', socket.id, playerData);
      
      // Create complete player data
      const completePlayerData = {
        id: socket.id,
        position: playerData.position || [0, 0.5, 0],
        color: playerData.color || '#' + Math.floor(Math.random()*16777215).toString(16),
        username: playerData.username || `Player-${socket.id.substring(0, 5)}`,
        rotation: playerData.rotation || 0,
        isNew: true
      };
      
      // Store player data
      activePlayers.set(socket.id, completePlayerData);
      
      // Send player their ID
      socket.emit('player:id', socket.id);
      
      // Broadcast updated players list to all clients
      broadcastPlayers();
    });
    
    // Handle player updates (position, color, username, etc.)
    socket.on('player:update', (updateData) => {
      if (!updateData || !updateData.id) return;
      
      // Get existing player data
      const existingData = activePlayers.get(updateData.id);
      if (!existingData) return;
      
      // Update player data with new values
      const updatedData = {
        ...existingData,
        ...updateData,
        isNew: false // Not new anymore after updates
      };
      
      // Store updated data
      activePlayers.set(updateData.id, updatedData);
      
      // Broadcast updated players list
      broadcastPlayers();
    });
    
    // Handle chat messages
    socket.on('chat:message', (message) => {
      console.log('Chat message received:', message);
      io.emit('chat:message', message);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Remove player
      activePlayers.delete(socket.id);
      
      // Broadcast updated players list
      broadcastPlayers();
    });
    
    // Helper to broadcast all players
    function broadcastPlayers() {
      // Convert Map to object for easier consumption on client
      const playersObject = {};
      activePlayers.forEach((value, key) => {
        playersObject[key] = value;
      });
      
      io.emit('players:update', playersObject);
    }
    
    // Handle legacy events for backward compatibility
    
    // Handle player activity ping
    socket.on("ping", () => {
      // Still useful to keep player active
      console.log(`Ping from player ${socket.id}`);
    });

    socket.on("updatePosition", (data) => {
      // For backward compatibility
      if (!data || !data.position) return;
      
      const playerId = data.s || socket.id;
      const playerData = activePlayers.get(playerId);
      
      if (playerData) {
        // Convert legacy position format to array format
        const position = [
          data.position.x || 0,
          data.position.y || 0.5,
          data.position.z || 0
        ];
        
        playerData.position = position;
        activePlayers.set(playerId, playerData);
        
        // Broadcast updated players
        broadcastPlayers();
      }
    });
  });
};
