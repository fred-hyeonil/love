# 프론트 리포트 API 양식

프론트가 감정 분석 리포트를 받는 경로와 `detailsJson` 구조, 사용처를 정리한 문서입니다.

---

## 1. 리포트를 받는 경로 (자바 → 프론트)

| 경로 | 언제 | 응답 안에 리포트 |
|------|------|------------------|
| `POST /api/conversations/{id}/messages` | 사용자가 USER 메시지 보낼 때 | 응답 body 안에 `report` 필드: `{ summary, detailsJson }` |
| `POST /api/conversations/{id}/report` | '결과 보고서 분석' 버튼 등에서 호출할 때 | 응답 body 전체가 `{ summary, detailsJson }` |

두 경우 모두 다음을 전달합니다.

- **summary** (string): 한 줄 요약
- **detailsJson** (string): JSON 문자열. 파싱 후 `details` 로 사용

프론트에서는 위 두 API 중 하나로 `summary` + `detailsJson` 을 받고, `JSON.parse(detailsJson)` 한 뒤 아래 구조대로 사용합니다.

---

## 2. detailsJson 파싱 후 구조 (details)

자바는 Python에서 받은 `report.details` 전체를 그대로 JSON 문자열로 직렬화해 `detailsJson` 에 넣어 보냅니다.

```ts
const details = JSON.parse(data.detailsJson);
```

파싱 후 구조는 다음과 같습니다.

| 필드 | 설명 |
|------|------|
| **details.userReport** | 사용자 메시지 감정 (summary, counts, messages) |
| **details.assistantReport** | 상대방(AI) 메시지 감정 (summary, counts, messages) |
| **details.userFocusReport** | 사용자 중심 코칭 (아래 참고) |

- **details.userReport / details.assistantReport**  
  - `summary`: string  
  - `counts`: Record<string, number> (감정별 횟수, 막대그래프 등)  
  - `messages`: ReportMessageItem[] (메시지별 text, emotion, scoresPct 등)

---

## 3. userFocusReport · coaching 사용처

**details.userFocusReport** 는 사용자 중심 코칭용 객체입니다.

| 필드 | 타입 | 사용처 |
|------|------|--------|
| **userFocusReport.insights** | string[] (선택) | 관찰 문장 목록. 필요 시 별도 섹션에 표시 |
| **userFocusReport.coaching** | string[] | **"이렇게 말해보면 어때요?"** 섹션의 흰 박스 문장들. **순서대로 그대로 렌더** |
| **userFocusReport.emotionBalance** | 객체 (선택) | `userNegativeRatio`, `assistantNegativeRatio`, `difference`, `sentence` 등 – 감정 밸런스 문구/수치 표기 시 사용 |
| **userFocusReport.volatility** | 객체 (선택) | `transitionCount`, `level`, `sentence` 등 – 감정 기복 문구/수치 표기 시 사용 |

### 3.1 "이렇게 말해보면 어때요?" 섹션

- **표시할 문장**: `details.userFocusReport.coaching` 배열을 **그대로 순서대로** 렌더합니다.
- 이 배열은 **백엔드(Python → 자바)에서 넘겨준 값**이며, 프론트에서는 하드코딩하지 않습니다.
- `coaching` 이 없거나 빈 배열이면, 프론트에서는 "추천 문장이 없어요. 대화를 더 나눠 보면 코칭을 받을 수 있어요." 같은 안내만 표시하면 됩니다.

### 3.2 insights

- `details.userFocusReport.insights`: 관찰 문장 배열. 필요하면 별도 블록에 리스트로 표시할 수 있습니다.

### 3.3 emotionBalance / volatility

- **emotionBalance**: `userNegativeRatio`, `assistantNegativeRatio`, `difference`, `sentence` 등 – 관계 분위기/감정 밸런스 한 줄 요약이나 수치 표시 시 사용.
- **volatility**: `transitionCount`, `level`, `sentence` 등 – 감정 기복(전환 횟수, 수준, 설명 문장) 표시 시 사용.

---

## 4. 한 줄 체크리스트 (프론트)

- [ ] 리포트는 `POST /api/conversations/{id}/report` 또는 메시지 전송 응답의 `report` 로 받는다.
- [ ] `summary` 는 관계 분위기 한 줄 요약 등에 사용한다.
- [ ] `details` = `JSON.parse(detailsJson)` 후, `userReport` / `assistantReport` 로 감정 분포·메시지별 데이터를 쓴다.
- [ ] **"이렇게 말해보면 어때요?"** 문장은 **details.userFocusReport.coaching** 만 사용한다 (하드코딩 없음).
- [ ] `userFocusReport.insights` / `emotionBalance` / `volatility` 는 필요 시 해당 필드로 표기한다.
