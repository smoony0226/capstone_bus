import {
  dimensions,
  measurements,
  sensors,
  references,
  validateDimensions,
} from "./data.js";
import { batteryMotion } from "./battery-motion.js";

const $ = (selector) => document.querySelector(selector);
const base = import.meta.env.BASE_URL;

function renderDetails() {
  $("#metrics").innerHTML = measurements
    .map(
      ([key, label]) =>
        `<span>${label}<strong>${dimensions[key]} mm</strong></span>`,
    )
    .join("");
  $("#dimension-table").innerHTML = measurements
    .map(
      ([key, label]) =>
        `<tr><td>${label}</td><td>${dimensions[key]}<small>mm</small></td></tr>`,
    )
    .join("");
  $("#sensor-list").innerHTML = sensors
    .map(
      (sensor) =>
        `<div class="sensor-row"><span class="sensor-index">${sensor.id}</span><div><div class="sensor-heading"><h3>${sensor.name}</h3><span>${sensor.model}</span></div><p>${sensor.description}</p><small>${sensor.spec}</small></div></div>`,
    )
    .join("");
  $("#reference-gallery").innerHTML = references
    .map(
      (ref, i) =>
        `<button class="photo-button" data-photo="${i}" aria-label="${ref.label} 사진 확대"><img src="${base}references/${ref.file}" alt="BUS1 ${ref.label}" loading="lazy"><span>${ref.label} ↗</span></button>`,
    )
    .join("");
  document.querySelectorAll("[data-photo]").forEach((button) =>
    button.addEventListener("click", () => {
      const ref = references[Number(button.dataset.photo)];
      $("#photo-full").src = `${base}references/${ref.file}`;
      $("#photo-full").alt = `BUS1 ${ref.label}`;
      $("#photo-caption").textContent = ref.label;
      $("#photo-dialog").showModal();
    }),
  );
  $("#close-photo").addEventListener("click", () => $("#photo-dialog").close());
  $("#photo-dialog").addEventListener("click", (event) => {
    if (event.target === $("#photo-dialog")) $("#photo-dialog").close();
  });
}

function setPressed(selector, attribute, value) {
  document
    .querySelectorAll(selector)
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset[attribute] === value),
      ),
    );
}

async function startViewer() {
  const [
    THREE,
    { OrbitControls },
    { buildBus, setBatteryOpening, setBatteryRemoval },
    { createDimensionLines },
  ] = await Promise.all([
    import("three"),
    import("three/addons/controls/OrbitControls.js"),
    import("./model.js"),
    import("./dimension-lines.js"),
  ]);
  validateDimensions(dimensions);
  const stage = $("#stage"),
    canvas = $("#canvas");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xf7fff0, 0x768365, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.position.set(220, 850, 500);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -700,
    right: 700,
    top: 700,
    bottom: -700,
    far: 1800,
  });
  sun.shadow.bias = -0.001;
  sun.shadow.normalBias = 2;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xecf7db, 1);
  fill.position.set(-500, 400, -300);
  scene.add(fill);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2800, 2400),
    new THREE.ShadowMaterial({ opacity: 0.13, depthWrite: false }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.8;
  ground.receiveShadow = true;
  scene.add(ground);
  const grid = new THREE.GridHelper(2000, 40, 0xcdd8bf, 0xdfe5d7);
  grid.position.y = -1;
  grid.material.transparent = true;
  grid.material.opacity = 0.38;
  scene.add(grid);
  const bus = buildBus();
  scene.add(bus.root);
  const lines = createDimensionLines(scene, $("#labels"));
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  function updateSceneTheme() {
    grid.material.color.set(scheme.matches ? 0x536078 : 0xb9c4d0);
    lines.groups.overall.children.forEach((line) =>
      line.material.color.set(scheme.matches ? 0x75adf0 : 0x2563a9),
    );
    lines.groups.axles.children.forEach((line) =>
      line.material.color.set(scheme.matches ? 0xf3c75f : 0xa56b00),
    );
  }
  scheme.addEventListener("change", updateSceneTheme);
  updateSceneTheme();
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 10000),
    perspective = new THREE.PerspectiveCamera(35, 1, 1, 10000);
  let camera = ortho;
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.minDistance = 350;
  controls.maxDistance = 3200;
  controls.minZoom = 0.5;
  controls.maxZoom = 4;
  controls.maxPolarAngle = Math.PI * 0.4999;
  controls.target.set(0, 95, 0);
  const state = {
    view: "iso",
    measure: "overall",
    dimensions: true,
    sensors: true,
    opening: 0,
    removal: 0,
  };
  const views = {
    iso: [900, 700, 1100],
    perspective: [1150, 650, 1250],
    front: [1600, 95, 0],
    side: [0, 95, 1600],
    top: [0, 1800, 0.001],
  };
  function resize() {
    const { width, height } = stage.getBoundingClientRect(),
      aspect = width / height;
    renderer.setSize(width, height, false);
    perspective.aspect = aspect;
    perspective.updateProjectionMatrix();
    const halfHeight = Math.max(340, 630 / aspect);
    ortho.left = -halfHeight * aspect;
    ortho.right = halfHeight * aspect;
    ortho.top = halfHeight;
    ortho.bottom = -halfHeight;
    ortho.updateProjectionMatrix();
  }
  function updateVisibility() {
    lines.groups.overall.visible =
      state.dimensions && state.measure === "overall";
    lines.groups.axles.visible = state.dimensions && state.measure === "axles";
    lines.groups.sensors.visible = state.sensors;
    bus.cameras.visible = state.sensors;
  }
  function setView(view) {
    state.view = view;
    camera = view === "perspective" ? perspective : ortho;
    controls.object = camera;
    camera.up.set(0, 1, 0);
    camera.position.set(...views[view]);
    controls.target.set(0, 95, 0);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    controls.update();
    setPressed("[data-view]", "view", view);
    $("#view-name").textContent = {
      iso: "ISOMETRIC",
      perspective: "PERSPECTIVE",
      front: "FRONT",
      side: "SIDE",
      top: "TOP",
    }[view];
  }
  let displayedOpening = 0;
  function removal(value) {
    state.removal = value;
    $("#battery-remove").setAttribute("aria-pressed", String(value > 0));
    $("#battery-remove").textContent =
      value > 0 ? "배터리 장착 ↓" : "배터리 탈거 ↑";
  }
  function opening(value) {
    state.opening = Math.max(0, Math.min(100, value));
    $("#opening").value = String(state.opening);
    $("#opening-value").value = `${state.opening}%`;
    $("#battery-toggle").setAttribute(
      "aria-pressed",
      String(state.opening > 0),
    );
    $("#battery-toggle").textContent =
      state.opening > 0 ? "배터리함 닫기" : "배터리함 열기";
    if (state.opening < 100) removal(0);
  }
  document
    .querySelectorAll("[data-view]")
    .forEach((button) =>
      button.addEventListener("click", () => setView(button.dataset.view)),
    );
  document.querySelectorAll("[data-measure]").forEach((button) =>
    button.addEventListener("click", () => {
      state.measure = button.dataset.measure;
      setPressed("[data-measure]", "measure", state.measure);
      updateVisibility();
    }),
  );
  $("#dimensions").addEventListener("change", (event) => {
    state.dimensions = event.target.checked;
    updateVisibility();
  });
  $("#sensors").addEventListener("change", (event) => {
    state.sensors = event.target.checked;
    updateVisibility();
  });
  $("#opening").addEventListener("input", (event) =>
    opening(Number(event.target.value)),
  );
  $("#battery-toggle").addEventListener("click", () =>
    opening(state.opening > 0 ? 0 : 100),
  );
  $("#battery-remove").addEventListener("click", () => {
    if (state.removal === 0) {
      opening(100);
      removal(1);
    } else removal(0);
  });
  $("#battery-focus").addEventListener("click", () => {
    setView("iso");
    camera.position.set(720, 730, 740);
    controls.target.set(45, 205, 0);
    camera.zoom = 1.6;
    camera.updateProjectionMatrix();
    controls.update();
    opening(100);
    state.dimensions = false;
    $("#dimensions").checked = false;
    updateVisibility();
    $("#view-name").textContent = "BATTERY BAY";
  });
  $("#reset").addEventListener("click", () => {
    state.measure = "overall";
    state.dimensions = true;
    state.sensors = true;
    $("#dimensions").checked = true;
    $("#sensors").checked = true;
    setPressed("[data-measure]", "measure", "overall");
    opening(0);
    removal(0);
    updateVisibility();
    setView("iso");
  });
  controls.addEventListener("start", () => {
    state.view = "custom";
    setPressed("[data-view]", "view", "custom");
    $("#view-name").textContent = "FREE ORBIT";
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    const status = $("#load-status");
    status.hidden = false;
    status.textContent =
      "3D 표시가 중단됐습니다. 페이지를 새로고침해 주세요. 아래 실측 표는 계속 확인할 수 있습니다.";
  });
  new ResizeObserver(resize).observe(stage);
  resize();
  setView("iso");
  updateVisibility();
  $("#load-status").hidden = true;
  canvas.dataset.ready = "true";
  let lastFrame = performance.now();
  renderer.setAnimationLoop((now) => {
    const dt = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    const target = state.opening / 100;
    const delta = target - displayedOpening;
    displayedOpening += Math.sign(delta) * Math.min(Math.abs(delta), dt / 1.5);
    setBatteryOpening(bus.battery, displayedOpening);
    setBatteryRemoval(
      bus.battery,
      displayedOpening >= 0.999 ? state.removal : 0,
    );
    const phase = batteryMotion(displayedOpening).phase;
    canvas.dataset.batteryPhase = phase;
    canvas.dataset.batteryProgress = String(Math.round(displayedOpening * 100));
    canvas.dataset.packRemoved = String(
      displayedOpening >= 0.999 && state.removal > 0,
    );
    $("#battery-status").textContent = {
      closed: "배터리 하우징 닫힘",
      sliding: "1단계 · 앞쪽으로 슬라이드",
      folding: "2단계 · 뒤쪽으로 젖히기",
      open: "앞쪽 슬라이드 → 뒤로 젖힘 완료",
    }[phase];
    controls.update();
    renderer.render(scene, camera);
    lines.update(camera, stage.clientWidth, stage.clientHeight, state.view);
  });
}

renderDetails();
startViewer().catch((error) => {
  console.error(error);
  $("#load-status").hidden = false;
  $("#load-status").textContent =
    "3D 모델을 표시하지 못했습니다. WebGL을 지원하는 브라우저에서 새로고침해 주세요. 아래 실측 표와 사진은 계속 확인할 수 있습니다.";
  document
    .querySelectorAll(
      ".viewer-toolbar button,.viewer-settings button,.viewer-settings input,.battery-control button,.battery-control input",
    )
    .forEach((control) => (control.disabled = true));
});
