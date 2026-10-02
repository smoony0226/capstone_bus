# GitHub Pages 공개 배포 검증

2026-10-03 사용자 요청으로 `smoony0226/capstone_bus`를 공개 전환했다.
빌드 결과 `gh-pages` 브랜치1efaf39를 GitHub Pages의 루트 원천으로 지정했다.
유료 플랜 변경이나 결제는 수행하지 않았다.

## 확인

- 저장소 API `private=false`, Pages `public=true`, `https_enforced=true` 확인.
- [Pages 배포 실행](https://github.com/smoony0226/capstone_bus/actions/runs/37059752680):
  build30초, deploy8초, 전체 성공.
- 공개 주소 https://smoony0226.github.io/capstone_bus/ HTTP200 확인.
- Playwright1.56.1 / Chromium141 / SwiftShader로 실제 공개 주소에 접속했다.

```bash
VIEWER_URL=https://smoony0226.github.io/capstone_bus/ SKIP_MODEL_CHECK=1 npm run test:browser
```

결과 PASS: WebGL 초기화, 시점5개, 치수·카메라 토글, 하우징 슬라이드/후방 젖힘,
개방 완료 후 팩 탈거·복귀·초기화, 사진5장·확대, 모바일390px 넘침 없음,
밝은/어두운 테마, WebGL 실패 시 표 유지·오류 안내. 일반 화면 console/pageerror0.

## 경계

실제 공개 서비스의 자산 경로·렌더링·UI를 확인했다. 소스 모듈을 직접 불러오는 메쉬 기하 검사는
개발 서버에서 앞서 수행했으므로 이번 공개 주소 시험에서는 생략했다.
실제 macOS Safari 및 하드웨어 센서·배터리 기구 실물 시험은 수행하지 않았다.
README의 `뷰어 실행` 링크와 저장소 홈페이지에 동일한 공개 주소를 등록했다.
