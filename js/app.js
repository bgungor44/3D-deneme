import { COLORS, PRODUCTS } from "./products.js";
import "./entrance.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let selectedProduct = "bra";
let selectedColor = COLORS[0];
let studio;
let loadVersion = 0;
let viewerPromise;
let assemblyMode = "whole";
let inspectedPart = "cup";
function applyAssembly() {
  studio?.setAssembly(
    assemblyMode,
    inspectedPart,
    Number($("#separation").value) / 100,
  );
  $$("[data-assembly]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.assembly === assemblyMode)),
  );
  $("#separation-control").hidden = assemblyMode !== "exploded";
  $("#back-view").setAttribute(
    "aria-pressed",
    String(assemblyMode === "isolated" && inspectedPart === "hook"),
  );
  $("#rotate").setAttribute("aria-pressed", "false");
  $("#rotate").setAttribute("aria-label", "Otomatik döndürmeyi başlat");
  const title = $("#part-select").selectedOptions[0]?.textContent;
  $("#assembly-status").textContent =
    assemblyMode === "isolated"
      ? `${title} · Döndür, yakından incele.`
      : assemblyMode === "exploded"
        ? "Parçalar birbirinden ayrıldı. Ayrılma miktarını değiştirebilirsin."
        : "Bir bütünün içindeki ince detaylar.";
}
PRODUCTS.bra.parts.forEach((part) => {
  const option = document.createElement("option");
  option.value = part.id;
  option.textContent = part.title;
  $("#part-select").append(option);
});
for (const [id, title] of [["cup_L", "Sol kap ve astar"], ["cup_R", "Sağ kap ve astar"], ["strap_L", "Sol askı ve toka"], ["strap_R", "Sağ askı ve toka"], ["wing_L", "Sol yan kanat"], ["wing_R", "Sağ yan kanat"]]) {
  const option = document.createElement("option");
  option.value = id;
  option.textContent = title;
  $("#part-select").append(option);
}
$$("[data-assembly]").forEach((button) =>
  button.addEventListener("click", () => {
    assemblyMode = button.dataset.assembly;
    applyAssembly();
  }),
);
$("#separation").addEventListener("input", applyAssembly);
$("#part-select").addEventListener("change", () => {
  inspectedPart = $("#part-select").value;
  assemblyMode = "isolated";
  applyAssembly();
});
$("#back-view").addEventListener("click", () => {
  const back = $("#back-view").getAttribute("aria-pressed") !== "true";
  $("#back-view").setAttribute("aria-pressed", String(back));
  studio?.backView(back);
});

function setDetails(open) {
  $("#detail-panel").hidden = !open;
  $("#hotspots").hidden = !open;
  $("#detail-toggle").setAttribute("aria-expanded", String(open));
  $("#detail-toggle").innerHTML = open
    ? "Detayları gizle <span>−</span>"
    : "Detayları göster <span>＋</span>";
  studio?.invalidate();
}

function renderParts() {
  const list = $("#part-list");
  list.replaceChildren();
  PRODUCTS[selectedProduct].parts.forEach((part, index) => {
    const item = document.createElement("details");
    item.className = "part";
    item.dataset.part = part.id;
    const summary = document.createElement("summary");
    const number = document.createElement("span");
    number.textContent = String(index + 1).padStart(2, "0");
    summary.append(number, part.title);
    const detail = document.createElement("p");
    detail.textContent = part.detail;
    item.append(summary, detail);
    if (selectedProduct === "bra") {
      const isolate = document.createElement("button");
      isolate.className = "part-isolate";
      isolate.textContent = "Yalnızca bu parçayı göster ↗";
      isolate.addEventListener("click", () => {
        inspectedPart = part.id;
        $("#part-select").value = part.id;
        assemblyMode = "isolated";
        applyAssembly();
        setDetails(false);
      });
      item.append(isolate);
    }
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      for (const other of list.children) if (other !== item) other.open = false;
      studio?.focusPart(part.id);
    });
    list.append(item);
  });
}

function selectPart(id) {
  setDetails(true);
  const item = $(`[data-part="${id}"]`);
  if (item) {
    item.open = true;
    item.querySelector("summary").focus({ preventScroll: true });
    item.scrollIntoView({ block: "nearest", behavior: "instant" });
  }
}

COLORS.forEach((color, index) => {
  const button = document.createElement("button");
  button.className = "swatch";
  button.style.setProperty("--swatch", color.hex);
  button.setAttribute("aria-label", color.name);
  button.setAttribute("aria-pressed", String(index === 0));
  button.title = color.name;
  button.addEventListener("click", () => {
    selectedColor = color;
    $("#color-name").textContent = color.name;
    $$(".swatch").forEach((item) =>
      item.setAttribute("aria-pressed", String(item === button)),
    );
    studio?.setColor(color.hex);
  });
  $("#swatches").append(button);
});

async function getViewer() {
  if (!viewerPromise) {
    viewerPromise = import("./viewer.js")
      .then(({ ProductStudio }) => {
        studio = new ProductStudio(
          $("#canvas-wrap"),
          $("#hotspots"),
          selectPart,
        );
        const mood = $(".studio").dataset.mood;
        studio.setMood(mood);
        return studio;
      })
      .catch((error) => {
        viewerPromise = null;
        throw error;
      });
  }
  return viewerPromise;
}

async function selectProduct(key) {
  if (!(key in PRODUCTS)) return;
  const version = ++loadVersion;
  selectedProduct = key;
  assemblyMode = "whole";
  $("#anatomy").hidden = key !== "bra";
  $(".studio").classList.toggle("has-anatomy", key === "bra");
  $$("#anatomy button, #anatomy select, #anatomy input").forEach(
    (el) => (el.disabled = true),
  );
  $("#stage").dataset.state = "loading";
  $("#loading").hidden = false;
  $("#fallback").hidden = true;
  $("#canvas-wrap").style.visibility = "hidden";
  $("#hotspots").replaceChildren();
  $("#rotate").setAttribute("aria-pressed", "false");
  $("#rotate").setAttribute("aria-label", "Otomatik döndürmeyi başlat");
  $$(".view-tools button").forEach((button) => {
    button.disabled = true;
  });
  $$("[data-product]").forEach((button) =>
    button.setAttribute("aria-pressed", String(button.dataset.product === key)),
  );
  renderParts();
  try {
    const viewer = await getViewer();
    const model = await viewer.getModel(key);
    if (version !== loadVersion) return;
    viewer.showModel(model, key, selectedColor.hex);
    applyAssembly();
    $$("#anatomy button, #anatomy select, #anatomy input").forEach(
      (el) => (el.disabled = !model.separable),
    );
    $("#canvas-wrap").style.visibility = "visible";
    $$(".view-tools button").forEach((button) => {
      button.disabled = false;
    });
    $("#stage").dataset.state = "ready";
  } catch (error) {
    if (version !== loadVersion) return;
    console.warn("3D model could not be displayed:", error.message);
    $("#fallback img").src = PRODUCTS[key].photo;
    $("#fallback img").alt = `${PRODUCTS[key].name} stüdyo fotoğrafı`;
    $("#fallback").hidden = false;
    $("#stage").dataset.state = "fallback";
  } finally {
    if (version === loadVersion) $("#loading").hidden = true;
  }
}

$$("[data-product]").forEach((button) =>
  button.addEventListener("click", () => selectProduct(button.dataset.product)),
);
$$("[data-open-product]").forEach((button) =>
  button.addEventListener("click", () => {
    selectProduct(button.dataset.openProduct);
    $("#studyo").scrollIntoView({
      behavior: reducedMotion.matches ? "instant" : "smooth",
    });
  }),
);
$("#detail-toggle").addEventListener("click", () =>
  setDetails($("#detail-panel").hidden),
);
$("#detail-close").addEventListener("click", () => {
  setDetails(false);
  $("#detail-toggle").focus();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("#detail-panel").hidden) {
    setDetails(false);
    $("#detail-toggle").focus();
  }
});
$("#explore-details").addEventListener("click", () => {
  setDetails(true);
  $("#studyo").scrollIntoView({
    behavior: reducedMotion.matches ? "instant" : "smooth",
  });
  $("#part-list summary")?.focus({ preventScroll: true });
});
$("#zoom-in").addEventListener("click", () => studio?.zoom(1.2));
$("#zoom-out").addEventListener("click", () => studio?.zoom(1 / 1.2));
$("#reset").addEventListener("click", () => {
  assemblyMode = "whole";
  applyAssembly();
  studio?.reset();
  $("#rotate").setAttribute("aria-pressed", "false");
  $("#rotate").setAttribute("aria-label", "Otomatik döndürmeyi başlat");
});
$("#rotate").addEventListener("click", () => {
  const enabled = $("#rotate").getAttribute("aria-pressed") !== "true";
  studio?.setAutoRotate(enabled);
  $("#rotate").setAttribute("aria-pressed", String(enabled));
  $("#rotate").setAttribute(
    "aria-label",
    enabled ? "Otomatik döndürmeyi durdur" : "Otomatik döndürmeyi başlat",
  );
});
$$("[data-mood]")
  .filter((el) => el.tagName === "BUTTON")
  .forEach((button) =>
    button.addEventListener("click", () => {
      $(".studio").dataset.mood = button.dataset.mood;
      $$("button[data-mood]").forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
      studio?.setMood(button.dataset.mood);
    }),
  );
$("#retry").addEventListener("click", () => selectProduct(selectedProduct));
$("#year").textContent = new Date().getFullYear();
selectProduct(selectedProduct);
