"use client";

import { Environment } from "@react-three/drei";
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
      />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
    </>
  );
}

