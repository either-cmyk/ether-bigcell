---
name: 빅셀 회사별 설정 (5개 사업자 시트ID·Apps Script URL)
description: 5개 사업자(이더컴퍼니/뉴트리정/마인플로/클린인테크/이든코퍼레이션)의 구글시트 ID, 판매 Data doPost(단일 hg.kim URL+sheetId), 그로스 재고 DB Standalone API URL 집약
type: reference
---

## 모든 사업자 공통 설정 (2026-04-15 통일 완료)

- 판매 Data gid: `1453058054`
- **판매 Data doPost (5사 공용, hg.kim 배포)**: `https://script.google.com/macros/s/AKfycbxZ6SCV0k98aVdqfg5t11KlTAt2JPSM-PDqKp94x0oEIXQllumH3OEqAjDEG5x7FQLs/exec` — payload에 `sheetId` 지정. openById(sheetId)로 각 시트 '판매 Data' F열부터 기록+D열 날짜. 실행=hg.kim@either.co.kr(워크스페이스, 익명허용)
- 날짜 포맷: `YYYY. M. D` (공백 있음, 월/일 앞자리 0 없음)
- 컬럼 처리: **시트 헤더(판매 Data F~AX 45필드) 이름기준 매핑** (slice 고정제거 금지)
- 수식 템플릿: `=ARRAYFORMULA(INDEX('판매 Data'!$AE$1:$AE$63111, MATCH(1, ('판매 Data'!$J$1:$J$63111=$E{row})*('판매 Data'!$D$1:$D$63111={colLetter}$2), 0)))`

## 사업자별 설정

### 이더컴퍼니
- 시트 ID: `1pfikkAKbYOtgxIjFZYtwa1G4CIQLnMcbw2OaZTiWUuU`
- D열/F열 행수 비슷 (안전)

### 뉴트리정
- 시트 ID: `1Fai97aHOhzY5lPBpQBo8d1ji32oaaX5q6_3TgQKHWzE`
- ⚠️ **D열에 빈 행이 매우 많음** (2026-04-15 이전: D=196 vs F=291). 반드시 max(D,F) 사용
- 2026-04-15 전체 통일 완료 (과거 공백 없는 날짜 481개 변환됨)

### 마인플로
- 시트 ID: `12eHkB_6cGvEM5EYfDontmxEM1WgIsBSDPVHNRTsWeII`
- D열/F열 행수 비슷 (안전)

### 클린인테크 ⚠️ 특이 처리 필수
- 시트 ID: `1AVPuPo7rkT-K923BOl2vFe5aKAHJE7bUNZM0kQ0w_PE`
- D열/F열 행수 비슷 (안전)
- **row[3] 덮어쓰기 절대 금지** (I열 SKU ID 파괴) — 원본 SKU ID 유지
- D열 날짜는 별도로 채워야 함 (사용자 수동 or Standalone API의 normalizeDColumn 액션)

### 이든코퍼레이션
- 시트 ID: `1ow9OBUrjJYjtuANyGBRCCEqkktfUwwKVk8oyv6oypbY`
- D열/F열 행수 동일 (안전)

## 그로스 재고 DB Standalone Apps Script (5개 사업자 공용)

- **URL**: `https://script.google.com/macros/s/AKfycby2JKRW6hBypZve_E8O6HbmXP5o8crRfwGvGGeNNVmuJqoE8vtDYyRrmQCzjYEcwBOM/exec`
- 실행 계정 = hg.kim@either.co.kr (2026-06-10 이전 완료). 코드는 본 플러그인 bigcell-apps-script.gs와 동일
- sheetId 파라미터로 대상 구분
- 코드 소스: 본 플러그인의 `skills/bigcell-daily-update/bigcell-apps-script.gs`

### Standalone API 액션

| action | payload | 동작 |
|--------|---------|------|
| (기본) | `{sheetId, date}` | 새 날짜 컬럼 삽입 + 수식 + 값변환 + 검증 |
| `deleteCol` | `{sheetId, action:'deleteCol', col:N}` | 컬럼 삭제 (롤백용) |
| `normalizeDColumn` | `{sheetId, action:'normalizeDColumn', startRow:N}` | D열 Date/텍스트 혼재를 Date 객체로 정규화 |

### Standalone API 응답 상태

- `ok`: 새 컬럼 생성 완료, newNonZero/oldNonZero 반환
- `skip`: 이미 같은 날짜 컬럼 존재 (중복 방지 내장)
- `error`: message 포함

### 타임아웃 대응 (중요)

클라이언트 45초 타임아웃이 발생해도 **서버는 계속 실행 중**. 30~45초 대기 후 같은 payload로 재호출 → `skip` 응답이면 첫 호출 성공 완료.
