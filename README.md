# owasp-korea-day

OWASP Korea Day 2026 Noir 기여 핸즈온 참가자용 안내 페이지입니다.
[hwaro](https://github.com/hahwul/hwaro)로 만들고 GitHub Pages로 배포합니다.

배포 주소: https://owasp-noir.github.io/owasp-korea-day/

## 로컬에서 보기

```sh
brew install hwaro
hwaro serve          # http://localhost:3000
```

## 구조

| 경로 | 내용 |
|---|---|
| `content/web.md` | 브라우저로 기여하기 (태그 룰 PR) |
| `content/report.md` | 써 보고 제보하기 (스캔 후 이슈) |
| `content/code.md` | 코드로 기여하기 (빌드, 테스트, 시크릿 탐지 룰) |
| `content/security.md` | 취약점 제보하기 (Security Advisory로 연결) |
| `templates/index.html` | 첫 화면. 3D 책상, 사건 목록, 시간표, 자주 묻는 것 |
| `templates/page.html` | 가이드 네 편이 쓰는 틀. 펼친 폴더(왼쪽에 사진과 목차, 오른쪽에 본문)와 아래쪽의 다른 사건 폴더 |
| `static/css/style.css` | 스타일. 맨 위 주석에 디자인 규칙이 있습니다 |
| `static/js/desk.js` | 첫 화면의 3D 책상 (three.js) |
| `static/js/site.js` | 가이드의 단계 띠, 단계별 완료 체크와 도장, 목차, 복사 버튼 |
| `static/js/vendor/` | three.js r169 (MIT). CDN 없이 같은 주소에서 받습니다 |
| `static/images/desk.jpg` | 가이드 페이지 배경. 같은 책상을 위에서 렌더링한 그림입니다 |

가이드 본문은 일반 Markdown입니다. 두 가지 약속만 지키면 됩니다.

- 순서가 있는 단계는 `<div class="steps">`와 `</div>` 사이에 `###` 제목으로 씁니다. 번호, 단계 끝의 완료 체크, 표지 아래의 단계 띠가 자동으로 붙습니다.
- 인용문(`>`)은 단계 끝의 "확인" 상자로 표시됩니다.

### 첫 화면의 3D 책상

사건 네 개는 `templates/index.html`의 목록(`.cases`)이 원본입니다. `desk.js`는 이 목록을 읽어 폴더 표지를 그리므로, 이름이나 설명을 바꿀 때는 목록만 고치면 됩니다.

- WebGL을 못 쓰거나 스크립트가 막힌 브라우저에서는 같은 목록이 폴더 카드 네 장으로 보입니다.
- "동작 줄이기"를 켠 사람에게는 움직임 없이 그려지고, 폴더를 열면 바로 이동합니다.
- 단계를 체크한 기록은 그 브라우저의 `localStorage`에만 남습니다. 폴더 표지의 도장이 이 기록을 읽습니다.

## 배포

`main`에 올리면 `.github/workflows/deploy.yml`이 빌드해서 `gh-pages` 브랜치에 올립니다.
처음 한 번은 저장소 설정의 Pages에서 배포 브랜치를 `gh-pages`로 지정해야 합니다.

마스코트와 로고는 [noir](https://github.com/owasp-noir/noir) 저장소의 `docs/static/images`에서 가져왔습니다.
