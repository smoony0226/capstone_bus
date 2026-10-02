// Unit: millimetres. Supplied by the user on 2026-10-03.
// Datum: front bumper x=+length/2; y=0 is ground; z is lateral.
export const dimensions = Object.freeze({
  length: 940,
  width: 180,
  height: 230,
  wheelbase: 410,
  frontBumperToRearAxle: 600,
  frontOverhang: 190,
  rearOverhang: 340,
  wheelDiameter: 83,
  wheelCircumference: 260.8,
});

export function axlePositions(d = dimensions) {
  return {
    front: d.length / 2 - d.frontOverhang,
    rear: d.length / 2 - d.frontBumperToRearAxle,
  };
}

export function validateDimensions(d) {
  if (Object.values(d).some((value) => !Number.isFinite(value) || value <= 0))
    throw new Error("치수는 양의 유한수여야 합니다.");
  if (d.frontOverhang + d.wheelbase + d.rearOverhang !== d.length)
    throw new Error("전장과 축 간 거리의 합이 일치하지 않습니다.");
  if (d.frontBumperToRearAxle !== d.frontOverhang + d.wheelbase)
    throw new Error("뒷축 기준 거리가 일치하지 않습니다.");
  if (Math.abs(Math.PI * d.wheelDiameter - d.wheelCircumference) > 0.1)
    throw new Error("바퀴 지름과 둘레가 일치하지 않습니다.");
}

export const measurements = [
  ["length", "길이", "940"],
  ["width", "폭", "180"],
  ["height", "높이", "230"],
  ["wheelbase", "휠베이스 (앞축 → 뒷축)", "410"],
  ["frontBumperToRearAxle", "앞범퍼 → 뒷바퀴 축", "600"],
  ["frontOverhang", "앞범퍼 → 앞바퀴 축", "190"],
  ["rearOverhang", "뒷바퀴 축 → 뒤 끝", "340"],
  ["wheelDiameter", "바퀴 지름", "83"],
  ["wheelCircumference", "바퀴 둘레", "260.8"],
];

export const sensors = [
  {
    id: "01",
    name: "전방 카메라",
    model: "OAK-1 · RGB",
    description:
      "전방 차선과 장애물 인식. 사진의 전면 유리 중앙 장착 형태를 참고했습니다.",
    spec: "BUS1 설정: 640 × 480 · 30 Hz",
  },
  {
    id: "02",
    name: "후방 카메라",
    model: "OAK 계열",
    description:
      "후진 주차선 인식. 후방의 정확한 장착 위치와 모델명은 확인 예정입니다.",
    spec: "BUS1 설정: 640 × 480 · 30 Hz",
  },
  {
    id: "03",
    name: "IMU",
    model: "9축 관성 센서",
    description:
      "차체 회전각과 yaw 계측. 내부 장착 센서로 외장 모델에는 노출하지 않습니다.",
    spec: "BUS1 설정: UART 115,200 baud · 50 Hz 폴링",
  },
  {
    id: "04",
    name: "구동축 엔코더",
    model: "모터축 · 단채널",
    description:
      "펄스 누적으로 주행거리·회전수를 계측합니다. 바퀴에 직접 장착하는 엔코더가 아닙니다.",
    spec: "BUS1 펌웨어: 100 PPR · 텔레메트리 10 Hz",
  },
];

// Photo-based display estimates. These are NOT verified measurements.
// No dimension lines are drawn for these values until measured.
export const appearance = Object.freeze({
  roofHeight: 205,
  bodyBottom: 19,
  sideGreenHeight: 78,
  bayRearX: 135,
  bayFrontX: 350,
  bayWidth: 146,
  bayFloorY: 181,
  housingRearX: -75,
  housingFrontX: 135,
  hoodSlideDistance: 70,
  hoodFoldAngle: 120,
  cameraHeight: 170,
});

export const references = [
  { file: "bus-side.jpg", label: "측면 · 차체와 바퀴", original: "image.png" },
  {
    file: "bus-front.jpg",
    label: "전면 · 카메라와 지붕",
    original: "image (1).png",
  },
  {
    file: "bus-roof-1.jpg",
    label: "상단 · 배터리 교환부 ①",
    original: "image (2).png",
  },
  {
    file: "bus-roof-2.jpg",
    label: "상단 · 배터리 교환부 ②",
    original: "image (3).png",
  },
  {
    file: "bus-roof-3.jpg",
    label: "상단 · 배터리 교환부 ③",
    original: "image (4).png",
  },
];
