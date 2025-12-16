import * as THREE from "three";

// 목 회전 설정
export const NECK_ROTATION_CONFIG = {
  maxRotation: Math.PI / 6, // 30도
  verticalMultiplier: 0.5,
  lerpFactor: 0.08,
};

// 마우스 인터랙션 설정
export const MOUSE_CONFIG = {
  // 마우스 따라가기 활성화
  enabled: true,
  // 반응 속도 (낮을수록 느림)
  responsiveness: 0.08,
};

/**
 * 목 회전 업데이트 - 마우스 위치에 따라 목이 회전
 */
export function updateNeckRotation(
  neckBone: THREE.Bone,
  pointerX: number,
  pointerY: number
): void {
  const { maxRotation, verticalMultiplier, lerpFactor } = NECK_ROTATION_CONFIG;

  const targetRotationY = pointerX * maxRotation;
  const targetRotationX = -pointerY * maxRotation * verticalMultiplier;

  neckBone.rotation.y = THREE.MathUtils.lerp(
    neckBone.rotation.y,
    targetRotationY,
    lerpFactor
  );
  neckBone.rotation.x = THREE.MathUtils.lerp(
    neckBone.rotation.x,
    targetRotationX,
    lerpFactor
  );
}

/**
 * 마우스 위치를 3D 공간의 타겟 포인트로 변환
 */
export function getMouseTarget(
  pointerX: number,
  pointerY: number,
  distance: number = 5
): THREE.Vector3 {
  return new THREE.Vector3(
    pointerX * distance,
    pointerY * distance,
    distance
  );
}

/**
 * 본이 특정 타겟을 바라보도록 회전 (lookAt 기반)
 */
export function lookAtTarget(
  bone: THREE.Bone,
  target: THREE.Vector3,
  lerpFactor: number = 0.1
): void {
  const currentQuaternion = bone.quaternion.clone();
  bone.lookAt(target);
  const targetQuaternion = bone.quaternion.clone();
  
  bone.quaternion.copy(currentQuaternion);
  bone.quaternion.slerp(targetQuaternion, lerpFactor);
}

/**
 * 마우스 위치에 따른 회전 각도 계산
 */
export function calculateRotationFromMouse(
  pointerX: number,
  pointerY: number,
  maxAngle: number = Math.PI / 6
): { x: number; y: number } {
  return {
    x: -pointerY * maxAngle * NECK_ROTATION_CONFIG.verticalMultiplier,
    y: pointerX * maxAngle,
  };
}

/**
 * 부드러운 회전 적용
 */
export function smoothRotation(
  currentRotation: THREE.Euler,
  targetX: number,
  targetY: number,
  lerpFactor: number = MOUSE_CONFIG.responsiveness
): void {
  currentRotation.x = THREE.MathUtils.lerp(currentRotation.x, targetX, lerpFactor);
  currentRotation.y = THREE.MathUtils.lerp(currentRotation.y, targetY, lerpFactor);
}

