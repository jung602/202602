"use client";

import { Environment, Grid } from "@react-three/drei";
import { Milky } from "./Milky";
import { Ipod } from "./Ipod";

export function Experience() {
  return (
    <>
      <Milky 
      rotation-y={-0.2}
      position={[0, 0, -0.3]}
      />
      <Ipod
      rotation-y={-0.5}
      position={[0, 0.001, -0.3]} />

      <directionalLight 
        position={[0.5, 1.25, 1]}
        intensity={3}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-radius={1}
        shadow-blurSamples={8}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={0.01}
        shadow-camera-far={10}
        shadow-bias={-0.0001}
      />



      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#fff" emissive="#fff" />
      </mesh>
      <Grid
        position={[0, 0.001, 0]}
        args={[100, 100]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#bbb"
        sectionSize={0.5}
        sectionThickness={1}
        sectionColor="#ddd"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid
      />
    </>
  );
}

