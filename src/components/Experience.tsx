"use client";

import { Environment, Grid } from "@react-three/drei";
import { Milky } from "./Milky";

export function Experience() {
  return (
    <>
      <Environment preset="city" />
      <Milky />
      <directionalLight 
        position={[2, 2, 2]}
        intensity={3} 
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={0.01}
        shadow-camera-far={10}
        shadow-bias={-0.0001}
        shadow-radius={10}
      />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <Grid
        position={[0, 0.001, 0]}
        args={[100, 100]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#ddd"
        sectionSize={0.5}
        sectionThickness={1}
        sectionColor="#bbb"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid
      />
    </>
  );
}

