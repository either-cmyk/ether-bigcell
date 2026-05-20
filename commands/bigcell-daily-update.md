---
description: 빅셀 일일 업데이트 - 5개 사업자 매출 데이터 자동 동기화
argument-hint: <사업자명?> <날짜?>
---

`skills/bigcell-daily-update/SKILL.md` 를 따라 실행하라.

## $ARGUMENTS 처리

- $ARGUMENTS 에 사업자명이 있으면 해당 사업자 대상 (이더컴퍼니 / 뉴트리정 / 마인플로 / 클린인테크 / 이든코퍼레이션)
- $ARGUMENTS 에 날짜가 있으면 그 날짜로 처리 (예: `5/19`, `2026-05-19`, `5/15~5/17`)
- 비어있으면 사용자에게 사업자와 날짜를 물어볼 것
- 기본 날짜는 KST 기준 전날 하루치

## 실행 순서

1. 빅셀 해당 사업자 계정으로 전환 (`/mypage/members` navigate 시 자동 전환됨)
2. 구글 시트 (해당 사업자) + 빅셀 매출분석 페이지 두 탭 준비
3. SKILL.md 의 1~4단계 실행 (Blob intercept → 파싱 → doPost → Standalone API)
4. 보고: 판매 Data N행 append + 그로스 재고 DB X열 신규
