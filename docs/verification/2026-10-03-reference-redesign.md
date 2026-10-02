# 레퍼런스 디자인·배터리 기구 수정 검증

환경: 기존 [초기 검증 환경](2026-10-03-viewer.md)과 동일. Node22·Chromium141·SwiftShader.

## 실행과 결과

- `npm test`: 치수 계약2개, 2단계 기구·역순 복귀2개, 총4/4 PASS.
- `npm run build`: PASS. 기존 Three.js 청크 크기 경고는 유지된다.
- `npm run test:browser`: 5개 시점, 레이어, 사진5장, 모바일390px 가로 넘침 없음,
  WebGL 실패 안내, 밝은/어두운 테마 전환 PASS.
- 실제 메시 경계 940×180×230mm, 지면 minY0 확인.
- 개방20%: 앞쪽 x 이동>0, 회전0. 개방35% 이후 x 이동량 고정.
  개방100%: positive z 회전>90도, 하우징이 차량 뒤 방향으로 젖혀짐 확인.
- 팩 표시 탈거는 하우징 개방 완료 뒤에만 적용. 닫기·초기화로 장착 위치 복귀.
- 프로덕션 preview(4173)에서도 `SKIP_MODEL_CHECK=1` 브라우저 회귀 PASS.
  소스 접근이 필요한 실제 메시 검사만 개발 서버에서 별도로 수행했다.
- 레퍼런스 소스의 실제 레이아웃·색·버튼·화면 비율을 대조해 재작성했다.

## 화면

- [밝은 화면](screenshots/desktop.png), [어두운 화면](screenshots/desktop-dark.png)
- [모바일](screenshots/mobile.png)
- [앞쪽 슬라이드](screenshots/battery-slide.png), [뒤로 젖히는 중](screenshots/battery-fold.png)
- [배터리 탈거](screenshots/battery.png)

## 한계

기구 순서는 사용자 설명에 근거한다. 슬라이드 거리·젖힘 각도·피벗과 상세 기구는 실측 전이다.
모형을 통한 탈착 개념 표현이며 실제 링크 간섭·구동 시간·기구 치수 검증이 아니다.
실제 Safari/휴대폰 실행은 하지 않았다. GitHub Pages 공개 URL은 비공개 저장소 요금제 제약으로 미검증이다.
