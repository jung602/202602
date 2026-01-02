"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { BASE_PATH } from "@/config/basePath";
import * as THREE from "three";
import { createToonMaterialFromExisting } from "@/utils/toonMaterial";

interface BallProps {
  [key: string]: unknown;
}

export function Ball({ ...props }: BallProps) {
  const group = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Mesh | null>(null);
  const { scene } = useGLTF(`${BASE_PATH}/models/duskball.glb`);
  const [isHovered, setIsHovered] = useState(false);

  // scene 초기화 및 메테리얼 처리
  useEffect(() => {
    scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        mesh.castShadow = true;

        // lid 매쉬 찾기
        if (mesh.name === "lid" || mesh.name.toLowerCase().includes("lid")) {
          lidRef.current = mesh;
        }

        // 메테리얼 처리
        if (mesh.material) {
          const oldMaterial = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];

          // 이미 MeshToonMaterial로 변환된 경우 건너뛰기
          if (oldMaterial.some(mat => mat.type === 'MeshToonMaterial')) return;

          // 다른 메테리얼은 툰 쉐이더 적용
          const newMaterials = oldMaterial.map((mat) => {
            return createToonMaterialFromExisting(mat, {
              specularStrength2: undefined, // 기본값 사용
            });
          });

          mesh.material = Array.isArray(mesh.material)
            ? newMaterials
            : newMaterials[0];
        }
      }
    });
  }, [scene]);

  // lid 회전 애니메이션
  useFrame(() => {
    if (lidRef.current) {
      const targetRotation = isHovered ? -Math.PI / 6 : 0; // 45도 = Math.PI / 4
      lidRef.current.rotation.x = THREE.MathUtils.lerp(
        lidRef.current.rotation.x,
        targetRotation,
        0.1
      );
    }
  });

  return (
    <group
      {...props}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <group ref={group} dispose={null}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

useGLTF.preload(`${BASE_PATH}/models/duskball.glb`);

