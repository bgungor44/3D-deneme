import { readFile, access, readdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { PRODUCTS } from "../js/products.js";
const root = new URL("../", import.meta.url);
let count = 0;
async function exists(file) {
  await access(new URL(file, root));
  count++;
}
for (const [key, filename] of Object.entries({
  bra: "ebru-anatomy.glb",
  panty: "panty.glb",
})) {
  const binary = await readFile(new URL(`models/${filename}`, root));
  assert.equal(binary.readUInt32LE(0), 0x46546c67, `${filename}: GLB magic`);
  assert.equal(binary.readUInt32LE(4), 2, `${filename}: GLB version`);
  assert.equal(
    binary.readUInt32LE(8),
    binary.length,
    `${filename}: intact binary`,
  );
  assert.equal(binary.readUInt32LE(16), 0x4e4f534a, `${filename}: JSON chunk`);
  const gltf = JSON.parse(
    binary.subarray(20, 20 + binary.readUInt32LE(12)).toString(),
  );
  for (const part of PRODUCTS[key].parts)
    assert(
      gltf.nodes.some((node) => node.name === `anchor_${part.id}`),
      `${filename}: missing anchor ${part.id}`,
    );
  for (const buffer of gltf.buffers || [])
    assert(!buffer.uri, `${filename}: external buffer dependency`);
  for (const image of gltf.images || [])
    assert(!image.uri, `${filename}: external image dependency`);
  if (key === "bra") {
    const groups = gltf.nodes.filter((n) => n.name?.startsWith("part_"));
    assert.equal(
      groups.length,
      10,
      "Bra must contain ten independently transformable groups",
    );
    for (const part of PRODUCTS.bra.parts) {
      const matches = groups.filter((n) => n.extras?.partId === part.id);
      assert(matches.length, `Missing geometry group: ${part.id}`);
      for (const group of matches) {
        assert(
          group.children?.some((i) => gltf.nodes[i].mesh !== undefined),
          `Empty part: ${group.name}`,
        );
        assert(
          group.extras.explode.length === 3 &&
            group.extras.explode.every(Number.isFinite),
          `Invalid separation: ${group.name}`,
        );
      }
    }
    const names = gltf.materials.map((m) => m.name);
    for (const name of ["fabric", "lining", "trim", "thread", "metal"])
      assert(names.includes(name), `Missing material: ${name}`);
    assert(
      gltf.materials.find((m) => m.name === "fabric").normalTexture,
      "Textile normal map must be embedded",
    );
    count += 14;
  }
  count += 4 + PRODUCTS[key].parts.length;
}
const html = await readFile(new URL("index.html", root), "utf8");
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (!/^(https?:|data:)/.test(match[1])) await exists(match[1]);
}
for (const file of [
  "css/fonts.css",
  "blender/textile-colour.png",
  "blender/elastic-colour.png",
  "vendor/three/addons/libs/draco/gltf/draco_decoder.wasm",
  "vendor/three/addons/libs/draco/gltf/draco_wasm_wrapper.js",
  "vendor/three/LICENSE",
  "assets/fonts/manrope-OFL.txt",
  "assets/fonts/cormorantgaramond-OFL.txt",
])
  await exists(file);
const fonts = await readFile(new URL("css/fonts.css", root), "utf8");
assert(
  !fonts.includes("https://"),
  "Fonts must load without a third-party connection",
);
for (const match of fonts.matchAll(/url\(([^)]+)\)/g))
  await access(new URL(match[1], new URL("css/", root)));
for (const file of await readdir(new URL("js/", root))) {
  const check = spawnSync(
    process.execPath,
    ["--check", fileURLToPath(new URL(`js/${file}`, root))],
    { encoding: "utf8" },
  );
  assert.equal(check.status, 0, check.stderr);
  count++;
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, "Duplicate HTML IDs");
for (const match of html.matchAll(/href="#([^"]+)"/g))
  assert(ids.includes(match[1]), `Broken page anchor: ${match[1]}`);
console.log(
  `PASS: ${count} asset/model/script checks, local font references, unique IDs and navigation anchors.`,
);
