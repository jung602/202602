"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { BASE_PATH } from "@/config/basePath";
import * as THREE from "three";
import { createToonMaterialFromExisting } from "@/utils/toonMaterial";

interface IpodProps {
  [key: string]: unknown;
}

export function Ipod({ ...props }: IpodProps) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(`${BASE_PATH}/models/ipod.glb`);
  const [screenTexture, setScreenTexture] = useState<THREE.Texture | null>(null);

  // screen 이미지 텍스처 로드
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    
    // 확장자를 동적으로 처리하기 위해 여러 확장자 시도
    const possibleExtensions = ['png', 'webp', 'jpg', 'jpeg'];
    let textureLoaded = false;

    const tryLoadTexture = (index: number) => {
      if (index >= possibleExtensions.length || textureLoaded) return;
      
      const ext = possibleExtensions[index];
      const imagePath = `${BASE_PATH}/images/screen.${ext}`;
      
      loader.load(
        imagePath,
        (texture) => {
          texture.flipY = false; // GLB 모델과 좌표계 맞추기
          setScreenTexture(texture);
          textureLoaded = true;
        },
        undefined,
        () => {
          // 로드 실패 시 다음 확장자 시도
          tryLoadTexture(index + 1);
        }
      );
    };

    tryLoadTexture(0);
  }, []);

  // scene 초기화 및 메테리얼 처리
  useEffect(() => {
    if (!screenTexture) return; // 텍스처가 로드될 때까지 대기

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
  }, [scene, screenTexture]);

  return (
    <group {...props}>
      <group ref={group} dispose={null}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

useGLTF.preload(`${BASE_PATH}/models/ipod.glb`);

