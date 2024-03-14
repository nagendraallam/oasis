"use client";

import { Canvas, extend, useFrame } from "@react-three/fiber";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

export default function Home() {
  const [homs, setHoms] = useState([]);
  const [myId, setMyId] = useState("");

  useEffect(() => {
    const socket = io();

    setMyId(socket.id);

    socket.on("connect", () => {
      console.log("connected");
    });

    socket.on("refreshPositions", (position) => {
      console.log("refreshPosition", position);
      setHoms(position);
    });

    // add a keyboard click listener for wasd
    document.addEventListener("keydown", (event) => {
      const key = event.key;
      if (key === "w") {
        // updated all positions by +1
        setHoms((prev) => {
          return prev.map((player) => {
            if (player.id === socket.id) {
              socket.emit("updatePosition", {
                id: socket.id,
                position: {
                  x: player.position.x,
                  y: player.position.y + 1,
                },
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
            if (player.id === socket.id) {
              socket.emit("updatePosition", {
                id: socket.id,
                position: {
                  x: player.position.x,
                  y: player.position.y - 1,
                },
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
            if (player.id === socket.id) {
              socket.emit("updatePosition", {
                id: socket.id,
                position: {
                  x: player.position.x - 1,
                  y: player.position.y,
                },
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
            if (player.id === socket.id) {
              socket.emit("updatePosition", {
                id: socket.id,
                position: {
                  x: player.position.x + 1,
                  y: player.position.y,
                },
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

    return () => {
      socket.emit("close", socket.id);
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 75,
          near: 0.1,
          far: 1000,
        }}
        shadows={true}
        id="game-canvas"
      >
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
