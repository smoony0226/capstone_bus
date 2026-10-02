import * as THREE from "three";
import { dimensions as d, axlePositions, appearance as a } from "./data.js";

export function createDimensionLines(scene, labelRoot) {
  const groups = {
    overall: new THREE.Group(),
    axles: new THREE.Group(),
    sensors: new THREE.Group(),
  };
  Object.values(groups).forEach((group) => scene.add(group));
  const labels = [];
  const material = {
    overall: new THREE.LineBasicMaterial({ color: 0x829a65 }),
    axles: new THREE.LineBasicMaterial({ color: 0xb2956c }),
    sensors: new THREE.LineBasicMaterial({ color: 0x90a4ab }),
  };
  function line(type, points) {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      points.map((p) => new THREE.Vector3(...p)),
    );
    groups[type].add(new THREE.Line(geometry, material[type]));
  }
  function label(type, text, position) {
    const element = document.createElement("span");
    element.className = `dimension-label ${type === "axles" ? "axle" : type === "sensors" ? "sensor" : ""}`;
    element.textContent = text;
    labelRoot.appendChild(element);
    labels.push({ element, position: new THREE.Vector3(...position), type });
  }
  function dimension(
    type,
    text,
    start,
    end,
    witnessStart,
    witnessEnd,
    labelPosition,
    tick,
  ) {
    line(type, [start, end]);
    line(type, [witnessStart, start]);
    line(type, [witnessEnd, end]);
    for (const p of [start, end])
      line(type, [p.map((v, i) => v - tick[i]), p.map((v, i) => v + tick[i])]);
    label(type, text, labelPosition);
  }
  const halfL = d.length / 2,
    halfW = d.width / 2;
  dimension(
    "overall",
    `전장 ${d.length} mm`,
    [-halfL, 5, halfW + 57],
    [halfL, 5, halfW + 57],
    [-halfL, 20, halfW],
    [halfL, 20, halfW],
    [0, 5, halfW + 73],
    [5, 0, 5],
  );
  dimension(
    "overall",
    `전폭 ${d.width} mm`,
    [halfL + 55, 5, -halfW],
    [halfL + 55, 5, halfW],
    [halfL, 20, -halfW],
    [halfL, 20, halfW],
    [halfL + 84, 5, 0],
    [5, 0, 5],
  );
  dimension(
    "overall",
    `전고 ${d.height} mm`,
    [-halfL - 52, 0, 100],
    [-halfL - 52, d.height, 100],
    [-halfL, 0, 85],
    [a.housingRearX, d.height, 80],
    [-halfL - 80, d.height / 2, 102],
    [5, 0, 5],
  );
  const { front, rear } = axlePositions();
  dimension(
    "axles",
    `휠베이스 ${d.wheelbase} mm`,
    [rear, -40, 164],
    [front, -40, 164],
    [rear, d.wheelDiameter / 2, halfW],
    [front, d.wheelDiameter / 2, halfW],
    [(rear + front) / 2, -40, 188],
    [4, 0, 5],
  );
  dimension(
    "axles",
    `앞 오버행 ${d.frontOverhang} mm`,
    [front, -90, -134],
    [halfL, -90, -134],
    [front, d.wheelDiameter / 2, -halfW],
    [halfL, 20, -halfW],
    [(front + halfL) / 2, -90, -153],
    [4, 0, 5],
  );
  dimension(
    "axles",
    `뒤 오버행 ${d.rearOverhang} mm`,
    [-halfL, -90, -134],
    [rear, -90, -134],
    [-halfL, 20, -halfW],
    [rear, d.wheelDiameter / 2, -halfW],
    [(-halfL + rear) / 2, -90, -153],
    [4, 0, 5],
  );
  dimension(
    "axles",
    `앞범퍼 → 뒷축 ${d.frontBumperToRearAxle} mm`,
    [rear, -140, -220],
    [halfL, -140, -220],
    [rear, -90, -134],
    [halfL, -90, -134],
    [(rear + halfL) / 2, -140, -240],
    [4, 0, 5],
  );
  dimension(
    "axles",
    `바퀴 Ø${d.wheelDiameter} mm`,
    [front - 55, 0, 100],
    [front - 55, d.wheelDiameter, 100],
    [front, 0, halfW],
    [front, d.wheelDiameter, halfW],
    [front - 105, 45, 110],
    [5, 0, 0],
  );
  line("sensors", [
    [halfL - 12, a.cameraHeight, 0],
    [halfL + 20, 285, 0],
  ]);
  label("sensors", "전방 OAK-1 · 위치 참고", [halfL + 20, 300, 0]);
  line("sensors", [
    [-halfL + 12, a.cameraHeight, 0],
    [-halfL + 32, 280, -30],
  ]);
  label("sensors", "후방 OAK · 위치 확인 예정", [-halfL + 32, 295, -30]);
  const projected = new THREE.Vector3();
  function update(camera, width, height, view) {
    camera.updateMatrixWorld();
    for (const item of labels) {
      projected.copy(item.position).project(camera);
      const text = item.element.textContent;
      item.element.hidden =
        !groups[item.type].visible ||
        projected.z < -1 ||
        projected.z > 1 ||
        (item.type === "overall" &&
          text.startsWith("전고") &&
          view === "top") ||
        (view === "front" && item.type === "axles") ||
        (view === "front" &&
          item.type === "overall" &&
          text.startsWith("전장"));
      if (!item.element.hidden) {
        item.element.style.left = `${((projected.x + 1) * width) / 2}px`;
        item.element.style.top = `${((-projected.y + 1) * height) / 2}px`;
      }
    }
  }
  return { groups, update };
}
