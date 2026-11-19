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
| `templates/index.html` | 첫 화면. 시간표와 자주 묻는 것이 여기 있습니다 |
| `templates/page.html` | 가이드 세 편이 쓰는 틀 |
| `static/css/style.css` | 스타일. 맨 위 주석에 디자인 규칙이 있습니다 |
| `static/js/site.js` | 단계 완료 체크, 복사 버튼, 옆 목차 |

가이드 본문은 일반 Markdown입니다. 두 가지 약속만 지키면 됩니다.

- 순서가 있는 단계는 `<div class="steps">`와 `</div>` 사이에 `###` 제목으로 씁니다. 번호와 완료 체크가 자동으로 붙습니다.
- 인용문(`>`)은 단계 끝의 "확인" 상자로 표시됩니다.

## 배포

`main`에 올리면 `.github/workflows/deploy.yml`이 빌드해서 `gh-pages` 브랜치에 올립니다.
처음 한 번은 저장소 설정의 Pages에서 배포 브랜치를 `gh-pages`로 지정해야 합니다.

마스코트와 로고는 [noir](https://github.com/owasp-noir/noir) 저장소의 `docs/static/images`에서 가져왔습니다.
