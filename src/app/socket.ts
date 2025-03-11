import {io} from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_DOMAIN ? process.env.NEXT_PUBLIC_DOMAIN : "http://localhost:3000";

console.log('Socket module initialized');

// Create a single socket instance with explicit configuration
const socket = io(URL, {
  transports: ['websocket', 'polling'], // Use WebSocket first, fall back to polling
  reconnectionAttempts: 5,              // Try to reconnect 5 times
  reconnectionDelay: 1000,              // Start with 1 second delay between retries
  timeout: 20000                         // Connection timeout
});

socket.on("connect", () => {
  console.log('Connected to socket server with ID:', socket.id);
});

socket.on("connect_error", (error) => {
  console.error('Socket connection error:', error);
});

// Add more robust error handling
socket.on("disconnect", (reason) => {
  console.log('Disconnected from socket server:', reason);
});

socket.on("reconnect", (attemptNumber) => {
  console.log('Reconnected to socket server after', attemptNumber, 'attempts');
});

socket.on("reconnect_error", (error) => {
  console.error('Socket reconnection error:', error);
});

export default socket;

