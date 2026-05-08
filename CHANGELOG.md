# 변경 이력

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
- Apps Script v5 (유니코드 이스케이프 배포본