// .glb modelleri yükler.
//   Sütyen: Tripo modeli, blender/fix_red_bra.py ile düzeltildi (Draco sıkıştırmalı, dokusuz).
//   Külot:  blender/build_models.py ile prosedürel üretildi.
// Modeldeki "anchor_<id>" boş nesneleri, js/products.js'teki parça id'leriyle eşleşen bilgi noktalarıdır.
// Malzeme adları: fabric, trim, lace*, metal, gold. Renk değişimi fabric/trim/lace'e uygulanır.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const FILES = {
  bra: "models/sutyen.glb",
  panty: "models/panty.glb",
};

// Sahnedeki genişlik; kamera bu ölçüye göre ayarlı.
const TARGET_WIDTH = { bra: 2.9, panty: 2.9 };
// Başlangıç eğimi (radyan): külotun önü biraz yukarıdan görünsün.
const PITCH = { bra: 0.04, panty: 0.12 };
// Kumaş pürüzlülüğü: sütyenin kalıplı kabı parlak mikrofiber, külot mat.
const FABRIC_ROUGHNESS = { bra: 0.4, panty: 0.62 };

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
    sheen: 0.45,
    sheenRoughness,
    side: THREE.DoubleSide,
  });
  if (src.normalMap) m.normalScale.copy(src.normalScale);
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

  // Aynı adlı malzemeleri tek nesnede topla ki renk değişimi her parçaya işlesin.
  const mats = {};
  const meshes = [];
  scene.traverse((o) => {
    if (!o.isMesh) return;
    meshes.push(o);
    const name = o.material.name;
    if (name === "fabric" || name === "trim") {
      mats[name] ||= upgrade(o.material, {
        roughness: name === "trim" ? 0.42 : FABRIC_ROUGHNESS[key],
        sheenRoughness: 0.45,
      });
      o.material = mats[name];
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
    for (const t of [m.map, m.normalMap, m.roughnessMap])
      if (t) t.anisotropy = aniso;
  }

  // Ortala ve ölçekle
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
    setColor(hex) {
      const c = tmp.set(hex);
      for (const [name, m] of Object.entries(mats)) {
        if (name.startsWith("lace")) {
          // dantel aynı rengin biraz açığı: motifler koyu kumaşın üstünde seçilsin
          m.color.copy(c).offsetHSL(0, 0, 0.05);
          m.sheenColor.copy(c).offsetHSL(0, -0.1, 0.3);
        } else {
          m.color.copy(c).offsetHSL(0, 0, name === "trim" ? -0.02 : 0);
          m.sheenColor.copy(c).offsetHSL(0, -0.1, 0.18);
        }
      }
    },
  };
}
