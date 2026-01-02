"use client";

import { Loader, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Experience } from "./Experience";

export function Scene() {
  return (
    <div className="w-full h-screen">
      <Loader />
      <Canvas shadows="variance" orthographic camera={{ position: [10, 7.5, 10], zoom: 300 }}>
        <OrbitControls 
        autoRotate={true}
        autoRotateSpeed={0.25}
        enablePan={false}
        minZoom={200}
        maxZoom={400}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.3}
        />
        <color attach="background" args={["#fff"]} />
        <fog attach="fog" args={["#fff", 1, 100]} />
        <group position-y={-.3}>
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </group>
      </Canvas>
    </div>
  );
}

