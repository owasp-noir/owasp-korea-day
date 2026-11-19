+++
title = "브라우저로 기여하기"
description = "Noir가 아직 모르는 국내 서비스의 단어를 태그 룰에 추가합니다. YAML 파일 하나를 GitHub 화면에서 고치고, 그 변경을 PR로 보냅니다."

[extra]
mascot = "inspect"
need = "GitHub 계정, 브라우저"
time = "40분"
result = "내 이름으로 열린 PR 하나"
+++

## 무엇을 고치나요

Noir는 소스 코드를 읽어 그 서비스가 가진 엔드포인트를 찾아냅니다. **태거**는 찾아낸 엔드포인트에 "여기는 결제", "여기는 웹훅" 같은 꼬리표를 붙여서, 보안 검토자가 어디부터 볼지 정하도록 돕습니다.

아래는 토스페이먼츠가 공개한 [결제 연동 샘플](https://github.com/tosspayments/tosspayments-sample)에서 결제를 최종 승인하는 엔드포인트입니다.

```js
app.post("/confirm/widget", function (req, res) {
  const { paymentKey, orderId, amount } = req.body;

  // 결제 승인 API를 호출하세요.
  ...
});
```

Noir로 스캔하면 이 엔드포인트와 본문 파라미터 세 개를 정확히 찾습니다. 그런데 `payment` 태그가 없습니다.

```text
POST /confirm/widget
  ○ body: {"paymentKey":"","orderId":"","amount":""}
```

결제 룰은 `amount`만 보고는 결제라고 판단하지 않습니다. 금액 파라미터는 결제가 아닌 곳에도 흔하기 때문입니다. 그리고 토스페이먼츠가 쓰는 `paymentKey`라는 이름은 아직 모릅니다. 룰에 이 이름을 추가하면 결과가 이렇게 바뀝니다.

```text
POST /confirm/widget
  ○ body: {"paymentKey":"","orderId":"","amount":""}
  ○ tags: payment
```

이 단어 하나로, 같은 샘플 저장소에서 `payment` 태그가 붙는 엔드포인트가 89개 중 49개에서 62개로 늘어납니다. Noir의 룰은 해외 서비스 위주로 채워져 있어서 국내 결제 대행사나 국내 서비스의 이름은 거의 들어 있지 않습니다. 오늘 채울 곳이 여기입니다.

## 룰 파일 읽는 법

태그 룰은 [`src/tagger/rules/`](https://github.com/owasp-noir/noir/tree/main/src/tagger/rules)에 있는 YAML 파일입니다. 파일 하나가 태거 하나입니다. 결제 룰을 줄여서 보면 이런 모양입니다.

```yaml
key: payment
match:
  any:                        # 아래 중 하나라도 맞으면 태그
    - path_segment: [payment, checkout, billing, paypal, stripe]
    - param:
        name: [card_number, cvv, payment_method]
examples:
  match:                      # 태그가 붙어야 하는 예
    - { method: POST, url: /api/checkout }
  no_match:                   # 태그가 붙으면 안 되는 예
    - { url: /api/orders }
```

알아 둘 규칙은 세 가지입니다.

| 항목 | 동작 | 예 |
|---|---|---|
| `path_segment` | 주소를 소문자로 바꾼 뒤 `/` `-` `_` `.`에서 잘라 조각으로 만들고, 조각이 목록에 있는지 봅니다. | `/kakao-pay/ready`는 `kakao`, `pay`, `ready` 세 조각입니다. `/kakaopay/ready`는 `kakaopay`, `ready` 두 조각입니다. |
| `param`의 `name` | 파라미터 이름을 소문자로 바꾸고 `-`와 `_`를 뺀 뒤 비교합니다. | `payment_key`, `paymentKey`, `payment-key`는 같은 이름입니다. 하나만 적으면 됩니다. |
| `examples` | 이 목록이 곧 테스트입니다. PR을 올리면 자동 검사가 예시를 하나씩 돌려 봅니다. | 테스트 코드를 따로 쓰지 않습니다. |

조건 전체 목록은 [룰 디렉터리의 README](https://github.com/owasp-noir/noir/blob/main/src/tagger/rules/README.md)에 있습니다.

## 따라 하기

예시는 진행자가 시연하는 토스페이먼츠입니다. 여러분은 첫 단계에서 고른 항목으로 바꿔서 따라 하세요.

<div class="steps">

### 과제 고르기

[과제 목록](https://github.com/owasp-noir/noir/issues?q=is%3Aissue+is%3Aopen+label%3Aowasp-korea-day)에서 하나를 고르고 "제가 하겠습니다"라고 댓글을 남깁니다. 이미 댓글이 달린 이슈는 다른 분이 하고 있으니 피하세요.

| 과제 종류 | 고치는 파일 | 무엇을 추가하나 |
|---|---|---|
| 결제 대행사 | `payment.yml` | 국내 결제 대행사의 이름, 결제 승인 요청에 쓰는 파라미터 이름 |
| 웹훅 | `webhook.yml` | 국내 서비스가 웹훅 요청에 붙이는 서명 헤더 이름 |
| 관리자 화면 | `admin.yml` | 국내 서비스에서 관리자 경로에 흔히 쓰는 단어 |

추가할 이름은 기억이 아니라 그 서비스의 **공식 개발 문서나 공식 샘플 코드**에서 확인합니다. 그 주소는 PR을 열 때 붙입니다.

> 이슈에 내 댓글이 보이고, 추가할 단어와 그 근거가 되는 주소를 메모해 두었습니다.

### 파일을 편집 화면으로 열기

고칠 파일을 GitHub에서 엽니다. 결제 룰이라면 [payment.yml](https://github.com/owasp-noir/noir/blob/main/src/tagger/rules/payment.yml)입니다. 파일 오른쪽 위의 연필 아이콘을 누릅니다.

이 저장소에 쓰기 권한이 없으므로 GitHub가 복사본을 만들자고 합니다. <kbd>Fork this repository</kbd>를 누르세요. 내 계정 아래에 복사본이 생기고, 편집은 거기서 이루어집니다.

> 파일 내용을 고칠 수 있는 편집기가 열렸습니다. 주소창의 저장소 주인이 `owasp-noir`가 아니라 내 아이디입니다.

### 조건에 단어 추가하기

`match` 아래에서 알맞은 목록을 찾아 단어를 추가합니다. 토스페이먼츠는 파라미터 이름 하나를 넣습니다.

```diff
     - param:
         name: [card_number, cc_number, cvv, cvc, cvv2, cvn, csc, security_code,
                ...
-               iban, routing_number, sort_code]
+               iban, routing_number, sort_code, payment_key]
```

- 들여쓰기는 **스페이스**로, 윗줄과 같은 칸에 맞춥니다. 탭은 쓰지 않습니다.
- 단어는 `]` 앞에 쉼표로 이어 붙입니다. `]`는 목록 끝에 하나만 있어야 합니다.
- 파라미터 이름은 표기 하나만 적습니다. `payment_key`를 넣으면 `paymentKey`도 같이 잡힙니다.
- `path_segment`에는 `-`, `_`, `.`, `/`가 들어간 단어를 쓸 수 없습니다. `kakao_pay`가 아니라 `kakaopay`입니다.
- 너무 흔한 단어는 넣지 않습니다. `key`만 넣으면 API 키를 받는 요청까지 전부 결제로 태그됩니다.

> 편집기 위쪽의 Preview 탭을 누르면 바뀐 줄만 초록과 빨강으로 보입니다. 내가 의도한 줄만 바뀌었습니다.

### 예시 추가하기

같은 파일 아래쪽 `examples`에 예시를 추가합니다. `match`에는 방금 넣은 단어 덕분에 새로 태그되는 요청을, `no_match`에는 비슷해 보이지만 태그되면 안 되는 요청을 적습니다.

```diff
 examples:
   match:
     ...
+    - { method: POST, url: /confirm/widget, params: [{ name: paymentKey, type: json }] }
   no_match:
     ...
+    - { method: POST, url: /confirm/email, params: [{ name: key, type: json }] }
```

`no_match`가 이 작업에서 가장 중요한 부분입니다. 태그는 붙이는 것보다 **잘못 붙지 않게 하는 것**이 어렵습니다. "이 단어를 넣었을 때 엉뚱하게 걸릴 만한 주소가 뭘까"를 한 번 생각하고 그 주소를 적으세요.

실제 사례가 있습니다. 전자정부 표준프레임워크에는 `/sym/cal/EgovAdministDayCalendar.do`라는 주소가 있는데, 여기서 Administ는 관리자가 아니라 행정입니다. 주소에 `admin`이라는 글자가 들어 있다는 이유만으로 관리자 태그를 붙이면 틀립니다. 이런 주소가 `no_match`에 넣기 좋은 예시이고, 이런 차이는 그 서비스를 써 본 사람이 가장 잘 압니다.

> 추가한 조건마다 `match` 예시가 하나씩 있고, `no_match` 예시를 적어도 하나 추가했습니다. 기존 예시는 지우지 않았습니다.

### PR 열기

편집기 오른쪽 위의 <kbd>Commit changes…</kbd>를 누르고, 뜨는 창에서 한 줄 설명을 적은 뒤 <kbd>Propose changes</kbd>를 누릅니다. 변경 내용을 비교하는 화면으로 넘어가면 <kbd>Create pull request</kbd>를 누릅니다. 제목과 본문을 적는 화면이 나옵니다.

제목은 영어로, 무엇을 하는 변경인지 한 줄로 씁니다.

```text
feat: tag Toss Payments confirm requests as payment
```

본문은 아래 틀을 내 것으로 바꿔 씁니다.

```markdown
## What
Adds `payment_key` to the payment rule's parameter names.

## Why
`POST /confirm/widget` in the official Toss Payments sample takes `paymentKey`, `orderId` and `amount`, but it was not tagged `payment`.

## Reference
https://github.com/tosspayments/tosspayments-sample

Closes #이슈번호
```

다 적었으면 한 번 더 <kbd>Create pull request</kbd>를 누릅니다.

> 주소가 `github.com/owasp-noir/noir/pull/숫자`로 바뀌었고, 초록색 Open 표시가 보입니다. PR이 열렸습니다.

### 자동 검사 결과 보기

PR 화면 아래쪽에 검사 목록이 생깁니다. 이 저장소에 처음 기여하는 계정은 메인테이너가 승인해야 검사가 시작되므로, 처음에는 승인을 기다린다는 안내만 보일 수 있습니다. 진행자가 쉬는 시간 전까지 차례로 승인합니다.

룰의 예시를 돌려 보는 검사는 `tests`이고 보통 5~8분 걸립니다. 빨간 X가 뜨면 Details를 눌러 로그를 열고 내 룰 파일 이름으로 검색하세요.

고칠 것이 있으면 PR 화면의 Files changed 탭에서 파일 오른쪽 <kbd>…</kbd> 메뉴의 Edit file로 다시 편집합니다. 저장하면 같은 PR에 반영되고 검사가 다시 돕니다. PR을 새로 열 필요는 없습니다.

> `tests` 옆에 초록 체크가 떴습니다. 검사가 아직 돌고 있다면 쉬고 와서 2부를 시작할 때 확인합니다.

</div>

## 막혔을 때

| 보이는 것 | 원인 | 고치는 법 |
|---|---|---|
| `path_segment 'kakao_pay' contains a separator (/ - _ .) and can never match a single segment` | 경로 조각 목록에 구분자가 든 단어를 넣었습니다. | 구분자를 뺀 한 단어로 적습니다. 주소가 `/kakao-pay` 형태라면 조각은 `kakao`와 `pay`로 나뉘니, 어느 조각을 볼지 다시 정합니다. |
| `tagged but listed under no_match: GET /kakaopay/login (http)` | `no_match`에 적은 예시가 실제로는 룰에 걸립니다. | 예시가 잘못됐다면 예시를 바꿉니다. 예시가 맞다면 조건이 너무 넓은 것이니 더 구체적인 단어로 좁힙니다. |
| 로그에 YAML 구문 오류와 줄 번호 | 들여쓰기가 어긋났거나, 탭이 섞였거나, `]`나 `,`가 빠졌습니다. | 그 줄과 바로 윗줄을 위의 예시와 한 글자씩 비교합니다. |
| 검사가 시작되지 않고 승인 대기 안내만 보임 | 첫 기여 계정의 검사는 메인테이너 승인이 필요합니다. | 기다리면 됩니다. 진행자에게 PR 번호를 알려 주세요. |
| 연필 아이콘이 눌리지 않음 | GitHub에 로그인하지 않았습니다. | 로그인한 뒤 파일 화면을 새로 고칩니다. |

## 2부에서 할 일

쉬는 시간이 끝나면 먼저 1부에서 연 PR의 검사 결과를 봅니다. 빨간 X가 있으면 위의 표를 보고 고칩니다. 초록 체크를 받았다면 아래에서 다음 과제를 고르세요. 아래로 갈수록 손이 더 갑니다.

| 과제 | 하는 일 |
|---|---|
| 단어 하나 더 | 다른 서비스의 단어로 두 번째 PR을 엽니다. 같은 여섯 단계를 반복합니다. 두 번째는 훨씬 빨리 끝납니다. |
| 새 룰 파일 | 기존 룰에 맞는 자리가 없는 주제라면 [새 파일](https://github.com/owasp-noir/noir/new/main/src/tagger/rules)을 만듭니다. 파일 이름은 `key`와 같아야 하고, `match`와 `no_match` 예시가 모두 있어야 합니다. 좋은 후보는 전자정부 표준프레임워크입니다. 공통컴포넌트를 스캔하면 엔드포인트가 1,219개 나오는데, 로그인(`/uat/uia/actionLogin.do`)이나 권한 관리(`/sec/ram/EgovAuthorRoleInsert.do`)를 포함해 의미 태그가 붙는 것은 25개뿐입니다. |
| 써 보고 제보하기 | Noir를 설치해 직접 스캔하고, 틀린 곳을 찾아 이슈로 알립니다. [가이드 보기](@/report.md) |
| 코드로 기여하기 | 분석기나 탐지 룰을 직접 고칩니다. [가이드 보기](@/code.md) |

## PR을 연 뒤에는

- 마무리 시간에 검사가 끝난 PR 한두 개를 그 자리에서 머지해 봅니다. 나머지 리뷰는 행사가 끝난 뒤 PR 댓글로 진행하니 GitHub 알림 메일을 확인해 주세요.
- 수정 요청이 오면 같은 PR에서 파일을 다시 편집하면 됩니다.
- 머지되면 다음 Noir 릴리즈에 여러분의 룰이 들어가고, 저장소 README의 기여자 그림에 프로필이 올라갑니다.
