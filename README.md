# ether-bigcell

빅셀(BigCell) 로켓그로스 매출분석 일일 업데이트 완전 자동화 플러그인 (Claude Code 마켓플레이스).

## 대상 사용자

이더컴퍼니 및 계열 사업자 5개 (이더컴퍼니/뉴트리정/마인플로/클린인테크/이든코퍼레이션) 운영자.

## 기능 개요

`bigcell-daily-update` 스킬이 다음을 자동화합니다:

1. 빅셀(app.bigcell.co.kr)에서 Blob intercept + SheetJS로 로켓그로스 매출분석 엑셀 파싱
2. 반품 행 필터링 + 2026-04-22 추가된 "자체상품코드" 컬럼(col 6) 제거
3. 구글시트 "판매 Data" 탭에 doPost (startRow = max(D열, F열) + 1)
4. 그로스 재고 DB에 Standalone Apps Script API로 새 날짜 컬럼 삽입 + 수식 + 값 변환 + 검증

## 폴더 구조

```
ether-bigcell/
├── .claude-plugin/
│   ├── marketplace.json     # 마켓플레이스 메타
│   └── plugin.json          # 플러그인 메타
├── skills/
│   └── bigcell-daily-update/
│       ├── SKILL.md                 # 스킬 본문 (v2.0.0)
│       └── bigcell-apps-script.gs   # Standalone Apps Script 소스
├── memory/
│   ├── MEMORY.md                       # 인덱스 (4개)
│   ├── bigcell_operation_rules.md      # 15분 목표/KST 전날/비영값 검증/Ctrl+Z,H 금지
│   ├── bigcell_config_companies.md     # 5개 사업자 시트ID/Apps Script URL
│   ├── bigcell_format_rules.md         # D열 YYYY. M. D/자체상품코드 제거/클린인테크 특이
│   └── do_not_touch_formulas.md        # 자동화 허용/임의 수정 금지/유니코드 이스케이프
├── hooks/
│   └── after-install.sh     # 설치 시 memory/ 파일을 사용자 메모리 폴더에 복사
├── CHANGELOG.md
└── README.md
```

## 설치 방법

### PC1 (이더컴퍼니 메인 PC)

이미 설치되어 있음. Claude가 스킬/메모리를 수정하면 git push로 자동 동기화됩니다.

로컬 repo 위치: `C:\Users\이더컴퍼니\Documents\Claude\Projects\김현기\ether-bigcell-plugin`

### PC2 (타 PC에 최초 설치)

#### 1. 환경 변수에 GitHub Token 설정 (1회)

PowerShell을 관리자 권한으로 열고:

```powershell
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "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", "User")
```

PowerShell 재시작해서 `$env:GITHUB_TOKEN` 값이 잡히는지 확인.

#### 2. 로컬에 마켓플레이스 clone (Private repo 우회)

```powershell
$marketplace = "$env:USERPROFILE\Documents\Claude\Plugins\ether-bigcell"
New-Item -ItemType Directory -Force -Path (Split-Path $marketplace -Parent)
git clone "https://x-access-token:$env:GITHUB_TOKEN@github.com/either-cmyk/ether-bigcell.git" $marketplace
```

#### 3. Claude 마켓플레이스에 등록

Claude Code CLI 또는 Cowork에서:

```
/plugin marketplace add C:\Users\<USERNAME>\Documents\Claude\Plugins\ether-bigcell
/plugin install ether-bigcell@ether-bigcell
```

설치 완료 시 `hooks/after-install.sh`가 자동 실행되어 메모리 4개를 로컬 메모리 폴더에 복사합니다.

## 업데이트 흐름

### PC1에서 변경

Claude가 파일 수정 → bash로 자동 commit + push:

```bash
cd /path/to/ether-bigcell-plugin
git add -A
git commit -m "..."
git push
```

(이 과정은 Claude가 알아서 처리합니다)

### PC2에서 업데이트 수령

```powershell
cd $env:USERPROFILE\Documents\Claude\Plugins\ether-bigcell
git pull
```

Claude에서:

```
/plugin marketplace update
/plugin update ether-bigcell
```

after-install.sh가 다시 실행되어 �