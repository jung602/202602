import * as THREE from "three";

// ========== 기본값은 여기서만 정의 ==========
const DEFAULT_GLOSSINESS = 10; // 스펙큘러 날카로움 (0 = 넓게, 높을수록 날카롭게)
const DEFAULT_SPECULAR_STRENGTH = 0.1; // 스펙큘러 강도 (0 = 없음, 1 = 최대)
const DEFAULT_RIM_STRENGTH = 1; // 림 강도 (0 = 없음, 1 = 최대)
const DEFAULT_RIM_WIDTH = 2.5// 림 위치 (0 = 넓게, 1 = 좁게)
const DEFAULT_RIM_SHARPNESS = 0.5; // 림 날카로움 (0 = 부드럽게, 1 = 날카롭게)

interface ToonEnhanceOptions {
  glossiness?: number;
  specularStrength?: number;
  rimStrength?: number;
  rimWidth?: number;
  rimSharpness?: number;
}

/**
 * MeshToonMaterial에 스펙큘러 + 림 라이팅 효과를 주입
 * onBeforeCompile을 사용하여 기존 MeshToonMaterial의 셰이더를 확장
 */
export function enhanceToonMaterial(
  material: THREE.MeshToonMaterial,
  options: ToonEnhanceOptions = {}
): THREE.MeshToonMaterial {
  // 기본값은 여기서 적용
  const glossiness = options.glossiness ?? DEFAULT_GLOSSINESS;
  const specularStrength = options.specularStrength ?? DEFAULT_SPECULAR_STRENGTH;
  const rimStrength = options.rimStrength ?? DEFAULT_RIM_STRENGTH;
  const rimWidth = options.rimWidth ?? DEFAULT_RIM_WIDTH;
  const rimSharpness = options.rimSharpness ?? DEFAULT_RIM_SHARPNESS;

  material.onBeforeCompile = (shader) => {
    // uniform 추가
    shader.uniforms.uGlossiness = { value: glossiness };
    shader.uniforms.uSpecularStrength = { value: specularStrength };
    shader.uniforms.uRimStrength = { value: rimStrength };
    shader.uniforms.uRimWidth = { value: rimWidth };
    shader.uniforms.uRimSharpness = { value: rimSharpness };

    // ========== Fragment Shader 수정 ==========
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `
      #include <common>
      uniform float uGlossiness;
      uniform float uSpecularStrength;
      uniform float uRimStrength;
      uniform float uRimWidth;
      uniform float uRimSharpness;
      `
    );

    // 최종 색상 계산 전에 스펙큘러 + 림 추가
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `
      // === 스펙큘러 (빛 고정) + 림 (카메라 따라 움직임) ===
      vec3 viewDir = normalize(vViewPosition);
      vec3 enhancedNormal = normalize(vNormal);
      
      #if NUM_DIR_LIGHTS > 0
        vec3 dirLightDir = directionalLights[0].direction;
        vec3 dirLightColor = directionalLights[0].color;
        float dirLightStrength = length(dirLightColor);
      #else
        vec3 dirLightDir = normalize(vec3(1.0, 1.0, 1.0));
        float dirLightStrength = 1.0;
      #endif
      
      // 빛 방향과 노말의 관계
      float NdotL = dot(enhancedNormal, dirLightDir);
      float lightFacing = max(0.0, NdotL);  // 빛을 받는 정도 (0~1)
      
      // Specular - 빛을 정면으로 받는 부분에만 하이라이트 (카메라 무관, 빛에 고정)
      float specThreshold = 1.0 - (1.0 / (uGlossiness + 1.0));
      float specularIntensity = smoothstep(specThreshold - 0.05, specThreshold + 0.05, lightFacing);
      specularIntensity *= dirLightStrength;
      
      // Rim lighting - 카메라 기준 가장자리 + 빛 마스킹 (카메라 따라 움직임)
      float rimDot = 1.0 - dot(viewDir, enhancedNormal);  // 카메라 기준 가장자리
      float rimIntensity = rimDot * lightFacing * dirLightStrength;  // 빛 받는 면에서만
      
      // 림 날카로움 조절 (sharpness가 높을수록 edge가 좁아짐)
      float rimEdge = 0.01 + (1.0 - uRimSharpness) * 0.15;
      rimIntensity = smoothstep(uRimWidth - rimEdge, uRimWidth + rimEdge, rimIntensity);
      
      // outgoingLight 기반 증폭
      outgoingLight *= (1.0 + specularIntensity * uSpecularStrength);
      outgoingLight *= (1.0 + rimIntensity * uRimStrength);
      
      #include <opaque_fragment>
      `
    );
  };

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
  specularStrength?: number;
  rimStrength?: number;
  rimWidth?: number;
  rimSharpness?: number;
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
    // 기본값 적용하지 않고 그대로 전달
    glossiness,
    specularStrength,
    rimStrength,
    rimWidth,
    rimSharpness,
  } = options;

  const material = new THREE.MeshToonMaterial({
    color: color instanceof THREE.Color ? color : new THREE.Color(color),
    map: map,
    normalMap: normalMap,
    normalScale: normalScale,
    gradientMap: gradientMap,
    side: THREE.DoubleSide,
  });

  // 전달받은 값 그대로 넘김 (undefined면 enhanceToonMaterial에서 기본값 적용)
  enhanceToonMaterial(material, { glossiness, specularStrength, rimStrength, rimWidth, rimSharpness });

  return material;
}

/**
 * 기존 머티리얼에서 속성을 추출하여 Enhanced MeshToonMaterial 생성
 */
export function createToonMaterialFromExisting(
  oldMaterial: THREE.Material,
  options: ToonEnhanceOptions = {}
): THREE.MeshToonMaterial {
  // 기본값 적용하지 않고 그대로 전달
  const { glossiness, specularStrength, rimStrength, rimWidth, rimSharpness } = options;

  let color: THREE.Color = new THREE.Color("#ffffff");
  let map: THREE.Texture | null = null;
  let normalMap: THREE.Texture | null = null;
  let normalScale: THREE.Vector2 = new THREE.Vector2(1, 1);

  // 기존 머티리얼에서 색상 추출
  if ("color" in oldMaterial && oldMaterial.color instanceof THREE.Color) {
    const oldColor = oldMaterial.color as THREE.Color;
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

  // 기존 머티리얼 폐기
  oldMaterial.dispose();

  // 전달받은 값 그대로 넘김
  return createEnhancedToonMaterial({
    color,
    map,
    normalMap,
    normalScale,
    glossiness,
    specularStrength,
    rimStrength,
    rimWidth,
    rimSharpness,
  });
}
