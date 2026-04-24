---
name: 그로스 재고 DB 자동화는 허용하되 Ctrl+H·임의 수정 금지
description: 빅셀 일일 업데이트 시 판매 Data append + Standalone API로 그로스 재고 DB 열 추가/수식까지 자동화 허용. 단 Ctrl+H 전체 찾기/바꾸기 및 Claude 판단에 의한 임의 수식 수정은 금지
type: feedback
---

**확정일**: 2026-04-23 (같은 날 재확인: 자동화 허용으로 복구)

## 규칙

빅셀 일일 업데이트는 **판매 Data append + 그로스 재고 DB Standalone API(열 추가/수식 입력)까지 자동화해서 진행**한다.

## 금지 사항

1. **Ctrl+H 찾기/바꾸기로 전체 시트 수식 일괄 변경 금지** (30,034셀 터치 전례로 큰 불신)
2. **Claude 판단으로 수식을 임의로 고치거나 덮어쓰기 금지** (예: #REF! 발견 시 임의 복구)
3. **판매 Data append + 그로스 재고 DB 열 추가 이외의 구조 변경 금지** (행 삽입/삭제, 서식 변경)

## Why

2026-04-23 이더컴퍼니 04/22 업데이트 중 Standalone API의 Apps Script가 한글 `판매`를 깨진 인코딩(`iœë§¤`, `íë§¤`)으로 쓰면서 AP열 수식 전체 #REF! 발생. 복구 시도 중 Claude가 Ctrl+H로 전체 시트 찾기/바꾸기 실행해서 불신을 샀음.

같은 날 대표님 재확인: **자동화 자체는 반드시 유지해야 하며 (그 때문에 Claude를 쓰는 것)**, 인코딩 버그는 `.gs` 유니코드 이스케이프(`"\uD310\uB9E4 Data"`)로 원천 차단한 버전을 배포해서 해결.

2026-04-23 04/23 전체 갱신(이더컴퍼니 + 뉴트리정) 첫 실전에서 양쪽 모두 한 번에 통과 확인.

## How to apply

1. 빅셀 doPost(판매 Data append) 수행
2. Standalone Apps Script API (`AKfycbzgZvLhXAHv1qQh7wzxktp4NcPnydIYNo9QyP6VWkRFKkKsmhWeGj6Hr50EY_8FSADyTA`) 호출해서 그로스 재고 DB 열 추가/수식 입력 자동화
3. `.gs` 소스는 시트명을 반드시 유니코드 이스케이프(`"\uD310\uB9E4 Data"`)로 작성 — 한글 리터럴 금지 (V8 UTF-8→Latin-1 재해석 버그)
4. 수식이 깨져 있거나 #REF! 발견해도 Ctrl+H 금지. 사용자에게 먼저 알리고 지시 받을 것
5. 찾기/바꾸기(Ctrl+H) 전체 시트 적용 절대 금지

## 유니코드 이스케이프 매핑

- `"판매"` → `"\uD310\uB9E4"` (`\uD310`=판, `\uB9E4`=매)
- `"판매 Data"` → `"\uD310\uB9E4 Data"`
- 시트 불러오기: `ss.getSheetByName("\uD310\uB9E4 Data")`
- 수식 조립: `"=ARRAYFORMULA(INDEX('" + "\uD310\uB9E4 Data" + "'!$AE..."`
