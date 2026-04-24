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

## 설치 방법 (이 PC, 타 PC 공통 — PowerShell 1회 실행)

PowerShell을 열고 아래 **한 덩어리** 를 그대로 복붙해서 실행하세요:

```powershell
$pat_b64 = "Z2l0aHViX3BhdF8xMUNDUDNVWlkwTjJyVG1URGd0cWkyX0g3M2hUTmgxQ0pudmo4QW1ISE5tTnVzMEp4MEFnOWhXRUVFWnE2N0ZMMkFKTVJCSlMyNVBybEoyTFdR"
$pat = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($pat_b64))
$tmp = "$env:TEMP\ether-bigcell-setup"
if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
git clone "https://x-access-token:$pat@github.com/either-cmyk/ether-bigcell.git" $tmp
& "$tmp\scripts\install.ps1"
```

스크립트가 자동으로:
1. Node.js 존재 확인 (없으면 설치 안내)
2. Git credential에 내장 PAT 등록 (Private repo 자동 인증)
3. Claude Code CLI 전역 설치 (`npm install -g @anthropic-ai/claude-code`)
4. `ether-bigcell` 마켓플레이스 등록 + 플러그인 설치
5. Cowork 재시작 안내

실행 후 Cowork Desktop을 완전 종료(트레이 Quit)하고 재시작하면 `bigcell-daily-update` 스킬이 자동 로드됩니다.

## 업데이트 (PC1, PC2 모두 동일)

Claude가 이 repo에 push한 뒤, PowerShell에서:

```powershell
claude
```

을 실행하고 열린 CLI 안에서:

```
/plugin update ether-bigcell
```

한 줄만 치면 최신본 pull 완료. Cowork 다음 대화부터 반영.

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

after-install.sh가 다시 실�