declare module "wiggle/spring" {
  import { Bone } from "three";
  
  export class WiggleBone {
    constructor(bone: Bone, options?: { damping?: number; stiffness?: number });
    update(): void;
    reset(): void;
    dispose(): void;
  }
}

declare module "wiggle" {
  import { Bone } from "three";
  
  export class WiggleBone {
    constructor(bone: Bone, options?: { velocity?: number });
    update(): void;
    reset(): void;
    dispose(): void;
  }
}



