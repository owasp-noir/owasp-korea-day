+++
title = "브라우저로 기여하기"
description = "Noir가 아직 모르는 국내 서비스 이름을 알려 주는 일이에요. GitHub 화면에서 파일 하나를 고치고, 반영해 달라는 요청(PR)을 보내요."

[extra]
mascot = "inspect"
need = "GitHub 계정, 브라우저"
time = "40분"
result = "내 이름으로 올린 PR 하나"
+++

## 무엇을 고치나요

Noir는 소스 코드를 읽고, 그 서비스에 어떤 주소가 열려 있는지 찾아 줘요. 이런 주소를 **엔드포인트**라고 불러요. `/login`, `/api/orders` 같은 것들이에요.

찾은 엔드포인트에는 "여기는 결제", "여기는 웹훅" 같은 **태그**를 붙여요. 보안 점검하는 사람이 어디부터 볼지 고르기 쉬워지거든요.

그런데 가끔 태그를 빠뜨려요. 카카오페이로 예를 들어 볼게요. 카카오페이는 결제가 끝나면 `pg_token`이라는 값을 붙여서 우리 서버로 돌려보내요. 그래서 카카오페이를 붙인 서버에는 보통 이런 코드가 있어요.

```js
app.get("/kakaoPaySuccess", function (req, res) {
  const pgToken = req.query.pg_token;

  // 받은 pg_token으로 카카오페이에 결제 승인을 요청해요.
  ...
});
```

Noir로 스캔하면 주소와 받는 값을 잘 찾아요. 그런데 결제 태그가 안 붙어요.

```text
GET /kakaoPaySuccess?pg_token=
```

Noir가 `pg_token`이라는 이름을 모르기 때문이에요. Noir가 아는 이름은 대부분 해외 서비스 것이거든요. 이 이름을 추가하면 결과가 이렇게 바뀌어요.

```text
GET /kakaoPaySuccess?pg_token=
  ○ tags: payment
```

실제로 카카오페이를 붙인 공개 저장소 다섯 곳을 스캔해 봤어요. `pg_token`을 받는 주소 6개 중 3개에 결제 태그가 없었고, 이 단어를 추가하니 6개 모두에 붙었어요. 오늘 할 일이 바로 이런 거예요. 국내 서비스를 써 본 사람만 아는 이름을 Noir에게 알려 줘요.

## 룰 파일은 이렇게 생겼어요

태그를 붙이는 규칙은 [`src/tagger/rules/`](https://github.com/owasp-noir/noir/tree/main/src/tagger/rules) 폴더에 파일로 들어 있어요. 결제, 웹훅, 관리자처럼 태그 하나에 파일 하나예요. 결제 룰을 간단히 줄이면 이래요.

```yaml
key: payment
match:
  any:                        # 아래 중 하나라도 맞으면 태그를 붙여요
    - path_segment: [payment, checkout, billing, paypal, stripe]
    - param:
        name: [card_number, cvv, payment_method]
examples:
  match:                      # 태그가 붙어야 하는 예
    - { method: POST, url: /api/checkout }
  no_match:                   # 태그가 붙으면 안 되는 예
    - { url: /api/orders }
```

세 가지만 알면 돼요.

| 이름 | 하는 일 | 예 |
|---|---|---|
| `path_segment` | 주소를 `/` `-` `_` `.`에서 잘라 조각으로 나눈 다음, 그 조각이 목록에 있는지 봐요. 대문자와 소문자는 구분하지 않아요. | `/kakao-pay/ready`는 `kakao`, `pay`, `ready`로 나뉘어요. `/kakaopay/ready`는 `kakaopay`, `ready`로 나뉘어요. |
| `param`의 `name` | 요청에 담겨 오는 값의 이름을 봐요. 대문자와 소문자, `-`, `_`는 따지지 않아요. | `pg_token`, `pgToken`, `pg-token`을 모두 같은 이름으로 봐요. 하나만 적으면 돼요. |
| `examples` | 룰이 제대로 동작하는지 확인하는 예시예요. PR을 올리면 자동 검사가 하나씩 돌려 봐요. | 테스트 코드를 따로 쓸 필요가 없어요. |

더 많은 조건은 [룰 폴더의 README](https://github.com/owasp-noir/noir/blob/main/src/tagger/rules/README.md)에 있어요.

## 따라 하기

아래 예시는 진행자가 시연하는 카카오페이예요. 여러분은 첫 단계에서 고른 과제에 맞게 바꿔서 따라 하면 돼요.

<div class="steps">

### 과제 고르기

[과제 목록](https://github.com/owasp-noir/noir/issues?q=is%3Aissue+is%3Aopen+label%3Aowasp-korea-day)에서 하나를 골라 "제가 할게요"라고 댓글을 남겨요. 이미 댓글이 달린 과제는 다른 분이 하고 있으니 다른 걸 골라 주세요.

| 과제 | 고칠 파일 | 추가할 것 |
|---|---|---|
| 결제 대행사 | `payment.yml` | 국내 결제 대행사 이름, 결제를 승인할 때 보내는 값의 이름 |
| 웹훅 | `webhook.yml` | 국내 서비스가 웹훅을 보낼 때 붙이는 서명 헤더 이름 |
| 관리자 화면 | `admin.yml` | 국내 서비스가 관리자 주소에 자주 쓰는 단어 |

추가할 이름은 기억에 기대지 말고, 그 서비스의 **공식 문서나 공식 샘플 코드**에서 확인해 주세요. 확인한 주소는 나중에 PR에 붙여요.

> 과제에 내 댓글이 달렸어요. 추가할 단어와, 그 단어를 확인한 주소를 적어 뒀어요.

### 고칠 파일 열기

고칠 파일을 GitHub에서 열어요. 결제 룰이라면 [payment.yml](https://github.com/owasp-noir/noir/blob/main/src/tagger/rules/payment.yml)이에요. 파일 오른쪽 위에 있는 연필 아이콘을 눌러요.

이 저장소를 직접 고칠 권한은 없어서, GitHub가 내 계정에 복사본을 만들자고 해요. 이걸 **포크**라고 해요. <kbd>Fork this repository</kbd>를 누르면 복사본이 생기고, 거기서 고치게 돼요.

> 파일을 고칠 수 있는 화면이 열렸어요. 주소창을 보면 `owasp-noir` 자리에 내 아이디가 있어요.

### 단어 추가하기

`match` 아래에서 알맞은 목록을 찾아 단어를 추가해요. 카카오페이 예시에서는 이름 하나를 넣어요.

```diff
     - param:
         name: [card_number, cc_number, cvv, cvc, cvv2, cvn, csc, security_code,
                ...
-               iban, routing_number, sort_code]
+               iban, routing_number, sort_code, pg_token]
```

- 띄어쓰기는 **스페이스**로 하고, 윗줄과 줄을 맞춰요. 탭 키는 쓰지 않아요.
- 단어는 쉼표로 이어서 `]` 앞에 넣어요. `]`는 맨 끝에 하나만 있어야 해요.
- 이름은 한 가지 모양으로만 적어요. `pg_token`을 넣으면 `pgToken`도 같이 잡혀요.
- `path_segment`에는 `-`, `_`, `.`, `/`가 들어간 단어를 넣을 수 없어요. `kakao_pay`가 아니라 `kakaopay`로 적어요.
- 너무 흔한 단어는 넣지 않아요. `token`만 넣으면 로그인 토큰을 받는 요청까지 전부 결제로 잡혀요.

> 화면 위쪽의 Preview 탭을 누르면 바뀐 줄만 초록색과 빨간색으로 보여요. 내가 고치려던 줄만 바뀌었어요.

### 예시 추가하기

같은 파일 아래쪽에 있는 `examples`에 예시를 추가해요. `match`에는 방금 넣은 단어 덕분에 새로 태그가 붙는 요청을 적어요. `no_match`에는 비슷해 보여도 태그가 붙으면 안 되는 요청을 적어요.

```diff
 examples:
   match:
     ...
+    - { url: /kakaoPaySuccess, params: [{ name: pg_token }] }
   no_match:
     ...
+    - { url: /auth/refresh, params: [{ name: token }] }
```

여기서 제일 중요한 건 `no_match`예요. 태그는 붙이기보다 **엉뚱한 데 안 붙게 하기**가 더 어렵거든요. "이 단어를 넣으면 어떤 주소가 잘못 걸릴까?" 한 번 생각해 보고, 떠오른 주소를 적어 주세요.

예를 하나 들게요. 전자정부 표준프레임워크에는 `/sym/cal/EgovAdministDayCalendar.do`라는 주소가 있어요. 여기서 Administ는 "관리자"가 아니라 "행정"이에요. `admin`이라는 글자가 들어 있다고 관리자 태그를 붙이면 틀려요. 이런 건 그 서비스를 써 본 사람이 제일 잘 알아요.

> 추가한 단어마다 `match` 예시를 하나씩 넣었어요. `no_match` 예시도 하나 이상 넣었어요. 원래 있던 예시는 지우지 않았어요.

### PR 올리기

이제 고친 내용을 반영해 달라고 요청할 차례예요. 이 요청을 **PR**(풀 리퀘스트)이라고 해요.

화면 오른쪽 위의 <kbd>Commit changes…</kbd>를 눌러요. 창이 뜨면 무엇을 고쳤는지 한 줄 적고 <kbd>Propose changes</kbd>를 눌러요. 바뀐 내용을 보여 주는 화면으로 넘어가면 <kbd>Create pull request</kbd>를 눌러요. 그러면 제목과 내용을 적는 화면이 나와요.

제목은 영어로, 무엇을 바꿨는지 한 줄로 적어요.

```text
feat: tag KakaoPay approval redirects as payment
```

내용은 아래 틀에서 내 과제에 맞게 바꿔 적어요.

```markdown
## What
Adds `pg_token` to the payment rule's parameter names.

## Why
KakaoPay sends the user back to the merchant's approval URL with `pg_token`. Endpoints such as `GET /kakaoPaySuccess?pg_token=` were not tagged `payment`.

## Reference
https://developers.kakaopay.com/docs/payment/online/single-payment

Closes #이슈번호
```

다 적었으면 <kbd>Create pull request</kbd>를 한 번 더 눌러요.

> 주소가 `github.com/owasp-noir/noir/pull/숫자`로 바뀌었고, 초록색 Open 표시가 보여요. PR이 올라갔어요.

### 자동 검사 확인하기

PR 화면 아래쪽에 자동 검사 목록이 생겨요. 이 저장소에 처음 기여하는 계정은 관리자가 허락해야 검사가 시작돼요. 그래서 처음에는 기다리는 중이라고만 나올 수 있어요. 진행자가 차례로 허락할게요.

먼저 볼 검사는 `Tag rule examples`예요. 내 룰의 예시를 하나씩 돌려 보는 검사이고, 1분 안에 끝나요. 빨간 X가 뜨면 Details를 눌러 기록을 열어 보세요. `FAIL` 뒤에 어느 파일의 무엇이 틀렸는지 한 줄로 나와요.

`tests`라는 검사도 같이 돌아요. Noir의 다른 테스트까지 전부 돌리는 검사라 5~8분쯤 걸려요. 이건 기다리지 않아도 돼요.

고칠 게 있으면 PR 화면의 Files changed 탭으로 가요. 파일 오른쪽의 <kbd>…</kbd>를 누르고 Edit file을 고르면 다시 고칠 수 있어요. 저장하면 같은 PR에 반영되고 검사도 다시 돌아가요. PR을 새로 올릴 필요는 없어요.

> `Tag rule examples` 옆에 초록색 체크가 떴어요. `tests`는 아직 돌고 있어도 괜찮아요.

</div>

## 막혔을 때

| 이런 게 보이면 | 이유 | 이렇게 해요 |
|---|---|---|
| `path_segment 'kakao_pay' contains a separator (/ - _ .) and can never match a single segment` | `path_segment`에 `-`, `_`, `.`, `/`가 들어간 단어를 넣었어요. | 그 글자를 빼고 한 단어로 적어요. 주소가 `/kakao-pay`처럼 생겼다면 `kakao`와 `pay`로 나뉘니까, 둘 중 어느 걸 볼지 다시 정해요. |
| `tagged but listed under no_match: GET /kakaopay/login (http)` | `no_match`에 적은 예시에 태그가 붙어 버렸어요. | 예시를 잘못 적었다면 예시를 고쳐요. 예시가 맞다면 넣은 단어가 너무 흔한 거예요. 더 구체적인 단어로 바꿔요. |
| 기록에 YAML 오류와 줄 번호가 나와요 | 줄이 안 맞거나, 탭이 섞였거나, `]`나 `,`가 빠졌어요. | 그 줄과 바로 윗줄을 위 예시와 한 글자씩 비교해 봐요. |
| 검사가 시작되지 않고 기다리는 중이라고만 나와요 | 처음 기여하는 계정은 관리자가 허락해야 검사가 돌아가요. | 기다리면 돼요. 진행자에게 PR 번호를 알려 주세요. |
| 연필 아이콘이 안 눌려요 | GitHub에 로그인이 안 되어 있어요. | 로그인하고 화면을 새로 고쳐요. |

## 2부에서 할 일

쉬는 시간이 끝나면 1부에서 올린 PR의 검사 결과부터 다시 봐요. 그사이 `tests`도 끝나 있을 거예요. 빨간 X가 있으면 위 표를 보고 고쳐요. 초록색 체크를 받았다면 아래에서 다음 할 일을 골라 보세요. 아래로 갈수록 손이 더 많이 가요.

| 할 일 | 설명 |
|---|---|
| 단어 하나 더 | 다른 서비스 이름으로 PR을 하나 더 올려요. 같은 여섯 단계를 반복하면 되고, 두 번째는 훨씬 빨리 끝나요. |
| 새 룰 파일 만들기 | 기존 룰에 넣을 자리가 없으면 [새 파일](https://github.com/owasp-noir/noir/new/main/src/tagger/rules)을 만들어요. 파일 이름은 `key`와 같아야 하고, `match`와 `no_match` 예시가 둘 다 있어야 해요. 전자정부 표준프레임워크가 좋은 후보예요. 공통컴포넌트를 스캔하면 엔드포인트가 1,219개 나오는데, 무슨 일을 하는 주소인지 알려 주는 태그는 25개에만 붙어요. 로그인(`/uat/uia/actionLogin.do`)이나 권한 관리(`/sec/ram/EgovAuthorRoleInsert.do`) 같은 주소에도 태그가 없어요. |
| 써 보고 제보하기 | Noir를 설치해서 직접 돌려 보고, 틀린 곳을 찾아 알려 줘요. [써 보고 제보하기 가이드](@/report.md) |
| 코드로 기여하기 | Noir 코드를 직접 고쳐요. [코드로 기여하기 가이드](@/code.md) |

## PR을 올린 뒤에는

- 마무리 시간에 검사를 통과한 PR 한두 개를 그 자리에서 반영해 봐요. PR이 원본에 반영되는 걸 **머지**라고 해요. 나머지는 행사가 끝난 뒤 PR 댓글로 이야기를 이어 가요. GitHub에서 오는 알림 메일을 확인해 주세요.
- 고쳐 달라는 댓글이 달리면 같은 PR에서 파일을 다시 고치면 돼요.
- 머지되면 다음 Noir 버전에 내가 추가한 단어가 들어가요. 저장소 첫 화면의 기여자 그림에도 내 프로필이 올라가요.
