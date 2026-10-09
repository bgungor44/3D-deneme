// .glb modelleri yükler.
//   Sütyen: ayrı Blender parçaları ve fotoğraflanmış kumaş PBR haritaları.
//   Külot:  blender/build_models.py ile prosedürel üretildi.
// Modeldeki "anchor_<id>" boş nesneleri, js/products.js'teki parça id'leriyle eşleşen bilgi noktalarıdır.
// Malzeme adları: fabric, trim, lace*, metal, gold. Renk değişimi fabric/trim/lace'e uygulanır.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const FILES = {
  bra: "models/ebru-anatomy.glb",
  panty: "models/panty.glb",
};

// Sahnedeki genişlik; kamera bu ölçüye göre ayarlı.
const TARGET_WIDTH = { bra: 2.9, panty: 2.9 };
// Başlangıç eğimi (radyan): külotun önü biraz yukarıdan görünsün.
const PITCH = { bra: 0.04, panty: 0.12 };
// Kumaş pürüzlülüğü: sütyenin kalıplı kabı parlak mikrofiber, külot mat.
const FABRIC_ROUGHNESS = { bra: 0.92, panty: 0.62 };

const draco = new DRACOLoader().setDecoderPath(
  "vendor/three/addons/libs/draco/gltf/",
);
const loader = new GLTFLoader().setDRACOLoader(draco);

// glTF malzemesini kumaş görünümlü (sheen) fiziksel malzemeye çevir; dokuları koru.
function upgrade(src, { roughness, sheenRoughness, sheer = false }) {
  const m = new THREE.MeshPhysicalMaterial({
    map: src.map,
    normalMap: src.normalMap,
    roughnessMap: src.roughnessMap,
    roughness: src.roughnessMap
      ? Math.max(src.roughness, 0.65)
      : Math.max(roughness, 0.58),
    sheen: 0.35,
    specularIntensity: 0.18,
    sheenRoughness,
    side: THREE.DoubleSide,
  });
  if (src.normalMap) m.normalScale.copy(src.normalScale);
  if (src.map) m.color.setRGB(1, 1, 1);
  if (sheer) {
    m.transparent = true;
    m.alphaTest = 0.04;
    m.depthWrite = false;
  }
  return m;
}

export async function loadModel(key, renderer) {
  const gltf = await loader.loadAsync(FILES[key]);
  const scene = gltf.scene;
  const textileColour = key === "bra"
    ? await new THREE.TextureLoader().loadAsync("blender/textile-colour.png")
    : null;
  const elasticColour = key === "bra"
    ? await new THREE.TextureLoader().loadAsync("blender/elastic-colour.png")
    : null;
  if (textileColour) {
    textileColour.colorSpace = THREE.SRGBColorSpace;
    textileColour.flipY = false;
    textileColour.wrapS = textileColour.wrapT = THREE.RepeatWrapping;
    textileColour.repeat.set(0.55, 0.55);
  }
  if (elasticColour) {
    elasticColour.colorSpace = THREE.SRGBColorSpace;
    elasticColour.flipY = false;
    elasticColour.wrapS = elasticColour.wrapT = THREE.RepeatWrapping;
  }

  // Aynı adlı malzemeleri tek nesnede topla ki renk değişimi her parçaya işlesin.
  const mats = {};
  const meshes = [];
  scene.traverse((o) => {
    if (!o.isMesh) return;
    meshes.push(o);
    const name = o.material.name;
    if (["fabric", "trim", "lining", "thread"].includes(name)) {
      mats[name] ||= upgrade(o.material, {
        roughness: FABRIC_ROUGHNESS[key],
        sheenRoughness: 0.65,
      });
      o.material = mats[name];
      if (textileColour && name !== "thread") o.material.map = textileColour;
      if (elasticColour && name === "trim") o.material.map = elasticColour;
    } else if (name.startsWith("lace")) {
      mats[name] ||= upgrade(o.material, {
        roughness: 0.5,
        sheenRoughness: 0.35,
        sheer: true,
      });
      o.material = mats[name];
      o.renderOrder = 2;
    } else {
      o.material.envMapIntensity = 1.2;
    }
  });
  const aniso = renderer.capabilities.getMaxAnisotropy();
  // eğik bakışta kumaş dokusu bulanıklaşmasın
  for (const m of Object.values(mats)) {
    if (key === "bra" && m.normalMap) {
      m.normalMap.repeat.set(m === mats.trim ? 1 : 0.55, m === mats.trim ? 1 : 0.55);
      m.normalScale.set(m === mats.trim ? 0.65 : 1.2, m === mats.trim ? 0.65 : 1.2);
    }
    if (key === "bra" && m.roughnessMap) m.roughnessMap.repeat.set(0.55, 0.55);
    for (const t of [m.map, m.normalMap, m.roughnessMap])
      if (t) t.anisotropy = aniso;
  }

  // Ortala ve ölçekle
  const groups = [];
  const partBounds = new Map();
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    if (!o.name.startsWith("part_") || !o.userData.partId) return;
    const d = o.userData.explode || [0, 0, 0];
    groups.push({
      object: o,
      origin: o.position.clone(),
      delta: new THREE.Vector3(d[0], d[2], -d[1]),
    });
    const b = new THREE.Box3().setFromObject(o);
    partBounds.set(o.name.slice(5), b.clone());
    const existing = partBounds.get(o.userData.partId);
    if (existing) existing.union(b);
    else partBounds.set(o.userData.partId, b);
  });
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  scene.position.sub(center);
  const root = new THREE.Group();
  root.add(scene);
  root.scale.setScalar(TARGET_WIDTH[key] / size.x);

  const anchors = [];
  scene.traverse((o) => {
    if (o.name.startsWith("anchor_")) {
      o.userData.partId = o.userData.partId || o.name.slice("anchor_".length);
      anchors.push(o);
    }
  });

  const tmp = new THREE.Color();
  return {
    root,
    meshes,
    anchors,
    center: new THREE.Vector3(),
    pitch: PITCH[key],
    separable: groups.length > 0,
    activePart: null,
    setAssembly(amount = 0, isolatedPart = null) {
      this.activePart = isolatedPart;
      for (const { object, origin, delta } of groups) {
        object.visible =
          !isolatedPart || object.userData.partId === isolatedPart || object.name === `part_${isolatedPart}`;
        object.position
          .copy(origin)
          .addScaledVector(delta, isolatedPart ? 0 : amount);
      }
      const selectedBox = partBounds.get(isolatedPart);
      if (selectedBox) {
        scene.position
          .copy(selectedBox.getCenter(new THREE.Vector3()))
          .negate();
        const extent = selectedBox.getSize(new THREE.Vector3());
        root.scale.setScalar(2.65 / Math.max(extent.x, extent.y, extent.z));
      } else {
        scene.position.copy(center).negate();
        root.scale.setScalar(TARGET_WIDTH[key] / size.x);
      }
      root.updateMatrixWorld(true);
    },
    setColor(hex) {
      const c = tmp.set(hex);
      for (const [name, m] of Object.entries(mats)) {
        if (name.startsWith("lace")) {
          // dantel aynı rengin biraz açığı: motifler koyu kumaşın üstünde seçilsin
          m.color.copy(c).offsetHSL(0, 0, 0.05);
          m.sheenColor.copy(c).offsetHSL(0, -0.1, 0.3);
        } else {
          m.color
            .copy(c)
            .offsetHSL(
              0,
              0,
              name === "thread"
                ? 0.045
                : name === "lining"
                  ? -0.025
                  : name === "trim"
                    ? -0.012
                    : 0,
            );
          m.sheenColor.copy(c).offsetHSL(0, -0.1, 0.18);
        }
      }
    },
  };
}
