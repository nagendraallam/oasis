import { Server } from 'socket.io';
import socketHandler from '../../lib/socket';

export default function SocketHandler(req, res) {
  // Only allow websocket connections
  if (res.socket.server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }

  console.log('Setting up socket.io server...');
  const io = new Server(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  
  res.socket.server.io = io;
  
  // Initialize socket handlers
  socketHandler(io);
  
  console.log('Socket.io server started');
  res.end();
} 