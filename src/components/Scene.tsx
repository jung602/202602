"use client";

import { Loader, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Experience } from "./Experience";

export function Scene() {
  return (
    <div className="w-full h-screen">
      <Loader />
      <Canvas shadows="soft" orthographic camera={{ position: [10, 10, 10], zoom: 300 }}>
        <OrbitControls 
        autoRotate={true}
        autoRotateSpeed={0.5}
        />
        <color attach="background" args={["#fff"]} />
        <fog attach="fog" args={["#fff", 1, 100]} />
        <group position-y={-.15}>
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </group>
      </Canvas>
    </div>
  );
}

