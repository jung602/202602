"use client";

import { Loader, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Experience } from "./Experience";

export function Scene() {
  return (
    <div className="w-full h-screen">
      <Loader />
      <Canvas shadows="soft" camera={{ position: [4, 2, 3], fov: 30 }}>
        <OrbitControls />
        <color attach="background" args={["#fff"]} />
        <fog attach="fog" args={["#fff", 5, 20]} />
        <group position-y={0}>
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </group>
      </Canvas>
    </div>
  );
}

