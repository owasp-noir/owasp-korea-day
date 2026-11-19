+++
title = "코드로 기여하기"
description = "분석기와 탐지 룰을 직접 고칩니다. 행사 중에는 빌드되는 환경을 갖추고 과제를 맡는 데까지 가고, 구현은 행사 뒤에 이어 갑니다."

[extra]
mascot = "dev"
need = "Crystal 1.19 이상, 메모리 16GB"
time = "행사 뒤까지"
result = "빌드되는 환경과 맡은 과제 하나"
+++

## 시작하기 전에

Noir는 Crystal로 작성되어 있고, 컴파일에 메모리를 많이 씁니다. 먼저 내 노트북으로 할 수 있는 범위를 확인하세요.

| 하는 일 | 필요한 메모리 | 걸리는 시간 |
|---|---|---|
| Noir 빌드 (`just build`) | 약 6GB | 보통 30초 안팎 |
| 전체 테스트 빌드 (`just test`) | 약 11GB | 보통 40초 안팎 |
| 시크릿 탐지 룰 테스트 | 1GB 미만 | 몇 초 |

메모리가 8GB인 노트북이라면 전체 테스트 빌드가 어렵습니다. 그 경우에는 아래의 [시크릿 탐지 룰](#시크릿-탐지-룰)이 알맞습니다. Crystal만 설치하면 되고 무거운 빌드가 없습니다.

## 따라 하기

<div class="steps">

### 도구 설치하기

macOS에서는 Homebrew로 설치합니다.

```sh
brew install crystal just
```

Ubuntu나 Debian에서는 Crystal 설치 스크립트를 쓰고, 빌드에 필요한 라이브러리를 함께 설치합니다.

```sh
curl -fsSL https://crystal-lang.org/install.sh | sudo bash
sudo apt install -y libyaml-dev libzstd-dev zlib1g-dev pkg-config just
```

다른 환경은 [Crystal 설치 안내](https://crystal-lang.org/install/)를 보세요.

> `crystal --version`과 `just --version`이 각각 버전을 출력합니다.

### 포크하고 내려받기

[Noir 저장소](https://github.com/owasp-noir/noir)에서 오른쪽 위의 <kbd>Fork</kbd>를 눌러 내 계정에 복사본을 만든 뒤 내려받습니다.

```sh
git clone https://github.com/내아이디/noir
cd noir
shards install
```

> `lib/` 폴더가 생기고 의존성 설치가 오류 없이 끝났습니다.

### 빌드하기

```sh
just build
```

처음 빌드할 때는 내장된 구문 분석기도 함께 컴파일하므로 시간이 더 걸립니다. 끝나면 `bin/noir`가 생깁니다. 저장소에 들어 있는 예제 코드를 스캔해서 동작을 확인합니다.

```sh
./bin/noir scan spec/functional_test/fixtures/crystal
```

> 엔드포인트 목록이 출력됩니다. 이제 내가 고친 코드로 Noir를 돌릴 수 있습니다.

### 테스트 돌리기

```sh
just test
```

테스트 전체를 실행 파일 하나(`bin/noir_spec`)로 컴파일한 뒤 실행합니다. 컴파일이 가장 무거운 단계이므로, 한 번 만든 뒤에는 필요한 테스트만 골라 돌립니다.

```sh
./bin/noir_spec -e hono
```

`-e` 뒤에 테스트 이름의 일부를 적으면 그 이름이 들어간 테스트만 실행합니다. 코드를 고친 뒤에는 `just spec-build`로 다시 컴파일하고 같은 방법으로 돌립니다.

> 실패 없이 끝났습니다. 고치기 전에 전부 통과하는 상태를 확인해 두어야, 나중에 실패가 내 변경 때문인지 알 수 있습니다.

### 과제 맡기

[과제 목록](https://github.com/owasp-noir/noir/issues?q=is%3Aissue+is%3Aopen+label%3Aowasp-korea-day)에서 고르거나, [써 보고 제보하기](@/report.md)에서 직접 찾은 문제를 고칩니다. 맡을 이슈에 댓글을 남겨 주세요.

| 과제 | 고치는 곳 | 난이도 |
|---|---|---|
| 분석기가 빠뜨리거나 잘못 잡는 엔드포인트 고치기 | `src/analyzer/analyzers/언어/프레임워크.cr`와 그 테스트 | 보통 |
| 새 태거 만들기 | `src/tagger/` | 보통 |
| 새 출력 형식 만들기 | `src/output_builder/` | 보통 |
| 새 프레임워크 지원 | 탐지기, 분석기, 예제 코드, 테스트 | 어려움 |

분석기를 고칠 때는 순서가 정해져 있습니다. 먼저 문제를 보여 주는 예제 코드를 `spec/functional_test/fixtures/` 아래에 추가하고, 기대하는 엔드포인트를 `spec/functional_test/testers/`의 테스트에 적어 실패하는 것을 확인한 다음, 분석기를 고쳐 통과시킵니다.

저장소의 구조와 새 구성 요소를 추가하는 방법은 [AGENTS.md](https://github.com/owasp-noir/noir/blob/main/AGENTS.md)에 정리되어 있습니다. 코드를 읽기 전에 이 문서부터 읽으세요.

> 맡은 이슈에 내 댓글이 있고, 고칠 파일이 어디인지 찾았습니다.

### 고치고 PR 열기

브랜치를 만들어 작업합니다.

```sh
git checkout -b fix/express-router-prefix
```

고친 뒤에는 포맷과 린트를 확인하고 테스트를 다시 돌립니다.

```sh
just check
just test
```

`just check`가 지적하는 것 가운데 자동으로 고칠 수 있는 것은 `just fix`가 고쳐 줍니다. 모두 통과하면 올립니다.

```sh
git push origin fix/express-router-prefix
```

GitHub의 내 포크 화면에 뜨는 <kbd>Compare &amp; pull request</kbd>를 눌러 PR을 엽니다. 제목은 영어로 쓰고, 본문에는 무엇을 왜 고쳤는지와 관련 이슈 번호를 적습니다.

> PR이 열렸고 자동 검사가 시작되었습니다. 처음 기여하는 계정은 메인테이너가 승인한 뒤에 검사가 돕니다.

</div>

## 시크릿 탐지 룰

Noir는 엔드포인트를 찾으면서 코드에 박힌 API 키나 토큰도 함께 찾습니다. 그 룰은 별도 저장소인 [noir-passive-rules](https://github.com/owasp-noir/noir-passive-rules)에 YAML로 들어 있습니다. 국내 서비스의 키 형식은 아직 거의 없습니다.

룰 하나는 이런 모양입니다.

```yaml
id: stripe-webhook-secret
info:
  name: Detect Stripe Webhook Secret
  author: [owasp noir team]
  severity: high
  description: Detects Stripe webhook signing secrets, which allow forging webhook events
  reference: ['https://docs.stripe.com/webhooks#verify-events']
matchers-condition: or
matchers:
  - type: regex
    patterns:
      - '\bwhsec_[A-Za-z0-9]{32,}'
    condition: or
category: secret
techs: ['*']
```

기여 순서는 세 단계입니다.

1. `secrets/` 아래에 룰 파일을 추가합니다. 키 형식은 그 서비스의 공식 문서에서 확인합니다.
2. `spec/secrets_spec.cr`에 테스트를 추가합니다. 잡혀야 하는 문자열과 잡히면 안 되는 문자열을 각각 적습니다.
3. `crystal spec/secrets_spec.cr`로 테스트를 돌리고 PR을 엽니다.

테스트에 넣는 가짜 키는 한 문자열로 쓰지 말고 `"whs" + "ec_" + "A" * 32`처럼 쪼개서 이어 붙여야 합니다. 통째로 쓰면 GitHub가 진짜 키로 보고 올리는 것을 막습니다. 자세한 방법은 그 저장소의 [AGENTS.md](https://github.com/owasp-noir/noir-passive-rules/blob/main/AGENTS.md)에 단계별로 있습니다.

## AI 에이전트를 쓴다면

두 저장소 모두 에이전트가 읽는 안내 파일(`AGENTS.md`)을 갖추고 있어서 Claude Code나 Codex 같은 도구로 작업하기 좋습니다. 다만 PR을 올리는 사람은 여러분입니다. 에이전트가 만든 변경이라도 무엇을 왜 바꿨는지 설명할 수 있고, 테스트를 직접 돌려 통과를 확인한 것만 올려 주세요.
