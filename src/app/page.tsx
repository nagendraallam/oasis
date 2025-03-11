"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';
import Terrain from './components/Terrain';
import PlayerShape from './components/PlayerShape';
import Chatbox from './components/Chatbox';
import ColorPicker from './components/ColorPicker';
import { v4 as uuidv4 } from 'uuid';
import { PlayerData, Message } from '@/lib/types';

// Main App Component
export default function Home() {
  // State for app
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<Record<string, PlayerData>>({});
  const [yourId, setYourId] = useState<string>('');
  const [color, setColor] = useState<string>('#' + Math.floor(Math.random()*16777215).toString(16));
  const [username, setUsername] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isInterfaceVisible, setIsInterfaceVisible] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Movement control states
  const movementKeysRef = useRef({
    forward: false,
    backward: false,
    left: false, 
    right: false,
    jump: false
  });
  
  // Camera & player refs
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const playerPositionRef = useRef<[number, number, number]>([0, 0.5, 0]);
  const playerRotationRef = useRef<number>(0);
  const velocityRef = useRef<[number, number, number]>([0, 0, 0]);
  const isJumpingRef = useRef<boolean>(false);
  
  // Mouse movement for rotation
  const isPointerLockedRef = useRef<boolean>(false);
  
  // Constants for movement
  const MOVE_SPEED = 0.1;
  const ROTATION_SPEED = 0.003;
  const JUMP_FORCE = 0.2;
  const GRAVITY = 0.01;
  
  // Inside the component, after state declarations
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Setup socket connection
  useEffect(() => {
    // Create or get username from localStorage
    const storedUsername = localStorage.getItem('username');
    if (storedUsername !== null) {
      setUsername(storedUsername);
    } else {
      const newUsername = `Player${Math.floor(Math.random() * 1000)}`;
      setUsername(newUsername);
      localStorage.setItem('username', newUsername);
    }
    
    // Create unique clientId for this browser tab
    let clientId = sessionStorage.getItem('clientId');
    if (clientId === null) {
      clientId = uuidv4();
      sessionStorage.setItem('clientId', clientId);
    }
    
    // Connect to socket server
    console.log("Attempting to connect to socket server...");
    setIsLoading(true);
    setConnectionError(null);
    
    const newSocket = io({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to socket server with ID:', newSocket.id);
      setIsConnected(true);
      setIsLoading(false);
      setConnectionError(null);
      
      // Get initial player ID
      newSocket.emit('player:join', {
        color,
        position: [0, 0.5, 0],
        username,
        rotation: 0 // Initial rotation
      });
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setIsLoading(false);
      setConnectionError("Failed to connect to game server. Please refresh the page to try again.");
    });
    
    newSocket.on('player:id', (id) => {
      console.log('Received player ID:', id);
      setYourId(id);
    });
    
    newSocket.on('players:update', (updatedPlayers) => {
      console.log('Received players update:', updatedPlayers);
      setPlayers(updatedPlayers);
    });
    
    newSocket.on('chat:message', (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
      setIsConnected(false);
    });
    
    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
    });
    
    setSocket(newSocket);
    
    return () => {
      console.log('Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, []);
  
  // Pointer lock for mouse rotation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const requestPointerLock = () => {
      canvas.requestPointerLock = 
        canvas.requestPointerLock || 
        (canvas as any).mozRequestPointerLock || 
        (canvas as any).webkitRequestPointerLock;
      
      canvas.requestPointerLock();
    };
    
    const handlePointerLockChange = () => {
      isPointerLockedRef.current = 
        document.pointerLockElement === canvas || 
        (document as any).mozPointerLockElement === canvas || 
        (document as any).webkitPointerLockElement === canvas;
    };
    
    canvas.addEventListener('click', requestPointerLock);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mozpointerlockchange', handlePointerLockChange);
    document.addEventListener('webkitpointerlockchange', handlePointerLockChange);
    
    return () => {
      canvas.removeEventListener('click', requestPointerLock);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mozpointerlockchange', handlePointerLockChange);
      document.removeEventListener('webkitpointerlockchange', handlePointerLockChange);
    };
  }, [canvasRef.current]);
  
  // Mouse movement handler for rotation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPointerLockedRef.current) return;
      
      const movementX = e.movementX || 
                        (e as any).mozMovementX || 
                        (e as any).webkitMovementX || 0;
      
      // Update player rotation based on mouse movement
      playerRotationRef.current -= movementX * ROTATION_SPEED;
      
      // Emit movement to server
      if (socket && yourId) {
        socket.emit('player:update', {
          id: yourId,
          position: playerPositionRef.current,
          rotation: playerRotationRef.current
        });
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [socket, yourId]);
  
  // Keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          movementKeysRef.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          movementKeysRef.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          movementKeysRef.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          movementKeysRef.current.right = true;
          break;
        case 'Space':
          // Only jump if not already jumping
          if (!isJumpingRef.current) {
            movementKeysRef.current.jump = true;
          }
          break;
        case 'Escape':
          setIsInterfaceVisible(prev => !prev);
          break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          movementKeysRef.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          movementKeysRef.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          movementKeysRef.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          movementKeysRef.current.right = false;
          break;
        case 'Space':
          movementKeysRef.current.jump = false;
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Movement update loop
  useEffect(() => {
    const movePlayer = () => {
      if (!yourId) return;
      
      // Calculate movement based on current rotation
      let xMove = 0;
      let zMove = 0;
      
      // Get current rotation for direction
      const rotation = playerRotationRef.current;
      
      if (movementKeysRef.current.forward) {
        xMove += Math.sin(rotation) * MOVE_SPEED;
        zMove += Math.cos(rotation) * MOVE_SPEED;
      }
      
      if (movementKeysRef.current.backward) {
        xMove -= Math.sin(rotation) * MOVE_SPEED;
        zMove -= Math.cos(rotation) * MOVE_SPEED;
      }
      
      if (movementKeysRef.current.left) {
        xMove -= Math.cos(rotation) * MOVE_SPEED;
        zMove += Math.sin(rotation) * MOVE_SPEED;
      }
      
      if (movementKeysRef.current.right) {
        xMove += Math.cos(rotation) * MOVE_SPEED;
        zMove -= Math.sin(rotation) * MOVE_SPEED;
      }
      
      // Apply jumping
      if (movementKeysRef.current.jump && !isJumpingRef.current) {
        velocityRef.current[1] = JUMP_FORCE;
        isJumpingRef.current = true;
      }
      
      // Apply gravity
      velocityRef.current[1] -= GRAVITY;
      
      // Update position
      const newX = playerPositionRef.current[0] + xMove;
      const newY = Math.max(0.5, playerPositionRef.current[1] + velocityRef.current[1]);
      const newZ = playerPositionRef.current[2] + zMove;
      
      // Check if we've hit the ground
      if (newY <= 0.5) {
        velocityRef.current[1] = 0;
        isJumpingRef.current = false;
      }
      
      // Apply world boundaries
      const boundarySize = 19;
      const clampedX = Math.max(-boundarySize, Math.min(boundarySize, newX));
      const clampedZ = Math.max(-boundarySize, Math.min(boundarySize, newZ));
      
      playerPositionRef.current = [clampedX, newY, clampedZ];
      
      // Only emit update if there was movement
      if (xMove !== 0 || zMove !== 0 || velocityRef.current[1] !== 0) {
        socket?.emit('player:update', {
          id: yourId,
          position: playerPositionRef.current,
          rotation: rotation
        });
      }
      
      // Update camera to follow player
      if (cameraRef.current) {
        // Position camera behind player based on rotation
        const cameraDistance = 5;
        const cameraHeight = 2.5;
        const cameraX = playerPositionRef.current[0] - Math.sin(rotation) * cameraDistance;
        const cameraZ = playerPositionRef.current[2] - Math.cos(rotation) * cameraDistance;
        
        cameraRef.current.position.set(cameraX, playerPositionRef.current[1] + cameraHeight, cameraZ);
        cameraRef.current.lookAt(
          playerPositionRef.current[0],
          playerPositionRef.current[1] + 1,
          playerPositionRef.current[2]
        );
      }
    };
    
    const intervalId = setInterval(movePlayer, 16);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [socket, yourId]);
  
  // Update color
  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    
    if (socket && yourId) {
      socket.emit('player:update', {
        id: yourId,
        color: newColor,
        position: playerPositionRef.current,
        rotation: playerRotationRef.current
      });
    }
  };
  
  // Send chat message
  const sendMessage = (content: string) => {
    if (socket && content.trim() !== '') {
      const message = {
        id: uuidv4(),
        sender: username,
        content,
        timestamp: new Date().toISOString()
      };
      
      socket.emit('chat:message', message);
    }
  };
  
  // Update username
  const handleUsernameChange = (newUsername: string) => {
    if (newUsername.trim() !== '') {
      setUsername(newUsername);
      localStorage.setItem('username', newUsername);
      
      if (socket && yourId) {
        socket.emit('player:update', {
          id: yourId,
          username: newUsername,
          position: playerPositionRef.current,
          rotation: playerRotationRef.current
        });
      }
    }
  };
  
  // Keep track of your player's current position
  useEffect(() => {
    if (yourId && players[yourId]) {
      playerPositionRef.current = players[yourId].position;
      // Don't overwrite rotation from mouse controls
      // playerRotationRef.current = players[yourId].rotation || 0;
    }
  }, [players, yourId]);
  
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-black">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="text-center p-6 bg-gray-900 rounded-lg">
            <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-700 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Connecting to Game Server</h2>
            <p className="text-gray-400">Please wait while we establish connection...</p>
          </div>
        </div>
      )}
      
      {/* Connection error message */}
      {connectionError && !isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="text-center p-6 bg-gray-900 rounded-lg max-w-md">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
            <p className="text-gray-400 mb-4">{connectionError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
      
      {/* Canvas for 3D scene */}
      <Canvas 
        ref={canvasRef}
        className="w-full h-screen"
      >
        {/* Camera */}
        <PerspectiveCamera
          makeDefault
          ref={cameraRef}
          position={[0, 3, 5]}
          fov={75}
        />
        
        {/* Scene lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        
        {/* Terrain */}
        <Terrain />
        
        {/* Player shapes */}
        {Object.entries(players).map(([id, playerData]) => (
          <PlayerShape
            key={id}
            position={playerData.position}
            shape={playerData.shape || 'box'}
            color={playerData.color}
            isCurrentPlayer={id === yourId}
            username={playerData.username}
            isNew={playerData.isNew}
            rotation={playerData.rotation || 0}
          />
        ))}
      </Canvas>
      
      {/* UI overlay */}
      {isInterfaceVisible && (
        <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-4">
          <div className="w-1/4 min-w-60 bg-gray-900 bg-opacity-80 p-4 rounded-lg">
            <h2 className="text-lg font-bold text-white mb-2">Profile</h2>
            
            {/* Username input */}
            <div className="mb-4">
              <label className="block text-white text-sm mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className="w-full px-2 py-1 rounded bg-gray-800 text-white"
                maxLength={15}
              />
            </div>
            
            {/* Color picker */}
            <div className="mb-4">
              <label className="block text-white text-sm mb-1">Your Color</label>
              <ColorPicker currentColor={color} onColorChange={handleColorChange} />
            </div>
            
            {/* Controls info */}
            <div className="text-white text-sm">
              <h3 className="font-bold mb-1">Controls:</h3>
              <ul className="list-disc list-inside">
                <li>Click on game to enable mouse control</li>
                <li>WASD to move</li>
                <li>Mouse to rotate</li>
                <li>Space to jump</li>
                <li>ESC to toggle UI</li>
              </ul>
            </div>
            
            {/* Connection status */}
            <div className="mt-4">
              <div className={`text-sm flex items-center ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
              <div className="text-white text-sm mt-1">
                Players online: {Object.keys(players).length}
              </div>
            </div>
          </div>
          
          {/* Chat box */}
          <div className="flex-1">
            <Chatbox 
              messages={messages} 
              sendMessage={sendMessage} 
              username={username}
            />
          </div>
        </div>
      )}
    </main>
  );
}
