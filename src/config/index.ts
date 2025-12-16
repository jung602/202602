// Wiggle 관련 설정 및 함수
export {
  WIGGLE_CONFIG,
  HARDCODED_BONE_NAMES,
  COLLISION_MESH_NAMES,
  COLLISION_CONFIG,
  findAllBones,
  findBoneByName,
  findHairRootBones,
  getBoneNumber,
  shouldApplyWiggle,
  createHairWiggleBones,
  createHardcodedWiggleBones,
  disposeWiggleBones,
  findCollisionMeshes,
  handleCollision,
} from "./wiggle";

// 마우스 인터랙션 관련 설정 및 함수
export {
  NECK_ROTATION_CONFIG,
  MOUSE_CONFIG,
  updateNeckRotation,
  getMouseTarget,
  lookAtTarget,
  calculateRotationFromMouse,
  smoothRotation,
} from "./mouse";


