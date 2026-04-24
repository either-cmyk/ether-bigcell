# ether-bigcell

빅셀(BigCell) 로켓그로스 매출분석 일일 업데이트 완전 자동화 플러그인.

## 대상 사용자

이더컴퍼니 및 계열 사업자 5개 (이더컴퍼니/뉴트리정/마인플로/클린인테크/이든코퍼레이션) 운영자.

## 기능 개요

`bigcell-daily-update` 스킬이 다음을 자동화합니다:

1. 빅셀(app.bigcell.co.kr)에서 Blob intercept + SheetJS로 로켓그로스 매출분석 엑셀 파싱
2. 반품 행 필터링 + 2026-04-22 추가된 "자체상품코드" 컬럼(col 6) 제거
3. 구글시트 "판매 Data" 탭에 doPost (startRow = max(D열, F열) + 1)
4. 그로스 재고 DB에 Standalone Apps Script API로 새 날짜 컬럼 삽입 + 수식 + 값 변환 + 검증

## 포함 내용

```
ether-bigcell/
├── .claude-plugin/
│   ├── plugin.json          # 플러그인 메타
│   └── marketplace.json     # 마켓플레이스 등록 메타
├── skills/
│   └── bigcell-daily-update/
│       ├── SKILL.md                 # 스킬 본문 (v2.0.0)
│       └── bigcell-apps-script.gs   # Standalone Apps Script 소스 (유니코드 이스케이프 적용)
├── memory/
│   ├── MEMORY.md                       # 메모리 인덱스 (4개)
│   ├── bigcell_operation_rules.md      # 15분 목표·KST 전날·비영값 검증·Ctrl+Z/H 금지
│   ├── bigcell_config_companies.md     # 5개 사업자 시트ID/Apps Script URL/Standalone API
│   ├── bigcell_format_rules.md         # D열 YYYY. M. D·자체상품코드 제거·클린인테크 특이
│   └── do_not_touch_formulas.md        # 자동화 허용·임의 수정/Ctrl+H 금지·유니코드 이스케이프
├── scripts/
│   └── install.ps1          # Windows PowerShell 설치/업데이트 스크립트
├── CHANGELOG.md
└── README.md
```

## 설치 방법

### 최초 설치 (타 PC)

PowerShell을 관리자 권한으로 열고 다음 명령 실행:

```powershell
# 임시 폴더에 clone
$tempDir = "$env:TEMP\ether-bigcell-install"
git clone https://github.com/either-cmyk/ether-bigcell.git $tempDir

# 설치 스크립트 실행
& "$tempDir\scripts\install.ps1"
```

설치 스크립트가 하는 일:
- `%USERPROFILE%\Documents\Claude\Plugins\ether-bigcell` 에 영구 저장소 생성
- Claude 스킬 디렉토리에 스킬 심볼릭 링크(또는 복사) 생성
- 메모리 폴더에 메모리 4개 복사
- Git credential helper 설정 (PAT 포함)

### 업데이트 (기존 설치된 PC)

```powershell
cd "$env:USERPROFILE\Documents\Claude\Plugins\ether-bigcell"
git pull
.\scripts\install.ps1 -UpdateOnly
```

## 사용 방법

Claude에게 다음과 같이 말하면 스킬이 자동 트리거됩니다:

- "빅셀 업데이트 해줘"
- "0423 이더컴퍼니 빅셀시트 갱신해줘"
- "뉴트리정 빅셀 업데이트"
- "빅셀 돌려줘"

회사명을 지정하지 않으면 Claude가 되묻습니다.

## Apps Script 재배포 (그로스 재고 DB Standalone API)

기본 URL은 플러그인에 이미 내장되어 있으며, 5개 사업자 구글시트가 모두 이 URL을 바라봅니다. 타 PC에서 별도로 재배포할 필요 없습니다.

만약 자체 배포가 필요한 경우 (예: URL 교체):

1. `skills/bigcell-daily-update/bigcell-apps-script.gs` 내용을 복사
2. script.google.com > 새 프로젝트 > 코드 붙여넣기
3. 배포 > 새 배포 > 웹 앱 (실행: 나, 액세스: 모든 사용자)
4. 새 URL을 `memory/bigcell_config_companies.md` 에 업데이트

## 버전 히스토리

[CHANGELOG.md](./CHANGELOG.md) 참조.

## 라이선스

Private — 이더컴퍼니 내부 사용.
