// contains all client side code for game like location, movement, etc

// Global variables
const location_XY = [5, 5];

// get random location for the player
const createPlayerAtLocation = (player) => {
  return {
    x: Math.floor(Math.random() * location_XY[0]),
    y: Math.floor(Math.random() * location_XY[1]),
  };
};

module.exports = {
  createPlayerAtLocation,
};
