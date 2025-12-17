"use client";

import { Environment } from "@react-three/drei";
import { Milky } from "./Milky";

export function Experience() {
  return (
    <>
      <Milky />
      <directionalLight 
        position={[0.5, 1, 1]} // 블렌더 Sun 회전 X:30°, Y:20°, Z:0° 에 해당
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

