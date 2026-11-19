+++
title = "코드로 기여하기"
description = "Noir 코드를 직접 고쳐요. 준비에 시간이 걸려서, 오늘은 내 컴퓨터에서 Noir를 빌드하고 할 일을 정하는 데까지 해요. 고치는 건 행사 뒤에 이어서 하면 돼요."

[extra]
mascot = "dev"
need = "Crystal 1.19 이상, 메모리 16GB"
time = "행사 뒤까지"
result = "빌드되는 내 컴퓨터, 맡은 과제 하나"
+++

## 시작하기 전에

Noir는 Crystal이라는 언어로 만들었어요. Crystal은 빌드할 때 메모리를 많이 써요. 내 노트북으로 어디까지 할 수 있는지 먼저 확인해 보세요.

| 할 일 | 필요한 메모리 | 걸리는 시간 |
|---|---|---|
| Noir 빌드 (`just build`) | 6GB 정도 | 30초쯤 |
| 전체 테스트 빌드 (`just test`) | 11GB 정도 | 40초쯤 |
| 시크릿 탐지 룰 테스트 | 1GB 미만 | 몇 초 |

메모리가 8GB인 노트북이라면 전체 테스트는 돌리기 어려워요. 그럴 땐 아래의 [시크릿 탐지 룰](#시크릿-탐지-룰)을 해 보세요. Crystal만 설치하면 되고, 무거운 빌드가 없어요.

## 따라 하기

<div class="steps">

### 도구 설치하기

macOS라면 Homebrew로 설치해요.

```sh
brew install crystal just
```

Ubuntu나 Debian이라면 Crystal 설치 스크립트를 쓰고, 빌드에 필요한 라이브러리도 같이 설치해요.

```sh
curl -fsSL https://crystal-lang.org/install.sh | sudo bash
sudo apt install -y libyaml-dev libzstd-dev zlib1g-dev pkg-config just
```

다른 환경은 [Crystal 설치 안내](https://crystal-lang.org/install/)를 참고하세요.

> `crystal --version`과 `just --version`을 실행하면 각각 버전이 나와요.

### 내 계정으로 복사해서 내려받기

[Noir 저장소](https://github.com/owasp-noir/noir)에서 오른쪽 위의 <kbd>Fork</kbd>를 눌러요. 내 계정에 복사본이 생겨요. 이걸 포크라고 해요. 그 복사본을 내 컴퓨터로 내려받아요.

```sh
git clone https://github.com/내아이디/noir
cd noir
shards install
```

`shards install`은 Noir가 쓰는 라이브러리를 받아 오는 명령이에요.

> `lib/` 폴더가 생겼고, 오류 없이 끝났어요.

### 빌드하기

```sh
just build
```

처음에는 시간이 좀 더 걸려요. 끝나면 `bin/noir`가 생겨요. 저장소에 들어 있는 예제 코드를 스캔해서 잘 되는지 확인해요.

```sh
./bin/noir scan spec/functional_test/fixtures/crystal
```

> 엔드포인트 목록이 나와요. 이제 내가 고친 코드로 Noir를 돌려 볼 수 있어요.

### 테스트 돌리기

```sh
just test
```

테스트 전체를 실행 파일 하나(`bin/noir_spec`)로 만든 다음 실행해요. 만드는 단계가 제일 무거워요. 그래서 한 번 만든 뒤에는 필요한 테스트만 골라서 돌려요.

```sh
./bin/noir_spec -e hono
```

`-e` 뒤에 이름 일부를 적으면 그 이름이 들어간 테스트만 돌아가요. 코드를 고친 뒤에는 `just spec-build`로 다시 만들고 같은 방법으로 돌려요.

> 실패 없이 끝났어요. 고치기 전에 다 통과하는 걸 확인해 둬야, 나중에 실패했을 때 내가 고친 것 때문인지 알 수 있어요.

### 과제 맡기

[과제 목록](https://github.com/owasp-noir/noir/issues?q=is%3Aissue+is%3Aopen+label%3Aowasp-korea-day)에서 골라도 되고, [써 보고 제보하기](@/report.md)에서 직접 찾은 문제를 고쳐도 돼요. 맡을 이슈에 댓글을 남겨 주세요.

| 할 일 | 고칠 곳 | 어려운 정도 |
|---|---|---|
| 빠뜨리거나 잘못 잡는 엔드포인트 고치기 | `src/analyzer/analyzers/언어/프레임워크.cr`와 그 테스트 | 보통 |
| 태그 붙이는 규칙을 코드로 만들기 | `src/tagger/` | 보통 |
| 새 출력 형식 만들기 | `src/output_builder/` | 보통 |
| 새 프레임워크 지원하기 | 여러 곳 | 어려움 |

엔드포인트를 찾는 부분을 고칠 때는 순서가 있어요.

1. 문제가 드러나는 예제 코드를 `spec/functional_test/fixtures/` 아래에 넣어요.
2. 나와야 하는 엔드포인트를 `spec/functional_test/testers/`의 테스트에 적어요. 이때는 테스트가 실패하는 게 맞아요.
3. 코드를 고쳐서 테스트를 통과시켜요.

저장소가 어떻게 생겼는지, 새 기능은 어디에 넣는지는 [AGENTS.md](https://github.com/owasp-noir/noir/blob/main/AGENTS.md)에 정리돼 있어요. 코드를 읽기 전에 이 문서부터 읽어 보세요.

> 맡은 이슈에 내 댓글이 달렸어요. 고칠 파일이 어디 있는지도 찾았어요.

### 고치고 PR 올리기

작업할 브랜치를 하나 만들어서 고쳐요.

```sh
git checkout -b fix/express-router-prefix
```

다 고쳤으면 코드 모양을 검사하고 테스트를 다시 돌려요.

```sh
just check
just test
```

`just check`가 알려 준 것 중 자동으로 고칠 수 있는 건 `just fix`가 고쳐 줘요. 다 통과하면 올려요.

```sh
git push origin fix/express-router-prefix
```

GitHub에서 내 복사본 화면으로 가면 <kbd>Compare &amp; pull request</kbd> 버튼이 보여요. 눌러서 PR을 올려요. 제목은 영어로 적고, 내용에는 뭘 왜 고쳤는지와 관련 이슈 번호를 적어요.

> PR이 올라갔고 자동 검사가 시작됐어요. 처음 기여하는 계정은 관리자가 허락한 뒤에 검사가 돌아가요.

</div>

## 시크릿 탐지 룰

Noir는 엔드포인트를 찾으면서, 코드에 실수로 적어 둔 API 키나 토큰도 같이 찾아요. 이걸 찾는 규칙은 [noir-passive-rules](https://github.com/owasp-noir/noir-passive-rules)라는 다른 저장소에 들어 있어요. 국내 서비스의 키 모양은 아직 거의 없어요.

규칙 하나는 이렇게 생겼어요.

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

기여는 세 단계예요.

1. `secrets/` 폴더에 규칙 파일을 추가해요. 키가 어떻게 생겼는지는 그 서비스의 공식 문서에서 확인해요.
2. `spec/secrets_spec.cr`에 테스트를 추가해요. 잡혀야 하는 글자와 잡히면 안 되는 글자를 각각 적어요.
3. `crystal spec/secrets_spec.cr`로 테스트를 돌리고 PR을 올려요.

테스트에 넣는 가짜 키는 한 번에 쓰지 말고 `"whs" + "ec_" + "A" * 32`처럼 쪼개서 이어 붙여야 해요. 통째로 쓰면 GitHub가 진짜 키로 착각해서 올리지 못하게 막아요. 자세한 방법은 그 저장소의 [AGENTS.md](https://github.com/owasp-noir/noir-passive-rules/blob/main/AGENTS.md)에 순서대로 나와 있어요.

## AI 도구를 쓴다면

두 저장소 모두 AI 도구가 읽는 안내 파일(`AGENTS.md`)이 있어서, Claude Code나 Codex 같은 도구로 작업하기 좋아요. 다만 PR을 올리는 사람은 여러분이에요. AI가 고친 것이라도 뭘 왜 바꿨는지 설명할 수 있어야 하고, 테스트가 통과하는지 직접 확인한 다음에 올려 주세요.
