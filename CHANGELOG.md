# 변경 이력

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
  - `plugins[].source`: `"."` → `"./"` + `$schema`, `category`, `tag