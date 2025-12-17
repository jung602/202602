import * as THREE from "three";
import { WiggleBone } from "wiggle/spring";

// Wiggle 설정 상수
export const WIGGLE_CONFIG = {
  // 머리카락 기본 설정
  hair: {
    damping: 200,
    stiffness: 2000,
  },
  // 하드코딩된 본들 설정 (bake1, bake4, bake5)
  hardcoded: {
    damping: 80,
    stiffness: 1200,
  },
  // baketail 본들은 2부터, 나머지는 5부터 적용
  minBoneNum: {
    baketail: 2,
    default: 5,
  },
};

// 충돌 메시 이름들
export const COLLISION_MESH_NAMES = [
  "shoes_mesh_shape_mesh015",
  "cloth_shape_0008",
  "cloth_shape_0008_1",
];

// 충돌 감지 설정
export const COLLISION_CONFIG = {
  distanceThreshold: 0.03,
  offsetY: 0.02,
  lerpFactor: 0.3,
};

/**
 * scene에서 모든 본을 찾아서 반환
 */
export function findAllBones(scene: THREE.Object3D): THREE.Bone[] {
  const allBones: THREE.Bone[] = [];
  scene.traverse((node) => {
    if ((node as THREE.Bone).isBone) {
      allBones.push(node as THREE.Bone);
    }
  });
  return allBones;
}

/**
 * scene에서 특정 이름을 포함하는 본을 찾아서 반환
 */
export function findBoneByName(
  scene: THREE.Object3D,
  name: string,
  exact: boolean = false
): THREE.Bone | null {
  let foundBone: THREE.Bone | null = null;
  scene.traverse((node) => {
    if ((node as THREE.Bone).isBone) {
      if (exact) {
        if (node.name.toLowerCase() === name.toLowerCase()) {
          foundBone = node as THREE.Bone;
        }
      } else {
        if (node.name.toLowerCase().includes(name.toLowerCase())) {
          foundBone = node as THREE.Bone;
        }
      }
    }
  });
  return foundBone;
}

/**
 * head 본의 자식들 중에서 0으로 끝나는 본들 찾기 (머리카락 루트 본)
 */
export function findHairRootBones(headBone: THREE.Bone): THREE.Bone[] {
  const rootBones: THREE.Bone[] = [];
  headBone.children.forEach((child) => {
    if ((child as THREE.Bone).isBone && /0$/.test(child.name)) {
      rootBones.push(child as THREE.Bone);
    }
  });
  return rootBones;
}

/**
 * 본 이름에서 마지막 숫자 추출
 */
export function getBoneNumber(boneName: string): number | null {
  const match = boneName.match(/(\d+)$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/**
 * 본에 wiggle이 적용되어야 하는지 확인
 */
export function shouldApplyWiggle(bone: THREE.Bone): boolean {
  const boneNum = getBoneNumber(bone.name);
  if (boneNum === null) return false;

  const isBaketail = bone.name.toLowerCase().includes("baketail");
  const minBoneNum = isBaketail
    ? WIGGLE_CONFIG.minBoneNum.baketail
    : WIGGLE_CONFIG.minBoneNum.default;

  return boneNum >= minBoneNum;
}

/**
 * 머리카락 본들에 WiggleBone 생성
 */
export function createHairWiggleBones(
  rootBones: THREE.Bone[],
  hairBones: THREE.Bone[]
): WiggleBone[] {
  const wiggleBones: WiggleBone[] = [];

  rootBones.forEach((rootBone) => {
    rootBone.traverse((bone) => {
      if ((bone as THREE.Bone).isBone && shouldApplyWiggle(bone as THREE.Bone)) {
        if (!hairBones.includes(bone as THREE.Bone)) {
          hairBones.push(bone as THREE.Bone);
          const wiggleBone = new WiggleBone(bone as THREE.Bone, WIGGLE_CONFIG.hair);
          wiggleBones.push(wiggleBone);
        }
      }
    });
  });

  return wiggleBones;
}


/**
 * WiggleBone 정리
 */
export function disposeWiggleBones(wiggleBones: WiggleBone[]): void {
  wiggleBones.forEach((wiggleBone) => {
    wiggleBone.reset();
    wiggleBone.dispose();
  });
}

/**
 * 충돌 메시 찾기
 */
export function findCollisionMeshes(
  nodes: Record<string, THREE.Object3D>
): THREE.Mesh[] {
  const collisionMeshes: THREE.Mesh[] = [];

  // 기본 충돌 메시
  COLLISION_MESH_NAMES.forEach((meshName) => {
    if (nodes[meshName]) {
      collisionMeshes.push(nodes[meshName] as THREE.Mesh);
    }
  });

  // hair 메시들도 충돌 대상에 추가
  Object.keys(nodes).forEach((name) => {
    const node = nodes[name];
    if (name.toLowerCase().startsWith("hair") && (node as THREE.Mesh).isMesh) {
      collisionMeshes.push(node as THREE.Mesh);
    }
  });

  return collisionMeshes;
}

/**
 * 충돌 감지 및 본 위치 조정
 */
export function handleCollision(
  bone: THREE.Bone,
  raycaster: THREE.Raycaster,
  collisionMeshes: THREE.Mesh[]
): void {
  const boneWorldPos = new THREE.Vector3();
  const direction = new THREE.Vector3(0, -1, 0);

  bone.getWorldPosition(boneWorldPos);
  raycaster.set(boneWorldPos, direction);

  for (const mesh of collisionMeshes) {
    const intersects = raycaster.intersectObject(mesh, true);

    if (intersects.length > 0) {
      const distance = intersects[0].distance;
      const collisionPoint = intersects[0].point;

      if (distance < COLLISION_CONFIG.distanceThreshold) {
        const localPos = new THREE.Vector3();
        if (bone.parent) {
          bone.parent.worldToLocal(localPos.copy(collisionPoint));
          const targetY = localPos.y + COLLISION_CONFIG.offsetY;
          bone.position.y = THREE.MathUtils.lerp(
            bone.position.y,
            Math.max(bone.position.y, targetY),
            COLLISION_CONFIG.lerpFactor
          );
        }
        break;
      }
    }
  }
}

