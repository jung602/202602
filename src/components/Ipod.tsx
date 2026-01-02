"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { BASE_PATH } from "@/config/basePath";
import * as THREE from "three";
import { createToonMaterialFromExisting } from "@/utils/toonMaterial";

interface IpodProps {
  [key: string]: unknown;
}

export function Ipod({ ...props }: IpodProps) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(`${BASE_PATH}/models/ipod.glb`);

  // scene 초기화 및 메테리얼 처리
  useEffect(() => {
    scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        mesh.castShadow = true;

        // 메테리얼 처리
        if (mesh.material) {
          const oldMaterial = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];

          // 이미 MeshToonMaterial로 변환된 경우 건너뛰기
          if (oldMaterial.some(mat => mat.type === 'MeshToonMaterial')) return;

          // 메테리얼 이름에 따라 옵션 다르게 적용
          const newMaterials = oldMaterial.map((mat) => {
            const matName = mat.name.toLowerCase();
            
            // ipod, screen, white 메테리얼에 따라 다른 옵션 적용 가능
            // 기본적으로는 모두 동일하게 적용
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

  return (
    <group {...props}>
      <group ref={group} dispose={null}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

useGLTF.preload(`${BASE_PATH}/models/ipod.glb`);

