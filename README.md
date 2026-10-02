# CAPSTONE BUS

TEAM RACER의 BUS1을 기준으로 만든 브라우저용 3D 치수 뷰어입니다.
전장 940 mm, 전폭 180 mm, 전고 230 mm, 축거 410 mm를 기준으로 외형과 축 위치를 확인합니다.

저장소: [smoony0226/capstone_bus](https://github.com/smoony0226/capstone_bus) (비공개).

## 실행

```bash
npm ci
npm run dev
```

브라우저에서 `http://localhost:5173`을 엽니다. 다른 기기에서는 이 PC의 IP와 포트 5173을 사용합니다.

```bash
npm test
npm run build
npm run preview
```

`dist/`는 정적 호스팅에 올릴 수 있는 결과물입니다. 상대 경로로 빌드하므로 GitHub Pages의 `/capstone_bus/`에서도 동작합니다. 공개 배포는 아직 하지 않았습니다.

브라우저 회귀 시험은 `npx playwright install chromium` 후 개발 서버를 실행한 상태에서
`npm run test:browser`로 수행합니다. 결과 캡처와 검증 경계는 `docs/verification/`에 있습니다.

## 사용

- 아이소메트릭 / 원근 / 전면 / 측면 / 상단 시점, 드래그 회전, 휠·핀치 확대, 우클릭 이동.
- 외형 치수와 축·바퀴 치수 전환, 치수선·카메라 표시 토글.
- 배터리 덮개 열기, 개방 슬라이더, 배터리 탈거·장착, 교환부 확대.
- 하단 실측 표, 실제 센서 구성, PIDNet·YOLO / Jetson / UART / ESP 제어 흐름, 실물 사진 5장.

## 자료와 구조

- `src/data.js`: 사용자 제공 실측값, 센서 설명, 사진 기반 형상 가정. 축 위치는 앞범퍼 기준으로 계산합니다.
- `src/model.js`: Three.js 외장 모델과 간단한 교환부 모델. 덮개·배터리만 움직입니다.
- `src/dimension-lines.js`: 3D 치수선과 읽기 쉬운 화면상의 라벨.
- `src/app.js`: UI 상태, 카메라, 렌더링, 조작. ROS·차량과 연결하지 않습니다.
- `public/references/`: 제공 사진을 웹 크기로 축소한 사본. 원본은 변경하지 않았습니다.

센서는 현재 `racer_ws`의 BUS1 설정과 사용자 설명을 기준으로 전·후방 OAK, IMU, 모터축 엔코더를 설명합니다. 초음파는 과거 계획서의 장착 예정 항목이라 실제 장착 센서로 넣지 않았습니다. 배터리함 세부 치수·개폐각과 후방 카메라 위치는 참고 표현입니다. 지붕 덮개 개폐와 팩 탈거는 이해를 위한 단순 모델이며 실물 기구의 정확한 재현은 아닙니다.

UI 기능 참고: [LSC18/fma-t870-viewer](https://github.com/LSC18/fma-t870-viewer). 모델·UI 코드는 새로 작성했으며 참고 저장소 코드를 복사하지 않았습니다.
