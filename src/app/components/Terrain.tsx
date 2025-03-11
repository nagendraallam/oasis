"use client";

import React from 'react';
import * as THREE from 'three';

const Terrain: React.FC = () => {
  return (
    <group>
      {/* Main floor/ground - simple grey */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color="#444444" 
          roughness={0.9}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Grid lines */}
      <gridHelper 
        args={[100, 100, "#666666", "#555555"]} 
        position={[0, -0.49, 0]} 
      />
      
      {/* Simple border walls */}
      {[
        [-50, 0, 0, 1, 3, 100], // Left wall
        [50, 0, 0, 1, 3, 100],  // Right wall
        [0, 0, -50, 100, 3, 1], // Front wall
        [0, 0, 50, 100, 3, 1]   // Back wall
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`wall-${i}`} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial 
            color="#333333" 
            transparent 
            opacity={0.8} 
          />
        </mesh>
      ))}
    </group>
  );
};

export default Terrain; 