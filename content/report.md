+++
title = "써 보고 제보하기"
description = "아는 프로젝트에 Noir를 돌려 보고, 빠뜨렸거나 틀리게 나온 부분을 찾아서 알려 줘요. 코드를 고치지 않아도 큰 도움이 돼요."

[extra]
mascot = "binoculars"
need = "터미널, Noir 설치"
time = "30분"
result = "예제 코드를 붙인 이슈 하나"
+++

## 제보도 기여예요

Noir는 코드를 실행하지 않고 읽기만 해서 엔드포인트를 찾아요. 엔드포인트는 서버가 요청을 받는 주소예요. `/login`, `/api/orders` 같은 것들이에요.

읽기만 해서 찾으려면 사람들이 코드를 어떻게 쓰는지 미리 알고 있어야 해요. 그런데 프레임워크도 많고 쓰는 방식도 제각각이라, 만드는 사람들이 전부 써 볼 수는 없어요.

그래서 "이런 코드는 Noir가 못 읽어요" 하고 알려 주는 제보가 큰 도움이 돼요. 코드를 고칠 필요는 없어요. 어떤 코드에서 뭐가 틀렸는지만 정확히 알려 주세요.

## 따라 하기

<div class="steps">

### Noir 설치하기

Homebrew가 제일 간단해요. macOS와 Linux에서 쓸 수 있어요.

```sh
brew install noir
```

Node.js 20 이상이 깔려 있다면 npm으로도 설치할 수 있어요.

```sh
npm install -g @owasp-noir/noir
```

설치하고 싶지 않다면 Docker로 바로 실행해도 돼요. 이때는 아래 단계에 나오는 `noir scan .` 대신 이 명령을 써요.

```sh
docker run --rm -v "$PWD:/tmp" ghcr.io/owasp-noir/noir:latest noir scan /tmp
```

다른 방법은 [설치 문서](https://owasp-noir.github.io/noir/ko/get_started/installation/)에 있어요.

> `noir version`을 실행하면 버전 번호가 나와요.

### 스캔할 프로젝트 고르기

내가 만들었거나 잘 아는 프로젝트가 제일 좋아요. 어떤 엔드포인트가 있는지 이미 알고 있으니, Noir가 틀린 곳이 바로 보이거든요.

마땅한 게 없다면 아래 공개 저장소로 시작해 보세요. 셋 다 몇 초면 스캔이 끝나요.

| 저장소 | 내용 |
|---|---|
| [tosspayments-sample](https://github.com/tosspayments/tosspayments-sample) | 토스페이먼츠 결제 연동 예제예요. Express, Spring, Django 등 여러 언어로 되어 있어요. |
| [portone-sample](https://github.com/portone-io/portone-sample) | 포트원 결제 연동 예제예요. Express, FastAPI, Flask, Rails, Spring이 들어 있어요. |
| [egovframe-common-components](https://github.com/eGovFramework/egovframe-common-components) | 전자정부 표준프레임워크 공통컴포넌트예요. Spring으로 되어 있어요. |

```sh
git clone https://github.com/tosspayments/tosspayments-sample
cd tosspayments-sample
```

회사 코드처럼 공개하면 안 되는 코드를 스캔해도 괜찮아요. 여기서 쓰는 기본 스캔은 내 컴퓨터 안에서만 돌아가고, 코드를 밖으로 보내지 않아요. 다만 그 코드를 이슈에 그대로 붙이면 안 돼요. 뒤에서 공개해도 되는 짧은 코드로 바꿀 거예요.

> 터미널에서 스캔할 프로젝트 폴더로 들어와 있어요.

### 스캔하기

```sh
noir scan . -T
```

`-T`는 태그도 붙여 달라는 옵션이에요. 먼저 Noir가 알아본 프레임워크가 나오고, 이어서 엔드포인트가 하나씩 나와요.

```text
✔ Detected 1 technologies.
  └── js_express
...
POST /confirm/widget
  ○ body: {"paymentKey":"","orderId":"","amount":""}
```

결과가 길면 파일로 저장해서 보세요.

```sh
noir scan . -T -f json -o endpoints.json
```

> 엔드포인트 목록이 나왔어요. 하나도 안 나왔다면 그것도 제보할 거리예요. 다음 단계에서 이유를 찾아봐요.

### 결과와 코드 비교하기

주소를 정해 둔 코드 파일을 열어 놓고, Noir가 낸 결과와 하나씩 비교해요. 찾을 건 세 가지예요.

| 종류 | 뜻 | 예 |
|---|---|---|
| 빠뜨렸어요 | 코드에는 있는데 결과에 없어요. | 주소를 여러 파일에 나눠 적었더니 일부가 통째로 빠져요. |
| 잘못 잡았어요 | 결과에는 있는데 실제로는 없는 주소예요. | 테스트 코드나 주석에 적힌 주소가 결과에 나와요. |
| 내용이 달라요 | 주소는 맞는데 세부 내용이 틀려요. | 앞에 붙어야 할 `/api/v1`이 빠져요. 받는 값이 안 보여요. |

결과가 아예 없다면, Noir가 그 프레임워크를 지원하는지부터 확인해요.

```sh
noir list techs
```

목록에 없다면 오류가 아니라 "이것도 지원해 주세요"라는 요청이 돼요. 이런 요청도 환영해요.

> 틀린 곳을 하나 찾았어요. 그 주소가 코드 어디에 있는지도 알아요.

### 짧은 예제 만들기

다른 사람이 같은 문제를 그대로 볼 수 있어야 고칠 수 있어요. 빈 폴더를 하나 만들고, 문제가 생기는 부분만 옮겨 적은 파일을 넣어요. 파일 한두 개, 스무 줄 정도면 충분해요.

```sh
mkdir repro && cd repro
# 문제가 생기는 부분만 옮겨 적은 파일을 만든 다음
noir scan . -T
```

- 어떤 프레임워크인지 알 수 있는 파일도 같이 넣어요. Express라면 `package.json`, Spring이라면 `build.gradle`이나 `pom.xml`이에요.
- 이름은 뜻이 드러나지 않게 바꿔요. 회사 이름, 내부 주소, 키 값이 남아 있지 않은지 꼭 확인해요.
- 줄인 다음 다시 스캔해서 같은 문제가 나오는지 봐요. 줄이다가 문제가 사라졌다면 방금 지운 부분이 원인이에요. 그것도 적어 두면 좋아요.

> 새 폴더에 있는 짧은 코드만으로 같은 문제가 다시 나와요.

### 이슈 올리기

먼저 [이슈 목록](https://github.com/owasp-noir/noir/issues)에서 프레임워크 이름으로 검색해 봐요. 같은 문제가 이미 올라와 있을 수 있어요. 없다면 [새 이슈](https://github.com/owasp-noir/noir/issues/new/choose)에서 Bug report를 골라요.

제목은 영어로, 프레임워크 이름과 문제를 한 줄로 적어요. 이런 식이에요.

```text
express: routes mounted with router.use() lose their path prefix
```

내용은 아래 틀을 채워요. 한국어로 써도 괜찮아요.

````markdown
**Describe the bug**
어떤 코드에서 뭐가 틀렸는지 한두 문장으로 적어요.

**To Reproduce**
아래 파일을 빈 폴더에 넣고 `noir scan . -T`를 실행해요.

```js
// app.js
(예제 코드)
```

**Expected behavior**
나와야 하는 결과:
GET /api/v1/users

**Actual**
실제로 나온 결과:
GET /users

**Versions**
- OS: macOS 15
- Version: (noir version을 실행해서 나온 값)
````

> 이슈가 올라갔어요. 내용만 읽고도 다른 사람이 같은 결과를 볼 수 있어요.

</div>

## 좋은 제보는 이래요

- **따라 해 볼 수 있어요.** 예제 코드와 실행한 명령이 그대로 들어 있어요.
- **기대한 결과가 적혀 있어요.** "이상해요"보다 "이 주소가 나와야 하는데 저 주소가 나왔어요"가 좋아요.
- **한 번에 한 가지만 다뤄요.** 세 가지를 찾았다면 이슈도 세 개로 나눠요.
- **공개해도 되는 코드만 들어 있어요.**

## 직접 고쳐 보고 싶다면

제보한 문제를 직접 고쳐 보고 싶다면 [코드로 기여하기](@/code.md)로 넘어가세요. 만들어 둔 예제는 그대로 테스트에 쓸 수 있어요.
