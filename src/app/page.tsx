"use client";

import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { SetStateAction, useEffect, useRef, useState } from "react";
import socket from "./socket.ts";
import axios from "axios";

export default function Home() {
  const [homs, setHoms] = useState([]);
  const [myPosition, setMyPosition] = useState({ x: 0, y: 0, z: 5 });
  const [myId, setMyId] = useState("");

  const cameraRef = useRef();

  console.log(socket());
  useEffect(() => {
       // add a keyboard click listener for wasd
    document.addEventListener("keydown", (event) => {
      const key = event.key;
      if (key === "w") {
        setHoms((prev) => {
          return prev.map((player) => {
            if (player.id === myId) {
              socket.emit("updatePosition", {
                id: myId,
                position: {
                  x: player.position.x,
                  y: player.position.y + 1,
                },
              });

              setMyPosition({
                x: player.position.x,
                y: player.position.y + 1,
                z: 5,
              });

              return {
                ...player,
                position: {
                  x: player.position.x,
                  y: player.position.y + 1,
                },
              };
            }
            return player;
          });
        });
      }

      if (key === "s") {
        setHoms((prev) => {
          return prev.map((player) => {
            if (player.id === myId) {
              socket.emit("updatePosition", {
                id: myId, 
                position: {
                  x: player.position.x,
                  y: player.position.y - 1,
                },
              });

              setMyPosition({
                x: player.position.x,
                y: player.position.y - 1,
                z: 5,
              });

              return {
                ...player,
                position: {
                  x: player.position.x,
                  y: player.position.y - 1,
                },
              };
            }
            return player;
          });
        });
      }
      if (key === "a") {
        setHoms((prev) => {
          return prev.map((player) => {
            if (player.id === myId) {
              socket.emit("updatePosition", {
                id: myId,
                position: {
                  x: player.position.x - 1,
                  y: player.position.y,
                },
              });

              setMyPosition({
                x: player.position.x - 1,
                y: player.position.y,
                z: 5,
              });

              return {
                ...player,
                position: {
                  x: player.position.x - 1,
                  y: player.position.y,
                },
              };
            }
            return player;
          });
        });
      }
      if (key === "d") {
        setHoms((prev) => {
          return prev.map((player) => {
            if (player.id === myId) {
              socket.emit("updatePosition", {
                id:myId, 
                position: {
                  x: player.position.x + 1,
                  y: player.position.y,
                },
              });

              setMyPosition({
                x: player.position.x + 1,
                y: player.position.y,
                z: 5,
              });

              return {
                ...player,
                position: {
                  x: player.position.x + 1,
                  y: player.position.y,
                },
              };
            }
            return player;
          });
        });
      }
    });

  }, []);

  useEffect(() => {

  console.log(myId);

    if (cameraRef.current) {
      cameraRef.current.position.set(myPosition.x, myPosition.y, myPosition.z);
    }
  }, [myPosition]);

  useEffect(()=>{
      console.log(myId)
    }, [myId])

  return (
    <div>

      <div className="fixed top-0 left-o text-white">
      userdata : 
      {myPosition && JSON.stringify(myPosition)}
      my id : 
      {myId && myId.toString()}
      {homs && homs.length}
      </div>

      <Canvas id="game-canvas">
        <Camera
          ref={cameraRef}
          position={[myPosition.x, myPosition.y, myPosition.z]}
        />
        <ambientLight intensity={Math.PI / 2} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          decay={0}
          intensity={Math.PI}
        />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
        {
          // get the number of players and create a box for each
          homs &&
            homs.map((player, index) => {
              return (
                <Box
                  key={index}
                  position={[player.position.x, player.position.y, 0]}
                />
              );
            })
        }
      </Canvas>
    </div>
  );
}

function Box(props) {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef();
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => (ref.current.rotation.x += delta));
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 1.5 : 1}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => hover(true)}
      onPointerOut={(event) => hover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? "hotpink" : "orange"} />
    </mesh>
  );
}

function Camera(props) {
  const ref = useRef();
  const { set } = useThree();

  // Make the camera known to the system
  useEffect(() => void set({ camera: ref.current }), []);
  // Update it every frame
  useFrame(() => ref.current.updateMatrixWorld());
  return <perspectiveCamera ref={ref} {...props} />;
}
