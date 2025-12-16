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
  const { pointer } = useThree();

  // scene 초기화 및 Neck 본 찾기
  useEffect(() => {
    scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        node.castShadow = true;
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

  // 충돌 감지 및 처리 + 목 회전
  useFrame(() => {
    // Wiggle 업데이트
    wiggleBones.current.forEach((wiggleBone) => {
      wiggleBone.update();
    });

    // 마우스 위치에 따라 목 회전
    if (neckBone.current) {
      updateNeckRotation(neckBone.current, pointer.x, pointer.y);
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
