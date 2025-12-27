"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { WiggleBone } from "wiggle/spring";
import { BASE_PATH } from "@/config/basePath";
import * as THREE from "three";
import {
  findBoneByName,
  findAllBones,
  findHairRootBones,
  findCollisionMeshes,
  createHairWiggleBones,
  disposeWiggleBones,
  handleCollision,
} from "@/config/wiggle";
import { updateNeckRotation } from "@/config/mouse";
import { createToonMaterialFromExisting } from "@/utils/toonMaterial";

interface MilkyProps {
  [key: string]: unknown;
}

export function Milky({ ...props }: MilkyProps) {
  const group = useRef<THREE.Group>(null);
  const { nodes, scene } = useGLTF(`${BASE_PATH}/models/MILKY.glb`);

  const wiggleBones = useRef<WiggleBone[]>([]);
  const hairBones = useRef<THREE.Bone[]>([]);
  const collisionMeshes = useRef<THREE.Mesh[]>([]);
  const raycaster = useRef(new THREE.Raycaster());
  const neckBone = useRef<THREE.Bone | null>(null);
  const eyeMeshes = useRef<THREE.Mesh[]>([]);
  const rightFootBone = useRef<THREE.Bone | null>(null);
  const leftFootBone = useRef<THREE.Bone | null>(null);
  const { pointer } = useThree();

  // scene 초기화 및 Neck 본 찾기
  useEffect(() => {
    eyeMeshes.current = [];
    
    scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        mesh.castShadow = true;

        // eye 메시 찾기 (morph target이 있는 eye 메시)
        if (mesh.morphTargetInfluences && mesh.morphTargetInfluences.length > 0 && mesh.name.includes('eye')) {
          eyeMeshes.current.push(mesh);
        }

        // 기존 material을 ToonShaderMaterial로 교체 (눈 제외)
        if (mesh.material) {
          // 눈 메시는 툰 쉐이더 적용 제외
          const isEye = mesh.name.toLowerCase().includes('eye') || 
                        (Array.isArray(mesh.material) 
                          ? mesh.material.some(mat => mat.name.toLowerCase().includes('eye'))
                          : mesh.material.name.toLowerCase().includes('eye'));
          
          if (isEye) return;

          const oldMaterial = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];

          // ToonShaderMaterial 적용 (기본값 사용)
          const newMaterials = oldMaterial.map((mat) => {
            return createToonMaterialFromExisting(mat);
          });

          mesh.material = Array.isArray(mesh.material)
            ? newMaterials
            : newMaterials[0];
        }
      }
    });
    neckBone.current = findBoneByName(scene, "neck");
    
    // 발 본 찾기
    rightFootBone.current = findBoneByName(scene, "RightFoot");
    leftFootBone.current = findBoneByName(scene, "LeftFoot");
  }, [scene]);

  // 충돌 메시 찾기
  useEffect(() => {
    collisionMeshes.current = findCollisionMeshes(nodes as Record<string, THREE.Object3D>);
  }, [nodes]);

  // 머리카락 본 찾기 및 WiggleBone 생성
  useEffect(() => {
    wiggleBones.current = [];
    hairBones.current = [];

    const allBones = findAllBones(scene);
    const headBone = findBoneByName(scene, "head", true);

    if (headBone) {
      const rootBones = findHairRootBones(headBone);
      const hairWiggleBones = createHairWiggleBones(rootBones, hairBones.current);
      wiggleBones.current.push(...hairWiggleBones);
    }

    return () => {
      disposeWiggleBones(wiggleBones.current);
      hairBones.current = [];
    };
  }, [scene]);

  // 충돌 감지 및 처리 + 목 회전 + 눈 깜빡임
  useFrame((state) => {
    // Wiggle 업데이트
    wiggleBones.current.forEach((wiggleBone) => {
      wiggleBone.update();
    });

    // 마우스 위치에 따라 목 회전
    if (neckBone.current) {
      updateNeckRotation(neckBone.current, pointer.x, pointer.y);
    }

    // 눈 깜빡임 애니메이션
    const elapsed = state.clock.getElapsedTime();
    const cycleTime = elapsed % 1; // 1초 주기

    let blinkValue = 0;
    if (cycleTime < 0.167) {
      // 0-10프레임: 0 → 1 (눈 감기)
      blinkValue = cycleTime / 0.167;
    } else if (cycleTime < 0.25) {
      // 10-15프레임: 1 → 0 (눈 뜨기)
      blinkValue = 1 - (cycleTime - 0.167) / 0.083;
    }
    // 15-60프레임: 0 유지 (기본값)

    eyeMeshes.current.forEach((mesh) => {
      if (mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences[0] = blinkValue;
      }
    });

    // 발 살랑살랑 애니메이션 (좌우로 흔들기)
    const footSwingSpeed = 3; // 흔드는 속도
    const footSwingAmount = 0.05; // 흔드는 정도 (라디안)
    const footSwing = Math.sin(elapsed * footSwingSpeed) * footSwingAmount;
    
    if (rightFootBone.current) {
      rightFootBone.current.rotation.z = footSwing;
    }
    
    if (leftFootBone.current) {
      leftFootBone.current.rotation.z = -footSwing; // 반대 방향
    }

    // 충돌 감지
    if (collisionMeshes.current.length === 0) return;

    hairBones.current.forEach((bone) => {
      handleCollision(bone, raycaster.current, collisionMeshes.current);
    });
  });

  return (
    <group {...props}>
      <group ref={group} dispose={null}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

useGLTF.preload(`/models/MILKY.glb`);
