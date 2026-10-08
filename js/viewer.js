import * as THREE from "three";
import { RoomEnvironment } from "three/addons/RoomEnvironment.js";
import { loadModel } from "./models.js";
import { PRODUCTS } from "./products.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class ProductStudio {
  constructor(container, hotspotLayer, onPart) {
    this.container = container;
    this.hotspotLayer = hotspotLayer;
    this.onPart = onPart;
    this.cache = new Map();
    this.hotspots = [];
    this.visible = true;
    this.dirty = true;
    this.autoRotate = false;
    this.yaw = this.targetYaw = -0.16;
    this.pitch = this.targetPitch = 0.02;
    this.magnification = this.targetMagnification = 1;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    const canvas = this.renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      "Ebru 3D ürün modeli. Ok tuşlarıyla döndürün, artı ve eksi ile yakınlaştırın, Home ile sıfırlayın.",
    );
    container.append(canvas);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.environment = pmrem.fromScene(room, 0.04);
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = 0.5;
    room.dispose();
    pmrem.dispose();
    this.keyLight = new THREE.DirectionalLight("#fff7e9", 2.7);
    this.keyLight.position.set(-3, 4, 5);
    this.rimLight = new THREE.DirectionalLight("#f8d4c9", 2.1);
    this.rimLight.position.set(4, 1, -3);
    this.fillLight = new THREE.DirectionalLight("#eef1ff", 1);
    this.fillLight.position.set(3, -1, 4);
    this.scene.add(
      this.keyLight,
      this.rimLight,
      this.fillLight,
      new THREE.AmbientLight("#ffffff", 0.25),
    );
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    this.reducedMotion.addEventListener("change", () => this.invalidate());
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.invalidate();
    });
    this.intersectionObserver.observe(container);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) this.invalidate();
    });
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.autoRotate = false;
      document.querySelector("#stage").dataset.state = "fallback";
      const fallback = document.querySelector("#fallback");
      fallback.querySelector("img").src =
        PRODUCTS[this.productKey || "bra"].photo;
      fallback.hidden = false;
      this.hotspotLayer.hidden = true;
      document.querySelector("#retry").onclick = () => location.reload();
    });
    this.initInput();
    this.resize();
  }

  async getModel(key) {
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        loadModel(key, this.renderer).catch((error) => {
          this.cache.delete(key);
          throw error;
        }),
      );
    }
    return this.cache.get(key);
  }

  showModel(model, key, color) {
    this.pivot.clear();
    this.model = model;
    this.productKey = key;
    this.pivot.add(model.root);
    model.setColor(color);
    this.hotspotLayer.replaceChildren();
    this.hotspots = [];
    PRODUCTS[key].parts.forEach((part, index) => {
      const anchor = model.anchors.find(
        (entry) => entry.userData.partId === part.id,
      );
      if (!anchor) return;
      const button = document.createElement("button");
      button.className = "hotspot";
      button.textContent = String(index + 1).padStart(2, "0");
      button.setAttribute("aria-label", `${index + 1}. ${part.title}`);
      button.addEventListener("click", () => this.onPart(part.id));
      this.hotspotLayer.append(button);
      this.hotspots.push({ button, anchor, id: part.id });
    });
    this.reset();
    this.yaw = this.targetYaw;
    this.pitch = this.targetPitch;
    this.magnification = 1;
    this.invalidate();
  }

  setColor(hex) {
    this.model?.setColor(hex);
    this.invalidate();
  }
  setAutoRotate(enabled) {
    this.autoRotate = enabled;
    this.invalidate();
  }
  setMood(mood) {
    const evening = mood === "evening";
    this.keyLight.color.set(evening ? "#ffd1b7" : "#fff7e9");
    this.rimLight.color.set(evening ? "#a4a0ed" : "#f8d4c9");
    this.renderer.toneMappingExposure = evening ? 0.9 : 1.05;
    this.invalidate();
  }
  zoom(factor) {
    this.targetMagnification = clamp(
      this.targetMagnification * factor,
      0.8,
      2.6,
    );
    this.invalidate();
  }
  reset() {
    this.targetYaw = -0.16;
    this.targetPitch = this.model?.pitch || 0.04;
    this.targetMagnification = 1;
    this.autoRotate = false;
    this.hotspots.forEach(({ button }) => button.classList.remove("active"));
    this.invalidate();
  }
  focusPart(id) {
    const hotspot = this.hotspots.find((entry) => entry.id === id);
    this.hotspots.forEach(({ button, id: partId }) =>
      button.classList.toggle("active", partId === id),
    );
    if (hotspot) {
      this.pivot.updateMatrixWorld(true);
      const position = hotspot.anchor.getWorldPosition(new THREE.Vector3());
      this.pivot.worldToLocal(position);
      this.targetYaw = -Math.atan2(position.x, position.z);
      this.targetPitch = clamp(Math.atan2(position.y, 3), -0.6, 0.65);
      this.targetMagnification = 1.1;
      this.autoRotate = false;
      document.querySelector("#rotate").setAttribute("aria-pressed", "false");
      document
        .querySelector("#rotate")
        .setAttribute("aria-label", "Otomatik döndürmeyi başlat");
      this.invalidate();
    }
  }

  initInput() {
    const canvas = this.renderer.domElement;
    const pointers = new Map();
    let previousX = 0,
      previousY = 0,
      pinchDistance = 0;
    const distance = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    canvas.addEventListener("pointerdown", (event) => {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      canvas.setPointerCapture(event.pointerId);
      previousX = event.clientX;
      previousY = event.clientY;
      if (pointers.size === 2) pinchDistance = distance();
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 2) {
        const nextDistance = distance();
        if (pinchDistance > 0) this.zoom(nextDistance / pinchDistance);
        pinchDistance = nextDistance;
      } else {
        this.targetYaw += ((event.clientX - previousX) / this.width) * 4.5;
        if (event.pointerType !== "touch")
          this.targetPitch = clamp(
            this.targetPitch +
              ((event.clientY - previousY) / this.height) * 2.5,
            -1.2,
            1.2,
          );
      }
      previousX = event.clientX;
      previousY = event.clientY;
      this.invalidate();
    });
    const end = (event) => {
      pointers.delete(event.pointerId);
      if (pointers.size === 1) {
        const [pointer] = pointers.values();
        previousX = pointer.x;
        previousY = pointer.y;
      }
      pinchDistance = 0;
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("lostpointercapture", end);
    canvas.addEventListener(
      "wheel",
      (event) => {
        // Preserve normal page scrolling; modified wheel zoom is intentional.
        if (!event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        this.zoom(Math.exp(-event.deltaY * 0.005));
      },
      { passive: false },
    );
    canvas.addEventListener("keydown", (event) => {
      const actions = {
        ArrowLeft: () => {
          this.targetYaw -= 0.18;
        },
        ArrowRight: () => {
          this.targetYaw += 0.18;
        },
        ArrowUp: () => {
          this.targetPitch = clamp(this.targetPitch - 0.12, -1.2, 1.2);
        },
        ArrowDown: () => {
          this.targetPitch = clamp(this.targetPitch + 0.12, -1.2, 1.2);
        },
        "+": () => this.zoom(1.2),
        "=": () => this.zoom(1.2),
        "-": () => this.zoom(1 / 1.2),
        Home: () => this.reset(),
      };
      if (actions[event.key]) {
        event.preventDefault();
        actions[event.key]();
        this.invalidate();
      }
    });
  }

  resize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    if (!this.width || !this.height) return;
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    const fit = Math.max(1, 1.15 / this.camera.aspect);
    this.camera.position.set(0, 0.35 * fit, 6.8 * fit);
    this.camera.lookAt(0, -0.05, 0);
    this.camera.updateProjectionMatrix();
    this.invalidate();
  }

  invalidate() {
    this.dirty = true;
    if (!this.framePending && this.visible && !document.hidden) {
      this.framePending = true;
      requestAnimationFrame((time) => this.frame(time));
    }
  }

  frame(time) {
    this.framePending = false;
    if (!this.visible || document.hidden) return;
    const dt = Math.min((time - (this.lastTime || time)) / 1000, 0.05);
    this.lastTime = time;
    if (this.autoRotate) this.targetYaw += dt * 0.3;
    const lerp = this.reducedMotion.matches
      ? 1
      : 1 - Math.exp(-Math.max(dt, 0.016) * 12);
    this.yaw += (this.targetYaw - this.yaw) * lerp;
    this.pitch += (this.targetPitch - this.pitch) * lerp;
    this.magnification +=
      (this.targetMagnification - this.magnification) * lerp;
    this.pivot.rotation.set(this.pitch, this.yaw, -0.035);
    this.pivot.scale.setScalar(this.magnification);
    this.renderer.render(this.scene, this.camera);
    if (!this.hotspotLayer.hidden) this.updateHotspots();
    this.dirty = false;
    const moving =
      Math.abs(this.targetYaw - this.yaw) +
        Math.abs(this.targetPitch - this.pitch) +
        Math.abs(this.targetMagnification - this.magnification) >
      0.0005;
    if (moving || this.autoRotate) this.invalidate();
  }

  updateHotspots() {
    const vector = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3();
    for (const { anchor, button } of this.hotspots) {
      anchor.getWorldPosition(vector);
      const distance = vector.distanceTo(this.camera.position);
      raycaster.set(
        this.camera.position,
        direction.copy(vector).sub(this.camera.position).normalize(),
      );
      raycaster.far = distance;
      const hit = raycaster.intersectObjects(this.model.meshes, false)[0];
      vector.project(this.camera);
      const behind =
        vector.z > 1 ||
        vector.z < -1 ||
        !!(hit && hit.distance < distance - 0.075);
      button.classList.toggle("behind", behind);
      button.tabIndex = behind ? -1 : 0;
      button.style.transform = `translate(${(vector.x * 0.5 + 0.5) * this.width}px, ${(-vector.y * 0.5 + 0.5) * this.height}px)`;
    }
  }
}
