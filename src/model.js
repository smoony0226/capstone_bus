import * as THREE from "three";
import { dimensions as d, appearance as a, axlePositions } from "./data.js";

const paint = new THREE.MeshStandardMaterial({
  color: 0x49bf08,
  roughness: 0.38,
  metalness: 0.08,
});
const glass = new THREE.MeshStandardMaterial({
  color: 0x152720,
  roughness: 0.22,
  metalness: 0.26,
});
const rubber = new THREE.MeshStandardMaterial({
  color: 0x202422,
  roughness: 0.9,
});
const trim = new THREE.MeshStandardMaterial({
  color: 0x323b36,
  roughness: 0.55,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
});
const chrome = new THREE.MeshStandardMaterial({
  color: 0xc9d0cc,
  roughness: 0.23,
  metalness: 0.25,
  polygonOffset: true,
  polygonOffsetFactor: -5,
  polygonOffsetUnits: -5,
});
const black = new THREE.MeshStandardMaterial({
  color: 0x141a16,
  roughness: 0.68,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2,
});
const doorGlass = glass.clone();
doorGlass.polygonOffset = true;
doorGlass.polygonOffsetFactor = -4;
doorGlass.polygonOffsetUnits = -4;
const lamp = new THREE.MeshStandardMaterial({
  color: 0xe5eed8,
  roughness: 0.2,
  metalness: 0.3,
});
const rearLamp = new THREE.MeshStandardMaterial({
  color: 0xad3632,
  roughness: 0.4,
});

function box(parent, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, radius, length, position, material) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 40),
    material,
  );
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(...position);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function sidePanel(parent, z) {
  const { front, rear } = axlePositions();
  const radius = d.wheelDiameter / 2 + 3,
    wheelY = d.wheelDiameter / 2;
  const dx = Math.sqrt(radius ** 2 - (a.bodyBottom - wheelY) ** 2);
  const shape = new THREE.Shape();
  shape.moveTo(-d.length / 2, a.bodyBottom);
  for (const axle of [rear, front]) {
    shape.lineTo(axle - dx, a.bodyBottom);
    const start = Math.atan2(a.bodyBottom - wheelY, -dx);
    const end = Math.atan2(a.bodyBottom - wheelY, dx) - 2 * Math.PI;
    for (let i = 1; i <= 40; i++) {
      const angle = start + ((end - start) * i) / 40;
      shape.lineTo(
        axle + radius * Math.cos(angle),
        wheelY + radius * Math.sin(angle),
      );
    }
  }
  shape.lineTo(d.length / 2, a.bodyBottom);
  shape.lineTo(d.length / 2, a.sideGreenHeight);
  shape.lineTo(-d.length / 2, a.sideGreenHeight);
  shape.closePath();
  const panel = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: false }),
    paint,
  );
  panel.position.z = z;
  panel.castShadow = true;
  parent.add(panel);
}

function roofWordmark(parent) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.font = "italic 100px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("begins", 440, 175);
  ctx.font = "38px sans-serif";
  ctx.fillText("배터리교체형 전기버스", 515, 258);
  ctx.fillRect(715, 62, 80, 128);
  ctx.beginPath();
  ctx.arc(811, 149, 48, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(280, 100),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(-260, a.roofHeight + 0.2, 0);
  parent.add(mesh);
}

function addCamera(parent, x, facing) {
  const camera = new THREE.Group();
  camera.position.set(x, a.cameraHeight, 0);
  parent.add(camera);
  box(camera, [9, 28, 21], [0, 0, 0], black);
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(5.5, 5.5, 3, 24),
    glass,
  );
  lens.rotation.z = Math.PI / 2;
  lens.position.x = facing * 5;
  camera.add(lens);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(6, 1, 8, 24), chrome);
  rim.rotation.y = Math.PI / 2;
  rim.position.x = facing * 6.6;
  camera.add(rim);
  box(camera, [4, 19, 6], [-facing * 7, -23, 0], chrome);
}

function buildBattery(parent) {
  const group = new THREE.Group();
  parent.add(group);
  const length = a.bayFrontX - a.bayRearX,
    centre = (a.bayFrontX + a.bayRearX) / 2;
  box(group, [length, 5, a.bayWidth], [centre, a.bayFloorY, 0], black);
  for (const z of [-1, 1])
    box(
      group,
      [length, 17, 4],
      [centre, a.bayFloorY + 10, z * (a.bayWidth / 2 - 2)],
      trim,
    );
  for (const x of [a.bayRearX + 3, a.bayFrontX - 3])
    box(group, [5, 22, a.bayWidth], [x, a.bayFloorY + 12, 0], trim);
  const pack = new THREE.Group();
  pack.position.set(centre, a.bayFloorY + 12, 0);
  group.add(pack);
  box(pack, [length - 30, 16, a.bayWidth - 24], [0, 0, 0], trim);
  for (const z of [-1, 1])
    box(pack, [length - 53, 4, 5], [0, 10, z * 45], chrome);
  box(
    pack,
    [34, 1, 34],
    [0, 8.6, 0],
    new THREE.MeshStandardMaterial({ color: 0xf0f3e8 }),
  );
  box(pack, [24, 1.2, 24], [0, 9.2, 0], black);
  const lid = new THREE.Group();
  lid.position.set(a.bayFrontX, a.roofHeight, 0);
  group.add(lid);
  box(lid, [length, 5, a.bayWidth + 8], [-length / 2, -2.5, 0], paint);
  for (const z of [-1, 1])
    box(
      lid,
      [length, 9, 3],
      [-length / 2, -7, z * (a.bayWidth / 2 + 2)],
      paint,
    );
  for (const z of [-50, 50])
    cylinder(group, 3, 17, [a.bayFrontX, a.roofHeight - 3, z], chrome);
  return { lid, pack, packRestY: pack.position.y };
}

export function buildBus() {
  const root = new THREE.Group();
  root.name = "BUS1";
  const { front, rear } = axlePositions();
  box(root, [d.length - 16, 12, d.width - 23], [0, 25, 0], trim);
  sidePanel(root, -d.width / 2);
  sidePanel(root, d.width / 2 - 3);
  for (const z of [-1, 1]) {
    box(
      root,
      [d.length - 14, a.roofHeight - a.sideGreenHeight - 8, 3],
      [0, (a.sideGreenHeight + a.roofHeight - 8) / 2, z * (d.width / 2 - 1.5)],
      glass,
    );
    box(
      root,
      [d.length, 8, 5],
      [0, a.roofHeight - 4, z * (d.width / 2 - 2.5)],
      paint,
    );
    for (const x of [-420, -310, -180, -40, 100, 220, 350, 455])
      box(root, [5, 119, 4], [x, 137, z * (d.width / 2 - 2)], trim);
    box(root, [d.length, 4, 4], [0, 81, z * (d.width / 2 - 2)], trim);
  }
  for (const [x, width] of [
    [18, 112],
    [383, 91],
  ]) {
    box(root, [width, 169, 3], [x, 104, d.width / 2 - 1.5], black);
    box(root, [width - 8, 159, 0.8], [x, 105, d.width / 2 - 0.4], doorGlass);
    box(root, [2, 161, 0.8], [x, 105, d.width / 2 - 0.4], chrome);
    box(root, [width - 5, 2, 1], [x, 25, d.width / 2 - 0.5], chrome);
  }
  for (const sign of [-1, 1]) {
    const x = sign * (d.length / 2 - 3);
    box(root, [6, 58, d.width - 6], [x, 48, 0], paint);
    box(root, [4, 125, d.width - 9], [x, 140, 0], glass);
    box(root, [5, 9, d.width - 6], [x, 200, 0], paint);
    box(root, [5, 4, d.width - 9], [x, 20, 0], trim);
    for (const z of [-62, 62])
      box(
        root,
        [1, 9, 26],
        [sign * (d.length / 2 - 0.5), 40, z],
        sign > 0 ? lamp : rearLamp,
      );
  }
  box(root, [1, 11, 59], [d.length / 2 - 0.5, 56, 0], black);
  for (let z = -24; z <= 24; z += 8)
    box(root, [1, 8, 2], [d.length / 2 - 0.5, 24, z], black);
  for (const x of [front, rear]) {
    cylinder(root, 5, d.width - 22, [x, d.wheelDiameter / 2, 0], trim);
    for (const sign of [-1, 1]) {
      cylinder(
        root,
        d.wheelDiameter / 2,
        16,
        [x, d.wheelDiameter / 2, sign * (d.width / 2 - 8)],
        rubber,
      );
      cylinder(
        root,
        25,
        1.7,
        [x, d.wheelDiameter / 2, sign * (d.width / 2 - 0.9)],
        chrome,
      );
      cylinder(
        root,
        14,
        2,
        [x, d.wheelDiameter / 2, sign * (d.width / 2 - 1)],
        trim,
      );
      cylinder(
        root,
        9,
        2,
        [x, d.wheelDiameter / 2, sign * (d.width / 2 - 1)],
        chrome,
      );
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        cylinder(
          root,
          2.5,
          2,
          [
            x + 19 * Math.cos(angle),
            d.wheelDiameter / 2 + 19 * Math.sin(angle),
            sign * (d.width / 2 - 1),
          ],
          black,
        );
      }
    }
  }
  box(
    root,
    [a.bayRearX + d.length / 2, 5, d.width],
    [(-d.length / 2 + a.bayRearX) / 2, a.roofHeight - 2.5, 0],
    paint,
  );
  box(
    root,
    [d.length / 2 - a.bayFrontX, 5, d.width],
    [(d.length / 2 + a.bayFrontX) / 2, a.roofHeight - 2.5, 0],
    paint,
  );
  for (const sign of [-1, 1])
    box(
      root,
      [a.bayFrontX - a.bayRearX, 5, (d.width - a.bayWidth) / 2],
      [
        (a.bayRearX + a.bayFrontX) / 2,
        a.roofHeight - 2.5,
        (sign * (d.width + a.bayWidth)) / 4,
      ],
      paint,
    );
  box(
    root,
    [a.housingFrontX - a.housingRearX, d.height - a.roofHeight, d.width - 12],
    [(a.housingFrontX + a.housingRearX) / 2, (d.height + a.roofHeight) / 2, 0],
    paint,
  );
  roofWordmark(root);
  const cameras = new THREE.Group();
  root.add(cameras);
  addCamera(cameras, d.length / 2 - 12, 1);
  addCamera(cameras, -d.length / 2 + 12, -1);
  const battery = buildBattery(root);
  return { root, cameras, battery };
}

export function setBatteryOpening(battery, fraction) {
  battery.lid.rotation.z = ((-a.lidOpenAngle * Math.PI) / 180) * fraction;
}

export function setBatteryRemoval(battery, fraction) {
  battery.pack.position.y = battery.packRestY + 125 * fraction;
}
