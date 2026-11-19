+++
title = "써 보고 제보하기"
description = "익숙한 프로젝트를 Noir로 스캔하고, 빠뜨렸거나 잘못 잡은 엔드포인트를 찾아 이슈로 알립니다. 다시 재현할 수 있는 제보 하나가 분석기 버그 하나를 고칩니다."

[extra]
mascot = "binoculars"
need = "터미널, Noir 설치"
time = "30분"
result = "재현 코드가 붙은 이슈 하나"
+++

## 왜 제보가 기여인가요

Noir는 코드를 실행하지 않고 읽기만 해서 엔드포인트를 찾습니다. 그래서 프레임워크마다 사람들이 라우트를 쓰는 온갖 방식을 미리 알고 있어야 합니다. 메인테이너가 모든 방식을 써 볼 수는 없으니, 실제 프로젝트에서 "이 코드는 못 읽더라"를 알려 주는 것이 분석기를 고치는 출발점이 됩니다.

코드를 고치지 않아도 됩니다. 어떤 코드에서 무엇이 틀렸는지만 정확히 알려 주세요.

## 따라 하기

<div class="steps">

### Noir 설치하기

가장 간단한 방법은 Homebrew입니다. macOS와 Linux에서 됩니다.

```sh
brew install noir
```

Node.js 20 이상이 있다면 npm으로도 설치할 수 있습니다.

```sh
npm install -g @owasp-noir/noir
```

설치 없이 Docker로 실행해도 됩니다. 이 경우 아래 단계의 `noir scan .`을 이 명령으로 바꿔 쓰세요.

```sh
docker run --rm -v "$PWD:/tmp" ghcr.io/owasp-noir/noir:latest noir scan /tmp
```

다른 설치 방법은 [설치 문서](https://owasp-noir.github.io/noir/ko/get_started/installation/)에 있습니다.

> `noir version`을 실행하면 버전 번호가 출력됩니다.

### 스캔할 프로젝트 고르기

직접 만들었거나 잘 아는 프로젝트가 가장 좋습니다. 어떤 엔드포인트가 있어야 하는지 이미 알고 있어서, Noir가 틀린 곳이 바로 보입니다.

마땅한 프로젝트가 없다면 아래 공개 저장소로 시작해 보세요. 셋 다 스캔이 몇 초 안에 끝납니다.

| 저장소 | 들어 있는 것 |
|---|---|
| [tosspayments-sample](https://github.com/tosspayments/tosspayments-sample) | 토스페이먼츠 결제 연동 예제. Express, Spring, Django 등 여러 언어 |
| [portone-sample](https://github.com/portone-io/portone-sample) | 포트원 결제 연동 예제. Express, FastAPI, Flask, Rails, Spring |
| [egovframe-common-components](https://github.com/eGovFramework/egovframe-common-components) | 전자정부 표준프레임워크 공통컴포넌트. Spring |

```sh
git clone https://github.com/tosspayments/tosspayments-sample
cd tosspayments-sample
```

회사 코드처럼 공개할 수 없는 코드를 스캔하는 것은 괜찮습니다. 이 가이드에서 쓰는 기본 스캔은 내 컴퓨터 안에서만 돌고 코드를 밖으로 보내지 않습니다. 다만 그 코드를 이슈에 그대로 붙여서는 안 됩니다. 뒤의 단계에서 공개해도 되는 작은 코드로 바꿉니다.

> 터미널의 현재 위치가 스캔할 프로젝트 폴더입니다.

### 스캔하기

```sh
noir scan . -T
```

`-T`는 태거를 켜는 옵션입니다. 먼저 찾아낸 기술 목록이 나오고, 이어서 엔드포인트가 하나씩 나옵니다.

```text
✔ Detected 1 technologies.
  └── js_express
...
POST /confirm/widget
  ○ body: {"paymentKey":"","orderId":"","amount":""}
```

결과가 길면 파일로 저장해 두고 보세요.

```sh
noir scan . -T -f json -o endpoints.json
```

> 엔드포인트 목록이 출력되었습니다. 하나도 나오지 않았다면 그것부터가 제보할 거리입니다. 다음 단계에서 이유를 확인합니다.

### 결과를 코드와 맞춰 보기

라우트가 정의된 파일을 열어 놓고 Noir의 결과와 하나씩 비교합니다. 찾을 것은 세 가지입니다.

| 종류 | 뜻 | 예 |
|---|---|---|
| 빠뜨림 | 코드에는 있는데 결과에 없습니다. | 라우터 파일을 따로 나눠 불러오는 구조에서 하위 라우트가 통째로 빠짐 |
| 잘못 잡음 | 결과에는 있는데 실제로는 없는 엔드포인트입니다. | 테스트 코드나 주석 속의 주소가 엔드포인트로 나옴 |
| 내용이 틀림 | 엔드포인트는 맞는데 메서드, 경로, 파라미터가 다릅니다. | 공통 경로 접두사 `/api/v1`이 빠짐, 본문 파라미터가 안 보임 |

결과가 전혀 없다면 먼저 그 프레임워크를 Noir가 지원하는지 확인합니다.

```sh
noir list techs
```

목록에 없는 프레임워크라면 버그가 아니라 새 기능 요청입니다. 그것도 좋은 제보입니다.

> 틀린 곳을 하나 찾았고, 그 엔드포인트가 정의된 코드의 위치를 알고 있습니다.

### 가장 작은 재현 코드 만들기

찾은 문제를 다른 사람이 그대로 다시 볼 수 있어야 고칠 수 있습니다. 빈 폴더를 만들고, 문제가 나타나는 부분만 남긴 파일을 넣습니다. 보통 파일 한두 개, 스무 줄 안쪽이면 됩니다.

```sh
mkdir repro && cd repro
# 문제가 되는 라우트 정의만 옮겨 적은 파일을 만든 뒤
noir scan . -T
```

- 프레임워크를 알아볼 수 있는 파일도 같이 둡니다. Express라면 `package.json`, Spring이라면 `build.gradle`이나 `pom.xml`입니다.
- 이름은 뜻이 드러나지 않는 것으로 바꿉니다. 회사 이름, 내부 주소, 키 값이 남아 있지 않은지 확인합니다.
- 줄여도 같은 문제가 나오는지 다시 스캔해서 확인합니다. 줄이는 중에 문제가 사라졌다면, 방금 지운 부분이 원인입니다. 그것도 적어 두세요.

> 새 폴더의 작은 코드만으로 같은 문제가 다시 나타납니다.

### 이슈 쓰기

먼저 [기존 이슈](https://github.com/owasp-noir/noir/issues)에서 같은 프레임워크 이름으로 검색해, 이미 올라온 문제가 아닌지 봅니다. 없다면 [새 이슈](https://github.com/owasp-noir/noir/issues/new/choose)에서 Bug report를 고릅니다.

제목은 영어로, 프레임워크와 증상을 한 줄에 씁니다. 예를 들면 이런 식입니다.

```text
express: routes mounted with router.use() lose their path prefix
```

본문은 아래 틀을 채웁니다. 한국어로 써도 됩니다.

````markdown
**Describe the bug**
어떤 코드에서 무엇이 틀렸는지 한두 문장으로.

**To Reproduce**
아래 파일을 빈 폴더에 두고 `noir scan . -T`를 실행합니다.

```js
// app.js
(재현 코드)
```

**Expected behavior**
나와야 하는 결과:
GET /api/v1/users

**Actual**
실제로 나온 결과:
GET /users

**Versions**
- OS: macOS 15
- Version: (noir version 출력)
````

> 이슈가 등록되었고, 본문만 읽고도 다른 사람이 같은 결과를 다시 만들 수 있습니다.

</div>

## 좋은 제보의 조건

- **다시 만들 수 있습니다.** 재현 코드와 실행한 명령이 그대로 들어 있습니다.
- **기대한 결과가 적혀 있습니다.** "이상해요"가 아니라 "이 주소가 나와야 하는데 저 주소가 나왔다"입니다.
- **하나의 문제만 다룹니다.** 세 가지를 찾았다면 이슈도 세 개입니다.
- **공개해도 되는 코드만 들어 있습니다.**

## 더 해 보고 싶다면

제보한 문제를 직접 고쳐 보고 싶다면 [코드로 기여하기](@/code.md)로 넘어가세요. 재현 코드는 그대로 테스트용 예제가 됩니다.
