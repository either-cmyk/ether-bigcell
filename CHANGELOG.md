# 변경 이력

## v2.4.2 (2026-08-24) — 검증 기준 보정 + 재기록 경계 확인 규칙

### SKILL.md v2.4.2
- 0-M 검증 보정: SKU 채움수 검증은 사업자별 정상 기준 상이 (클린인테크는 343행 중 203만 채움이 정상 — "채움수=행수" 오탐 수정, 기존 날짜 대조 방식으로)
- 사업자별 일일 행수 참고표 추가 (이더 1,020 / 클린인 343 / 마인플로 268 / 뉴트리정 166 / 이든 153)
- 0-N 신설: 과거 날짜 재기록 시 COUNT 계산 경계는 1행 어긋날 수 있음 — range probe 실측 필수 + 재기록 후 행수 일치 검증 (이든 8/19 잔존 행 사고)
- 참고: 8/19~20 컬럼 밀림은 5개 사업자 전체에서 발생·복구 완료 (2026-08-24)


## v2.4.1 (2026-08-24) — 빅셀 컬럼 2026-08 재변경 대응 + 파싱 무결성 검증 의무화

### SKILL.md v2.4.1
- 0-M 신설: 빅셀 엑셀 헤더 재변경(운영상태·자체상품코드·금액컬럼 추가, 쿠팡품절예상일 개명·이동) 문서화
- 파싱 직후 의무 검증 4종: AE 합 정상범위 / 상품명 브랜드 포함수=행수 / SKU ID 채움수=행수 / 쿠팡재고 비영수
- 사고 기록: 뉴트리정 8/18~20 컬럼 밀림(상품명←옵션ID, 판매수량←매출) → 재기록 복구


## v2.4.0 (2026-07-15) — 이더 일일 보고서 자동 생성 + 운용 안전장치 3종

### SKILL.md v2.4.0
- **5단계 신설: 이더컴퍼니 일일 판매 비교 보고서 자동 생성** — 갱신 완료 후 자동으로 HTML 보고서 생성 (요약 카드 / 상품별 비교표 / 증감 TOP / 전략 코멘트). 전략 코멘트에 집중 추천 상품·발주 경고·점검 대상 필수 포함. 추이는 그로스 재고 DB 일별 컬럼 사용
- 0-J. 재고 필드 전부 0이면 전송 전 재다운로드 (7/3 이더 실증 — 빅셀 동기화 지연 스냅샷)
- 0-K. 판매 Data 사용자 정리 후 행 부족(<63,111) 대응 — doPost 실패/새 수식 #REF 예방
- 0-L. 그로스 API 타임아웃 재호출 전 gviz 헤더 확인 — 중복 빈 컬럼 삽입 방지 (7/13 사고)
- 주의사항 총정리 18~20 추가


## v2.3.3 (2026-06-30)
- 번들 Apps Script v10: action:'updateByValue' 추가. 무거운 시트(이더)용 — 새 날짜컬럼 삽입 + 당일 판매수량을 값으로 직접 채움(수식 전체 재계산 없음 → insert 타임아웃/수동 fill 제거).

## v2.3.2 (2026-06-30)
- 번들 Apps Script v8→v9: detectOptionCol에 sheetId별 옵션ID 열 맵(이더/마인플로/클린인/이던=E, 뉴트리정=F) + 여러행 다수결 자동감지. 이더에서 옵션ID를 F(SKU)로 오판하던 버그 수정(그로스 06/29 컬럼 값 0 현상 해결).

## v2.3.1 - 2026-06-15 (번들 메모리 현행화 — 결과 일관성)

번들 메모리가 옛 directive를 담고 있어 타 PC 설치 시 다른 결과가 날 수 있던 문제 정정:
- **bigcell_format_rules.md**: ❌"텍스트가 정답·normalizeDColumn 금지" 폐기 → 클린인테크는 doPost 직후 `normalizeDColumn` 필수. 컬럼 처리도 slice 고정제거 → **이름기준 45필드 매핑**으로 교체. 그로스 날짜헤더 **MM/DD 날짜값 표준**(etherizeDates) 명시.
- **bigcell_config_companies.md**: 그로스 **옵션ID 매칭열이 사업자별 상이**(뉴트리정 F / 나머지 E, API v6+ 자동감지) 표 추가. 수식 템플릿을 v7 `IFERROR(...,0)`로 갱신. API 액션표에 `rewrapLatest`·`etherizeDates` 추가.
- **do_not_touch_formulas.md**: Ctrl+H·임의 수식수정 금지는 Claude 단독판단 기준 — **사용자 명시 요청 시 백업 후 허용** 예외 명시.
- **MEMORY.md**: 인덱스 설명 현행화.


## v2.3.0 - 2026-06-15 (번들 Apps Script v5 → v8: 옵션자동감지·IFERROR·날짜정규화)

- **번들 `bigcell-apps-script.gs`를 v5 → v8로 교체** (배포는 같은 프로젝트 새 버전이라 URL 불변: `AKfycby2JKRW6hBypZve...`).
  - **v6**: 그로스 일별판매 수식의 옵션ID 매칭 컬럼 **자동감지**(11자리 숫자 탐지). 뉴트리정만 F열, 이더/마인플로/클린인/이든은 E열인데 v5가 `$E` 하드코딩이라 뉴트리정 매칭 0이던 버그 해결.
  - **v7**: 날짜 컬럼 수식을 `IFERROR(INDEX/MATCH, 0)`으로 감쌈 → 그날 판매 0(빅셀 export에 행 없음)인 상품이 `#N/A` 대신 **0** 표시. `action:'rewrapLatest'` 추가(이미 삽입된 최신 날짜열을 IFERROR로 재작성).
  - **v8**: `action:'etherizeDates'` 추가 → 날짜 헤더가 텍스트(`2026. M. D`)·MM/DD 혼합인 시트(클린인테크)를 이더 스타일(전부 MM/DD 날짜값)로 정리. ①gid0 백업 탭 복사 ②최신 날짜열 수식→값 freeze ③row2 날짜헤더→Date값+`mm/dd` 형식. 판매Data D·다른 수식·일일 파이프라인 무변경.
- GET 응답 `type` 이 `standalone-growthDB-v8` 로 변경됨.


## v2.2.0 - 2026-06-10 (hg.kim 계정 이전 + 이름기준 컬럼 매핑)

- **Apps Script 배포 계정 이전**: 개인계정(rlagusrl31) → 회사 워크스페이스 hg.kim@either.co.kr
  - 판매 Data doPost: 5개 사업자 per-company URL → **단일 URL + sheetId 파라미터** 방식으로 통합 (openById(sheetId))
  - 그로스 재고 DB API: 새 hg.kim 배포 URL로 교체 (인터페이스 동일)
  - either.co.kr 워크스페이스 웹앱 "모든 사용자(익명)" 액세스 허용 확인
- **컬럼 처리 로직 전면 교체**: slice 고정제거 → **시트 헤더(판매 Data F~AX 45필드) 이름기준 매핑**
  - 빅셀이 컬럼 추가(운영상태/본사발주검토금액 등)·재배치(품절예상일 위치)해도 자동 정렬
  - N번째 동일이름 매칭(이익금 중복 대응) + 품절예상일↔쿠팡품절예상일 부분매칭
  - 검증: 판매수량(AE)이 전 행 채워지는지 (적게 채워지면 정렬 깨진 것)
- payload에 sheetId 키 추가 (판매 Data doPost)


## v2.1.0 - 2026-05-22 (클린인테크 D열 날짜타입 정규화 단계 추가)

### SKILL.md v2.3.0
- 3-3절을 "클린인테크 D열 날짜타입 정규화 (필수)"로 재작성:
  - 클린인테크 doPost는 D열을 **텍스트**로 기록 → 그로스 재고 DB 날짜 헤더(날짜값)와 매칭 실패(newNonZero=0)하는 근본 원인 규명
  - 이더/뉴트리정은 doPost가 D열을 **날짜값**으로 기록 → 정상 매칭
  - **해결**: doPost 직후 4단계 전에 `normalizeDColumn`(그날 startRow만) 호출 → D열 텍스트→날짜값 변환, 5개 사업자 공통 단계
  - SKU ID(I열)·옵션ID(J열)는 정상 기록되므로 과거 row[3] 우려 해소
- 4단계 시작부에 "normalizeDColumn 선행" 경고 추가
- 실증(2026-05-22): 클린인테크 5/21 정규화 후 그로스 DB AP 컬럼 newNonZero 0 → 93 복구

## v2.0.0 - 2026-05-20 (실전 운용 노하우 통합 + 마켓플레이스 GitHub URL 통합)

### SKILL.md v2.2.0
- "실전 운용 노하우 (2026-05 통합)" 섹션 신규 — 약 1개월 운용에서 굳어진 패턴 정리:
  - 0-A. 빅셀 사업자 계정 전환 트릭 (`/mypage/members` navigate로 자동 전환)
  - 0-B. 다운로드 클릭 재시도 패턴 (알림 닫기 + 2~3회 클릭)
  - 0-C. gviz 캐시 우회 (`&_t=Date.now()` dummy param)
  - 0-D. Chrome 탭 freeze + 새 탭 우회 (Apps Script 호출 후 V8 unresponsive)
  - 0-E. Standalone API 타임아웃 대응 (45초 후 동일 payload 재호출 → `skip` 응답이면 완료)
  - 0-F. 사업자별 그로스 재고 DB 신규 컬럼 위치 참고표
  - 0-G. 시트 사용자 임의 정리 대응 (gviz로 startRow 재계산)
  - 0-H. 이더컴퍼니 그로스 DB 1055행 경계 (스마트스토어 영역 분리)
  - 0-I. 뉴트리정/클린인테크 D열 포맷 변형 대응
- "주의사항 총정리" 13~17번 추가 (gviz 캐시, 타임아웃 정상, 계정 전환, 다운로드 재시도, 탭 freeze)

### 마켓플레이스 표준화
- `marketplace.json` `source` 를 GitHub URL 방식으로 통일 (`{"source":"url", "url":"https://github.com/either-cmyk/ether-bigcell.git"}`) — 타 PC에서 `/plugin marketplace add either-cmyk/ether-bigcell` 한 줄로 설치 가능
- `plugin.json` 에 `commands` 필드 명시
- `commands/bigcell-daily-update.md` 슬래시 명령 정비 (들여쓰기 깨짐 수정)

### README 재작성
- 마켓플레이스 설치 흐름 (npm → claude CLI → `/plugin marketplace add` → `/plugin install`) 정리
- 업데이트 수령(`/plugin marketplace update` + `/plugin update ether-bigcell`) 명시
- 자연어 / 슬래시 명령 사용 예시 추가

## v1.0.6 - 2026-05-08 (업데이트 플로우 테스트용 버전 bump)

- 마켓플레이스 업데이트(`/plugin update ether-bigcell`) 동작 검증을 위한 버전만 bump
- 기능 변경 없음

## v1.0.1 - 2026-04-24 (마켓플레이스 표준 전환)

- `.claude-plugin/marketplace.json` 공식 스키마 준수:
  - `owner`: 객체 → 문자열 (email)
  - `plugins[].source`: `"."` → `"./"` + `$schema`, `category`, `tags` 추가
- `.claude-plugin/plugin.json` author 문자열 변경 + `skills`, `hooks` 필드 명시
- `hooks/after-install.sh` 추가 — 설치/업데이트 시 memory 4개를 사용자 Claude 메모리 폴더에 자동 복사 (POSIX 호환 Win/macOS/Linux)
- `scripts/install.ps1` 제거 (마켓플레이스 방식으로 대체)
- README 재작성 (`/plugin marketplace add` 기준 설치 흐름)

## v1.0.0 - 2026-04-24

### 최초 배포 (플러그인화)

- `bigcell-daily-update` 스킬을 독립 플러그인으로 분리
- 빅셀 관련 메모리 8개 → 4개 통합본으로 재정리
- 기존 SKILL.md 내 오염 복구:
  - `$AE채팅방에:$AE` → `$AE$1:$AE$63111`
  - `{colLetter}이` → `{colLetter}$2`
  - `판매 Data` 수식에서 한글 리터럴 → 유니코드 이스케이프 `"\uD310\uB9E4 Data"` 설명 추가
- 04/23 실전 확정사항 반영:
  - BigCell 자체상품코드 컬럼 (col 6) 제거 로직 (`slice(0,6)+slice(7)`)
  - 타임아웃 후 동일 payload 재호출로 `skip` 응답 확인 패턴
  - 클린인테크 row[3] 덮어쓰기 금지 분기
- Apps Script v5 (유니코드 이스케이프 배포본) 소스 포함
- Windows PowerShell 설치 스크립트 제공
- 타 PC 동기화 지원 (git clone/pull)

### 기반 개선 내역 (v1.0.0 이전 누적)

- 2026-04-15: 5개 사업자 수식 범위 유한화(`$AE$1:$AE$63111`) + 날짜 포맷(`YYYY. M. D`) 통일
- 2026-04-22: BigCell 엑셀 자체상품코드 컬럼 추가 대응
- 2026-04-22: 판매 Data D열 텍스트 `YYYY. M. D` 형식으로 고정
- 2026-04-23: Apps Script 유니코드 이스케이프 적용으로 V8 UTF-8 재해석 버그 원천 차단
- 2026-04-23~24: 그로스 재고 DB Standalone API로 완전 자동화 (자동화 유지 + Ctrl+H 금지 원칙)
