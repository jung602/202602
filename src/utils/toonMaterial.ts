import * as THREE from "three";

/**
 * MeshToonMaterial에 스펙큘러(Blinn-Phong) + 림 라이팅 효과를 주입
 * onBeforeCompile을 사용하여 기존 MeshToonMaterial의 셰이더를 확장
 */
export function enhanceToonMaterial(
  material: THREE.MeshToonMaterial,
  glossiness: number = 20
): THREE.MeshToonMaterial {
  material.onBeforeCompile = (shader) => {
    // uniform 추가
    shader.uniforms.uGlossiness = { value: glossiness };

    // ========== Fragment Shader 수정 ==========
    // uniform 선언 추가 (vViewPosition은 MeshToonMaterial에 이미 존재)
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `
      #include <common>
      uniform float uGlossiness;
      `
    );

    // 최종 색상 계산 전에 스펙큘러 + 림 추가
    // outgoingLight에는 이미 텍스처+노말맵+라이팅이 반영되어 있음
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `
      // === 스펙큘러 + 림 라이팅 추가 ===
      vec3 viewDir = normalize(vViewPosition);
      vec3 enhancedNormal = normalize(vNormal);
      
      #if NUM_DIR_LIGHTS > 0
        vec3 dirLightDir = directionalLights[0].direction;
      #else
        vec3 dirLightDir = normalize(vec3(1.0, 1.0, 1.0));
      #endif
      
      float NdotL = dot(enhancedNormal, dirLightDir);
      float lightIntensity = smoothstep(0.0, 0.01, NdotL);
      
      // Specular (Blinn-Phong)
      vec3 halfVector = normalize(dirLightDir + viewDir);
      float NdotH = dot(enhancedNormal, halfVector);
      float specularIntensity = pow(max(0.0, NdotH * lightIntensity), uGlossiness * uGlossiness);
      float specularIntensitySmooth = smoothstep(0.05, 0.1, specularIntensity);
      
      // Rim lighting
      float rimDot = 1.0 - dot(viewDir, enhancedNormal);
      float rimAmount = 0.6;
      float rimThreshold = 0.2;
      float rimIntensity = rimDot * pow(max(0.0, NdotL), rimThreshold);
      rimIntensity = smoothstep(rimAmount - 0.01, rimAmount + 0.01, rimIntensity);
      
      // outgoingLight 기반 증폭 (텍스처/단색/노말맵 모두 자연스럽게 반영)
      outgoingLight *= (1.0 + specularIntensitySmooth * 0.5);  // 스펙큘러 증폭
      outgoingLight *= (1.0 + rimIntensity * 0.6);            // 림 증폭
      
      #include <opaque_fragment>
      `
    );
  };

  // onBeforeCompile 변경 후 재컴파일 트리거
  material.needsUpdate = true;

  return material;
}

interface EnhancedToonOptions {
  color?: THREE.Color | string;
  map?: THREE.Texture | null;
  normalMap?: THREE.Texture | null;
  normalScale?: THREE.Vector2;
  gradientMap?: THREE.Texture | null;
  glossiness?: number;
}

/**
 * 스펙큘러 + 림 라이팅이 포함된 MeshToonMaterial 생성
 */
export function createEnhancedToonMaterial(
  options: EnhancedToonOptions = {}
): THREE.MeshToonMaterial {
  const {
    color = "#ffffff",
    map = null,
    normalMap = null,
    normalScale = new THREE.Vector2(1, 1),
    gradientMap = null,
    glossiness = 20,
  } = options;

  const material = new THREE.MeshToonMaterial({
    color: color instanceof THREE.Color ? color : new THREE.Color(color),
    map: map,
    normalMap: normalMap,
    normalScale: normalScale,
    gradientMap: gradientMap,
    side: THREE.DoubleSide,
  });

  // 스펙큘러 + 림 라이팅 효과 추가
  enhanceToonMaterial(material, glossiness);

  return material;
}

/**
 * 기존 머티리얼에서 속성을 추출하여 Enhanced MeshToonMaterial 생성
 */
export function createToonMaterialFromExisting(
  oldMaterial: THREE.Material,
  options: { glossiness?: number } = {}
): THREE.MeshToonMaterial {
  const { glossiness = 20 } = options;

  let color: THREE.Color = new THREE.Color("#ffffff");
  let map: THREE.Texture | null = null;
  let normalMap: THREE.Texture | null = null;
  let normalScale: THREE.Vector2 = new THREE.Vector2(1, 1);

  // 기존 머티리얼에서 색상 추출
  if ("color" in oldMaterial && oldMaterial.color instanceof THREE.Color) {
    const oldColor = oldMaterial.color as THREE.Color;
    // 색상이 너무 어두우면(검은색에 가까우면) 기본 흰색 사용
    const luminance =
      oldColor.r * 0.299 + oldColor.g * 0.587 + oldColor.b * 0.114;
    if (luminance > 0.01) {
      color = oldColor.clone();
    }
  }

  // 디퓨즈 맵 추출
  if ("map" in oldMaterial && oldMaterial.map) {
    map = oldMaterial.map as THREE.Texture;
  }

  // 노말 맵 추출
  if ("normalMap" in oldMaterial && oldMaterial.normalMap) {
    normalMap = oldMaterial.normalMap as THREE.Texture;
  }

  // 노말 스케일 추출
  if ("normalScale" in oldMaterial && oldMaterial.normalScale) {
    normalScale = (oldMaterial.normalScale as THREE.Vector2).clone();
  }

  // 기존 머티리얼 폐기 (텍스처는 폐기하지 않음)
  oldMaterial.dispose();

  return createEnhancedToonMaterial({
    color,
    map,
    normalMap,
    normalScale,
    glossiness,
  });
}
