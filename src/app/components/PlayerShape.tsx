"use client";

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from "@react-three/fiber";
import * as THREE from 'three';

interface PlayerShapeProps {
  position: [number, number, number];
  shape?: string; // Kept for compatibility but not used
  color: string;
  isCurrentPlayer?: boolean;
  username?: string;
  isNew?: boolean;
  rotation?: number; // New property for player rotation
}

const PlayerShape: React.FC<PlayerShapeProps> = ({ 
  position, 
  color, 
  isCurrentPlayer = false,
  username = "",
  isNew = false,
  rotation = 0
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // States for animations
  const [appeared, setAppeared] = useState(!isNew);
  
  useEffect(() => {
    // Simulate appearing animation after a small delay
    if (isNew) {
      const timer = setTimeout(() => {
        setAppeared(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  // Animations
  useFrame((state, delta) => {
    if (!meshRef.current || !groupRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Floating animation - subtle up/down
    if (appeared) {
      const floatHeight = position[1] + Math.sin(time * 1.5) * 0.05;
      groupRef.current.position.y = floatHeight;
    } else {
      // Appearing animation
      groupRef.current.position.y = position[1] - 0.5 + (0.5 * Math.min(1, time * 2));
    }
    
    // Apply rotation
    groupRef.current.rotation.y = rotation;
    
    // For current player, add subtle pulsing
    if (isCurrentPlayer) {
      const scale = 1 + Math.sin(time * 2) * 0.03;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });
  
  // Determine cube dimensions - make it slightly taller than wide
  const cubeSize = isCurrentPlayer ? 1.05 : 1;
  
  return (
    <group position={[position[0], 0, position[2]]} ref={groupRef}>
      {/* Player cube */}
      <mesh ref={meshRef}>
        <boxGeometry args={[cubeSize, cubeSize * 1.2, cubeSize]} />
        <meshStandardMaterial 
          color={color} 
          emissive={isCurrentPlayer ? color : undefined}
          emissiveIntensity={isCurrentPlayer ? 0.2 : 0}
        />
      </mesh>
      
      {/* Shadow circle */}
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 16]} />
        <meshBasicMaterial color="black" transparent opacity={0.2} />
      </mesh>
      
      {/* Display username above the shape */}
      {username && (
        <sprite
          position={[0, 1.5, 0]}
          scale={[2, 0.5, 1]}
        >
          <spriteMaterial attach="material" transparent={true}>
            <canvasTexture attach="map" image={createTextCanvas(username)} />
          </spriteMaterial>
        </sprite>
      )}
      
      {/* Current player indicator */}
      {isCurrentPlayer && (
        <mesh position={[0, -0.59, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 0.9, 16]} />
          <meshBasicMaterial color="white" transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
};

// Helper function to create text canvas for usernames
function createTextCanvas(text: string) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) return canvas;
  
  canvas.width = 256;
  canvas.height = 64;
  
  context.fillStyle = 'rgba(0, 0, 0, 0.6)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  context.font = 'bold 24px Arial';
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  return canvas;
}

export default PlayerShape; 