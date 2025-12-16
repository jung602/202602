"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { WiggleBone } from "wiggle/spring";
import * as THREE from "three";
import {
  findBoneByName,
  findAllBones,
  findHairRootBones,
  findCollisionMeshes,
  createHairWiggleBones,
  createHardcodedWiggleBones,
  disposeWiggleBones,
  handleCollision,
} from "@/config/wiggle";
import { updateNeckRotation } from "@/config/mouse";

interface MilkyProps {
  [key: string]: unknown;
}

export function Milky({ ...props }: MilkyProps) {
  const group = useRef<THREE.Group>(null);
  const { nodes, scene } = useGLTF(`/models/MILKY.glb`);

  const wiggleBones = useRef<WiggleBone[]>([]);
  const hairBones = useRef<THREE.Bone[]>([]);
  const collisionMeshes = useRef<THREE.Mesh[]>([]);
  const raycaster = useRef(new THREE.Raycaster());
  const neckBone = useRef<THREE.Bone | null>(null);
  const eyeMeshes = useRef<THREE.Mesh[]>([]);
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

        // 기존 material을 MeshToonMaterial로 교체 (눈 제외)
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

          const newMaterials = oldMaterial.map((mat) => {
            const toonMaterial = new THREE.MeshToonMaterial();

            // 기존 material의 속성들을 새 material에 복사
            if ('color' in mat) toonMaterial.color.copy(mat.color as THREE.Color);
            if ('map' in mat) toonMaterial.map = mat.map as THREE.Texture | null;
            if ('normalMap' in mat) toonMaterial.normalMap = mat.normalMap as THREE.Texture | null;
            if ('normalScale' in mat && mat.normalScale) {
              toonMaterial.normalScale.copy(mat.normalScale as THREE.Vector2);
            }
            if ('opacity' in mat) toonMaterial.opacity = mat.opacity as number;
            if ('transparent' in mat) toonMaterial.transparent = mat.transparent as boolean;
            if ('alphaMap' in mat) toonMaterial.alphaMap = mat.alphaMap as THREE.Texture | null;
            if ('aoMap' in mat) toonMaterial.aoMap = mat.aoMap as THREE.Texture | null;
            if ('aoMapIntensity' in mat) toonMaterial.aoMapIntensity = mat.aoMapIntensity as number;
            if ('emissive' in mat && mat.emissive) {
              toonMaterial.emissive.copy(mat.emissive as THREE.Color);
            }
            if ('emissiveMap' in mat) toonMaterial.emissiveMap = mat.emissiveMap as THREE.Texture | null;
            if ('emissiveIntensity' in mat) toonMaterial.emissiveIntensity = mat.emissiveIntensity as number;

            // 기존 material 폐기
            mat.dispose();

            return toonMaterial;
          });

          mesh.material = Array.isArray(mesh.material)
            ? newMaterials
            : newMaterials[0];
        }
      }
    });
    neckBone.current = findBoneByName(scene, "neck");
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

    const hardcodedWiggleBones = createHardcodedWiggleBones(allBones, hairBones.current);
    wiggleBones.current.push(...hardcodedWiggleBones);

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
