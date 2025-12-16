"use client";

import { Environment } from "@react-three/drei";
import { Milky } from "./Milky";

export function Experience() {
  return (
    <>
      <Environment preset="sunset" />
      <Milky />
      <directionalLight 
        position={[0, 2, 2]} 
        intensity={1} 
        castShadow 
      />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
    </>
  );
}

