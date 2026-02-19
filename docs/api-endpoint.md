# Java 서버 API 엔드포인트 정리

프론트엔드(Next.js)가 Java 서버로 호출하는 API를, **표 없이 설명 위주**로 정리한 문서입니다.  
노션에서 그대로 붙여 넣어도 읽기 쉽게 구성했습니다.

---

## 공통 사항

**Base URL**  
- `process.env.NEXT_PUBLIC_API_BASE` 또는 `http://localhost:8080`

**인증**  
- 로그인·회원가입을 제외한 **모든 요청**에 `Authorization: Bearer {accessToken}` 헤더를 붙입니다.
- 토큰은 `localStorage.getItem("accessToken")` 에서 가져오며, `src/lib/api.ts` 의 `apiFetch` 가 자동으로 첨부합니다.

**Content-Type**  
- 요청 body 가 있을 때는 `application/json` 을 사용합니다.

---

## 1. 인증 & 세션

### POST `/api/auth/login` — 로그인

**인증**  
- 필요 없음 (로그인 요청이므로 토큰을 보내지 않음)

**사용하는 화면**  
- `LoginScreen` — 로그인 폼 제출 시

**보내는 것 (Request)**  
- Body: `{ "userId": string, "password": string }`

**받는 것 (Response)**  
- `accessToken`, 그리고 선택적으로 `user`, `partnerType`, `lastConversation`, `lastConversationMessages` 등
- 성공 시 프론트는 `accessToken` 을 저장한 뒤 세션/채팅 등으로 이동합니다.

---

### POST `/api/auth/signup` — 회원가입

**인증**  
- 필요 없음

**사용하는 화면**  
- `SignupScreen` — 회원가입 폼 제출 시

**보내는 것 (Request)**  
- Body: `{ "userId", "password", "name", "birthDate" }`
- `birthDate` 는 `YYYY-MM-DD` 형식(점은 `-` 로 치환해서 전송)

**받는 것 (Response)**  
- 성공 시 2xx, 실패 시 401 등 (예: 이미 존재하는 아이디)

---

### GET `/api/session` — 세션 조회

**인증**  
- 필수 (Bearer 토큰)

**사용하는 곳**  
- ChatScreen 초기화, SurveyScreen, IdealScreen, 세션 갱신이 필요한 여러 화면

**보내는 것 (Request)**  
- 없음 (GET, body 없음)

**받는 것 (Response)**  
- `user`: `{ id, userId, name, birthDate }`
- `partnerType`: `{ isSet, value }` — 성격/파트너 유형이 설정됐는지, 값은 무엇인지
- `lastConversation`: `{ id, title, mode, lastMessageAt }` 또는 `null`
- `lastConversationMessages`: 마지막 대화의 메시지 배열

**프론트 동작**  
- `getSession()` 호출 시 위 응답을 받아 `localStorage` 의 `appSession` 키에 저장하고, `getStoredSession()` 으로 읽어 씁니다.

---

## 2. 성격 유형(테스트 결과) 저장

### POST `/api/test-results/partner-type` — 파트너 유형 저장

**인증**  
- 필수

**사용하는 화면**  
- **SurveyScreen** — 설문 결과 확인 버튼을 눌렀을 때 (설문으로 나온 유형 문자열 저장)
- **IdealScreen** — "내 여자친구 고르기"에서 캐릭터를 선택했을 때 (선택한 캐릭터 id 저장)

**보내는 것 (Request)**  
- Body: `{ "value": string }`
- `value` 에는 저장할 유형 문자열(설문 유형명 또는 캐릭터 id)을 넣습니다.

**받는 것 (Response)**  
- 성공 시 2xx, body 없음. 실패 시 401·409 등 (이미 유형이 설정된 경우 409 등)

**참고**  
- 저장 후 `GET /api/session` 을 다시 호출해서 세션(partnerType 등)을 갱신하는 것을 권장합니다.

---

## 3. 대화(Conversation)

### GET `/api/conversations` — 대화 목록 조회

**인증**  
- 필수

**사용하는 화면**  
- **ChatScreen** — "대화 목록" 버튼을 눌렀을 때 팝업에 목록을 띄울 때

**보내는 것 (Request)**  
- 없음 (GET)

**받는 것 (Response)**  
- 대화 목록 배열: 각 항목은 `{ id, title, mode, lastMessageAt }`

---

### POST `/api/conversations` — 새 대화 생성

**인증**  
- 필수

**사용하는 화면**  
- **ChatScreen** — "새 대화 시작" 버튼 클릭 시, 또는 세션에 lastConversation 이 없을 때 초기 진입 시

**보내는 것 (Request)**  
- Body: `{ "title": string, "scenarioKey"?: string | null, "personaKey"?: string | null }`
- `personaKey` 는 "내 여자친구 고르기"에서 고른 캐릭터 id 또는 세션의 `partnerType.value` 를 넣습니다.

**받는 것 (Response)**  
- `{ "conversationId": number }` — 새로 만들어진 대화 id

---

### GET `/api/conversations/{conversationId}/messages` — 대화 메시지 목록 조회

**인증**  
- 필수

**사용하는 화면**  
- **ChatScreen** — 대화 복원(보고서에서 채팅으로 돌아올 때), 또는 대화 목록에서 특정 대화를 선택했을 때

**보내는 것 (Request)**  
- 없음 (GET). URL 경로에 `conversationId` 를 넣습니다.

**받는 것 (Response)**  
- 메시지 배열. 각 항목: `{ id, conversationId, role, content, clientMessageId, createdAt }`

---

### POST `/api/conversations/{conversationId}/messages` — 메시지 전송

**인증**  
- 필수

**사용하는 화면**  
- **ChatScreen** — 사용자가 메시지를 보내거나, "문장 추천해줘" 등 특수 요청을 할 때

**보내는 것 (Request)**  
- Body: `{ "role": "USER", "content": string, "clientMessageId": string }`
- 프론트에서는 role 을 `"USER"` 만 사용합니다.

**받는 것 (Response)**  
- 자바가 Python 응답을 받을 때까지 대기한 뒤, **한 번에** 내려줍니다 (폴링 없음).
- 형태: `{ "userMessage": MessageResponse, "assistantMessage": MessageResponse }` 또는 단일 `MessageResponse`
- 프론트는 `userMessage` / `assistantMessage` 를 채팅 UI에 바로 반영합니다.

---

## 4. 감정 분석 보고서(Report)

### POST `/api/conversations/{conversationId}/report` — 대화 기준 감정 분석 보고서 요청

**인증**  
- 필수

**사용하는 화면**  
- **ReportScreen** — 결과 보고서 화면. 채팅에서 "대화 종료" 후 `reportConversationId` 를 저장해 두고, 보고서 화면에서 이 id 로 호출합니다.

**보내는 것 (Request)**  
- Body: `{}` (빈 객체). URL 경로에 `conversationId` 를 넣습니다.

**받는 것 (Response)**  
- `{ "summary": string, "detailsJson": string }`
- `detailsJson` 은 JSON 문자열이므로 파싱하면 `details.userReport`, `details.assistantReport`, `details.userFocusReport` 등이 나옵니다.
- `details.userFocusReport.coaching` 이 "이렇게 말해보면 어때요?" 섹션에 표시할 문장 배열입니다 (백엔드에서 전달).

---

### POST `/api/emotion-analysis/conversation-report` — (fallback) 텍스트로 보고서 요청

**인증**  
- 필수

**사용하는 화면**  
- **ReportScreen** — 대화 id 가 없을 때(예: localStorage 에 reportConversationId 가 없을 때) 사용하는 fallback

**보내는 것 (Request)**  
- Body: `{ "userTexts": string[], "assistantTexts": string[] }`
- 사용자 발화 배열과 상대방(AI) 발화 배열을 그대로 보냅니다.

**받는 것 (Response)**  
- 구조는 위의 report 와 동일한 형태 (`summary`, `details` 안에 userReport, assistantReport, userFocusReport 등).

---

## 5. 독립 기능용 채팅 (소개팅 추천 / 카톡 평가 / 진지 상담)

### POST `/api/chat` — 단발성 채팅 요청

**인증**  
- 필수

**사용하는 화면**  
- **RecommendationScreen** — "나를 위한 소개팅 추천"
- **EvaluationScreen** — "카톡 내용 평가받기"
- **CounselingScreen** — "진지하게 상담받기"

채팅 대화(Conversation)와는 별도로, 위 기능들은 모두 이 **단일 엔드포인트**에 `requestType` 으로 구분해서 요청합니다.

**보내는 것 (Request)**  
- Body: `{ "messages": [ { "role": "user", "content": string } ], "requestType": string }`
- `requestType` 예: `"나를 위한 소개팅 추천"`, `"카톡 내용 평가받기"`, `"진지하게 상담받기"`

**받는 것 (Response)**  
- `{ "reply"?: string, "message"?: string }` — 프론트는 `data.reply || data.message` 로 표시합니다.

---

## 6. 기타

### GET `/api/users/me` — 내 정보 조회

**인증**  
- 필수

**사용하는 곳**  
- `/me` 페이지 — 테스트·디버그용으로 "내 정보" 객체를 보여줄 때

**보내는 것 (Request)**  
- 없음 (GET)

**받는 것 (Response)**  
- 사용자 정보 객체 (백엔드에서 정의한 구조)

---

## 엔드포인트 한눈에 (메서드 + 경로 + 용도)

- **POST** `/api/auth/login` — 로그인  
- **POST** `/api/auth/signup` — 회원가입  
- **GET** `/api/session` — 세션 조회  
- **POST** `/api/test-results/partner-type` — 성격/파트너 유형 저장  
- **GET** `/api/conversations` — 대화 목록 조회  
- **POST** `/api/conversations` — 새 대화 생성  
- **GET** `/api/conversations/{id}/messages` — 대화 메시지 목록 조회  
- **POST** `/api/conversations/{id}/messages` — 메시지 전송 (USER + ASSISTANT 응답)  
- **POST** `/api/conversations/{id}/report` — 대화 감정 분석 보고서 요청  
- **POST** `/api/emotion-analysis/conversation-report` — (fallback) 텍스트로 보고서 요청  
- **POST** `/api/chat` — 소개팅 추천 / 카톡 평가 / 진지 상담  
- **GET** `/api/users/me` — 내 정보 조회  

---

## 프론트 코드에서 어디서 쓰나요?

- **공통 호출**  
  - `src/lib/api.ts` — `apiFetch`, `login`, `getSession`, `postPartnerType`, `getConversations`, `createConversation`, `getConversationMessages`, `sendConversationMessage`, `fetchConversationReportByConversationId`, `fetchConversationReport`

- **로그인**  
  - `src/screens/LoginScreen/index.tsx` — `login()`

- **회원가입**  
  - `src/screens/SignupScreen/index.tsx` — `apiFetch("/api/auth/signup", ...)`

- **설문 / 성격 유형**  
  - `src/screens/SurveyScreen/index.tsx` — `postPartnerType`, `getStoredSession` / `getSession`

- **내 여자친구 고르기**  
  - `src/screens/IdealScreen/index.tsx` — `postPartnerType`, `getSession`

- **채팅**  
  - `src/screens/ChatScreen/index.tsx` — 세션, 대화 목록/생성/메시지 조회·전송

- **결과 보고서**  
  - `src/screens/ReportScreen/index.tsx` — `fetchConversationReportByConversationId` 또는 `fetchConversationReport`

- **소개팅 추천**  
  - `src/screens/RecommendationScreen/index.tsx` — `POST /api/chat`

- **카톡 평가**  
  - `src/screens/EvaluationScreen/index.tsx` — `POST /api/chat`

- **진지 상담**  
  - `src/screens/CounselingScreen/index.tsx` — `POST /api/chat`

- **내 정보**  
  - `src/app/me/page.tsx` — `GET /api/users/me`

---

## 노션 플로우 문서와의 일치 여부 (확인 결과)

아래 내용은 “1. 인증 & 세션 초기화” ~ “5. FE 전체 플로우 요약” 노션 문서와 현재 프론트 구현을 비교한 결과입니다.

**전체적으로 문서와 일치합니다.**

- **1. 로그인**  
  - Request `{ userId, password }` 그대로 전송.  
  - Response는 문서에는 `accessToken`만 적혀 있으나, 프론트는 `accessToken` 외에 `user`, `partnerType`, `lastConversation`, `lastConversationMessages`가 오면 로그인 직후 세션/라우팅에 활용합니다. (문서와 충돌 없음)

- **2. 세션 조회**  
  - `GET /api/session` 호출.  
  - Response 구조(`user`, `partnerType`, `lastConversation`, `lastConversationMessages`) 및 FE 역할(프로필, partnerType.isSet으로 테스트 스킵, lastConversation으로 이어하기, lastConversationMessages로 채팅 렌더) 모두 문서와 동일하게 동작합니다.

- **3. 여친 유형 저장**  
  - `POST /api/test-results/partner-type` Body `{ value }`, 성공 시 body 없음.  
  - 409 시 “이미 유형이 설정되어 있습니다” 표시.  
  - 저장 성공 후 `GET /api/session` 재호출로 상태 반영.  
  - `GET /api/bootstrap`는 사용하지 않음(문서상 선택 사항).

- **4. 대화**  
  - `GET /api/conversations` → 목록.  
  - `POST /api/conversations` → Body `{ title, scenarioKey?, personaKey? }`, Response `{ conversationId }`.  
  - FE는 `title: "새 대화"`, `scenarioKey: null`, `personaKey`는 캐릭터 id 또는 `partnerType.value`로 전송합니다.

- **5. 메시지**  
  - `GET /api/conversations/{id}/messages` → 전체 메시지로 채팅 렌더.  
  - `POST /api/conversations/{id}/messages` → Body `{ role: "USER", content, clientMessageId }`.  
  - 응답은 단일 `MessageResponse` 또는 `{ userMessage, assistantMessage }`(AddMessageResponse) 모두 처리하며, 문서의 “같은 API로 ASSISTANT 내려주는 확장”과 일치합니다.

**요약:** 문서에 적힌 URL·Request/Response·FE 플로우와 현재 구현이 일치합니다. 로그인 Response에 추가 필드가 있어도 호환되며, bootstrap은 미사용입니다.
