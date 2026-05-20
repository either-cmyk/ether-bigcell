---
name: bigcell-daily-update
description: 빅셀(BigCell) 로켓그로스 매출분석 엑셀 다운로드 → 반품 제거 → 자체상품코드 컬럼 제거 → 구글시트 판매 Data append → 그로스 재고 DB 날짜 컬럼 삽입(Standalone API)까지의 일일 데이터 업데이트 완전 자동화 스킬. 반드시 이 스킬을 사용해야 하는 경우 "빅셀 업데이트", "빅셀 일일", "매출분석 업데이트", "그로스 시트 업데이트", "빅셀 데이터 넣어줘", "이더컴퍼니 업데이트", "뉴트리정 업데이트", "클린인 업데이트", "마인플로 업데이트", "이든코퍼레이션 업데이트" 등 빅셀 매출 데이터를 구글시트에 반영하는 모든 요청. 사용자가 "빅셀"이나 회사명 + "업데이트/시트/데이터" 키워드를 언급하면 이 스킬을 사용할 것.
---

# 빅셀 일일 업데이트 스킬 (v2.2.0 - 2026-05-20 실전 운용 노하우 통합)

빅셀(app.bigcell.co.kr) 로켓그로스 매출분석 데이터를 다운로드하여 가공 후 구글시트에 입력하는 일일 업무를 완전 자동화한다.

## 핵심 방법론

1. 빅셀에서 Blob intercept + SheetJS로 브라우저 내 엑셀 파싱 + 반품 필터링 + **자체상품코드(col 6) 제거**
2. gviz로 **D열과 F열 모두** 조회하여 안전한 startRow 확인 (max + 1)
3. doPost로 판매 Data 탭에 데이터 전송 (회사별 Apps Script URL, YYYY. M. D 날짜 포맷)
4. **Standalone Apps Script API**로 그로스 재고 DB 자동 업데이트 (컬럼 삽입 + 수식 채우기 + 값 변환 + 검증)

1~3단계는 브라우저 메모리에서, 4단계는 서버사이드 Apps Script에서 처리. 파일 시스템 접근 불필요.

**목표 소요 시간: 사업자당 15분 이내** (누적 피로 관리 목적)

## startRow 필수 규칙 (절대 변경 금지)

**D열과 F열을 모두 조회하여 max(D행수, F행수) + 1을 startRow로 사용한다.**

사업자에 따라 D열(날짜)에 빈 행이 많을 수 있다 (예: 뉴트리정 D=196행 vs F=291행).
반대로 F열이 더 적을 수도 있다. 어느 한쪽만 보면 기존 데이터를 덮어쓴다.

**실제 사고 사례:**
- D열 10,534행 vs F열 2,083행: F열 기준 시 4/2 데이터가 덮어써져 버전 히스토리 복원
- 뉴트리정 D열 196행 vs F열 291행: D열 기준 시 startRow=197로 계산돼 기존 데이터 영역에 덮어쓰기 발생

## 날짜 범위 규칙 (KST 전날 하루치만)

기본 대상 날짜는 **서울(KST) 기준 현재일 - 1일** 하루치만 처리한다. 예: KST 4/24 실행 → 4/23만 갱신.

- 시트 중간에 빠진 날짜가 보여도 사용자 명시 요청 없으면 건드리지 않는다
- 과거 누락일을 임의로 채우면 발주/재고 계산과 어긋남
- 범위 다운로드(여러 날 합쳐서)는 사용자가 명시 요청할 때만

## 회사별 설정 (5개 사업자, 2026-04-15 전체 통일 완료)

회사명을 지정하지 않으면 반드시 물어볼 것.

| 회사 | 빅셀 계정 | 시트 ID | 판매 Data Apps Script (바운드) |
|------|-----------|---------|------------------------------|
| 이더컴퍼니 | 이더컴퍼니 | `1pfikkAKbYOtgxIjFZYtwa1G4CIQLnMcbw2OaZTiWUuU` | `AKfycbwUSbLqE2VMYyhh9_wUuaqDUa0oGwZntiTMxBruQHtjNydyyeXwIolSSpgUE8Bob1woFg` |
| 뉴트리정 | 뉴트리정 | `1Fai97aHOhzY5lPBpQBo8d1ji32oaaX5q6_3TgQKHWzE` | `AKfycbww_NhWrZOIB6jeOI6jteayITp2cLgq2HS6GDD1QGXNI90b5HmDgF7KqSo-yhEVybYM` |
| 마인플로 | 마인플로 | `12eHkB_6cGvEM5EYfDontmxEM1WgIsBSDPVHNRTsWeII` | `AKfycbwjBYbt6xBN0tZyEOR6G3qtHd1CyGoW4aCF8soVHVWYqAYkiLDbCbMcabl1lJJsnGvnug` |
| 클린인테크 | 클린인테크 | `1AVPuPo7rkT-K923BOl2vFe5aKAHJE7bUNZM0kQ0w_PE` | `AKfycbxbxpiqzuCqyml1PBqM3aG4Okz9Vpg0Eft27nU4Af6Q2KtJGAjmYJHSMoELObnokkMUUA` |
| 이든코퍼레이션 | 이든코퍼레이션 | `1ow9OBUrjJYjtuANyGBRCCEqkktfUwwKVk8oyv6oypbY` | `AKfycbzajDaT-bJwY48ak5v04l1euvIEzpMbQMieVZoQToYjWVQMfCzswQcGN2CyiMJRy7wF` |

- 판매 Data gid (모든 사업자): `1453058054`
- Apps Script URL 형식: `https://script.google.com/macros/s/<ID>/exec`
- 모든 사업자 공통 날짜 포맷: `YYYY. M. D` (공백 있음, 월/일 앞자리 0 없음)

### 그로스 재고 DB Standalone Apps Script (5개 사업자 공용)

- **URL**: `https://script.google.com/macros/s/AKfycbzgZvLhXAHv1qQh7wzxktp4NcPnydIYNo9QyP6VWkRFKkKsmhWeGj6Hr50EY_8FSADyTA/exec`
- **프로젝트**: `https://script.google.com/home/projects/1k16QVe1DpF-GU1t9UwcXDHalRs5Xdzbu5Imf1PUNpLzwTnGvQCZC36zJ/edit`
- 이 URL 하나로 5개 사업자 모두의 그로스 재고 DB 업데이트. `sheetId` 파라미터로 대상 구분
- 타 PC에서 재배포 시 이 스킬의 `bigcell-apps-script.gs` 파일을 Standalone 프로젝트로 deploy 하면 동일 동작

### ARRAYFORMULA 구조 (모든 사업자 공통, 고정)

수식은 모든 사업자에서 동일한 고정 템플릿을 사용한다. 직전 컬럼 수식을 복사하지 않고, 아래 템플릿에서 컬럼 레터와 행번호만 자동 생성한다.

```
=ARRAYFORMULA(INDEX('판매 Data'!$AE$1:$AE$63111, MATCH(1, ('판매 Data'!$J$1:$J$63111=$E{row})*('판매 Data'!$D$1:$D$63111={colLetter}$2), 0)))
```

- `{row}`: 데이터행 번호 (3부터 시작, copyTo로 자동 조정)
- `{colLetter}`: 새로 삽입된 컬럼의 레터 (예: AN, AP 등)
- `판매 Data J열` = `그로스 재고 DB E열` (옵션 ID로 상품 매칭)
- `판매 Data D열` = `그로스 재고 DB 날짜 헤더 {colLetter}$2` (날짜 매칭)
- `판매 Data AE열` = 반환값 (판매 수량)
- 유한범위 `$AE$1:$AE$63111` 사용 (무한범위 `$AE:$AE` 금지 — 2026-04-15 통일 완료)

### 한글 시트명 유니코드 이스케이프 필수 (Apps Script)

Apps Script V8 런타임은 소스 파일 한글을 UTF-8 → Latin-1로 잘못 재해석하는 버그가 있다. `.gs` 소스에 `"판매 Data"` 리터럴을 넣으면 배포 후 `"íë§¤ Data"` 같은 깨진 문자열로 실행된다.

**해결**: 시트명을 반드시 유니코드 이스케이프로 작성.

```javascript
var SHEET_NAME = "\uD310\uB9E4 Data";  // = "판매 Data"
```

본 스킬의 `bigcell-apps-script.gs` 파일은 이미 이스케이프 처리되어 있다.

## 실전 운용 노하우 (2026-05 통합)

수십 일 운용하면서 굳어진 패턴. 이걸 따르면 사업자당 5~15분 안에 끝낸다.

### 0-A. 빅셀 사업자 계정 전환 트릭

빅셀 우측 상단 드롭다운으로 일일이 전환하지 말고 — **`https://app.bigcell.co.kr/mypage/members` 로 navigate 하면 해당 사업자가 멤버로 등록돼 있을 경우 자동 전환된다.** 그 후 다시 매출분석 URL로 navigate.

```
1. navigate(빅셀탭, https://app.bigcell.co.kr/mypage/members)
2. screenshot으로 우측 상단 사업자명 확인 (예: "eithercompany님" / "nutrijung님")
3. navigate(빅셀탭, https://app.bigcell.co.kr/v2/statistics/coupang?q_sale_date_from=YYYY/MM/DD&...)
```

### 0-B. 다운로드 클릭 재시도 패턴

빅셀 페이지 로딩 직후 첫 다운로드 클릭은 종종 실패한다 (blob 미캡처). 원인은 보통:
1. "Claude is active in this tab group" 알림이 다운로드 버튼을 가림 — 좌표 `(905, 671)` 또는 `(905, 719)` 클릭으로 닫기
2. SheetJS 로드 타이밍

**표준 시퀀스 (browser_batch 한 번에)**:
```
1. rehook (window.__downloadBlob = null + URL.createObjectURL 오버라이드)
2. left_click(905, 671)         # 알림 닫기
3. wait(1)
4. left_click(다운로드 ref)      # 첫 시도
5. wait(5)
6. left_click(다운로드 ref)      # 두 번째 시도 (보험)
7. wait(8)
8. javascript: blob 상태 확인
```

blob 없으면 → 알림 다시 닫고 한 번 더 클릭. 보통 3회 안에 캡처됨. 캡처 사이즈가 `~40KB` (뉴트리정) / `~700KB` (이더컴퍼니/마인플로) 정도면 정상.

### 0-C. gviz 캐시 우회

`docs.google.com/spreadsheets/.../gviz/tq?...` 는 강력한 응답 캐시가 있다. doPost 직후 행수 변화 확인 시 캐시된 옛값이 반환될 수 있음.

**해결**: URL에 `&_t=Date.now()` 같은 dummy 파라미터를 붙여 캐시 우회.

```javascript
var t = Date.now();
var url = 'https://docs.google.com/spreadsheets/d/'+sid+'/gviz/tq?tqx=out:csv&gid='+gid+'&tq=SELECT+F+WHERE+F+is+not+null&range=F1:F70000&_t='+t;
```

### 0-D. Chrome 탭 freeze + 새 탭 우회

Apps Script 호출(45초 타임아웃) 후에는 해당 탭의 V8 컨텍스트가 한동안 unresponsive 상태가 된다. CDP `Runtime.evaluate timed out` 반복 발생.

**해결**: 그 시점에 새 탭을 만들고 `https://docs.google.com/` 같은 가벼운 페이지로 navigate해서 gviz 검증을 이어간다. freeze된 탭은 1~2분 후 자연 회복.

```
1. tabs_create_mcp()       # 새 탭 생성
2. navigate(새탭, https://docs.google.com/)
3. wait(3~5)
4. 새 탭에서 gviz fetch 또는 Standalone API 재호출
```

### 0-E. Standalone API 타임아웃 대응 (핵심)

이더컴퍼니/마인플로처럼 시트 행 수가 1만 행 넘는 사업자는 그로스 재고 DB Standalone API가 30~60초 걸린다 → 클라이언트는 항상 45초 타임아웃.

**그러나 서버는 계속 실행 중**. 30~45초 대기 후 동일 payload로 재호출하면:
- `{"status":"skip", "message":"이미 동일 날짜 컬럼 존재", "latestStr":"2026. 5. 19", ...}` → 첫 호출이 정상 완료된 것
- gviz로 F열 행 수가 목표치(`기존 F + filtered.length`)에 도달했는지로도 확인 가능

**doPost도 동일 패턴이 적용된다.** 이더컴퍼니 1279행 doPost는 60~90초 걸리고, 서버에서 단계적으로 행을 채워나간다 (예: F열이 +400씩 증가하는 게 보임).

### 0-F. 사업자별 그로스 재고 DB 신규 컬럼 위치

Standalone API 응답의 `newLetter` 는 사업자/시점마다 다르다. 응답을 그대로 보고하면 됨.

| 사업자 | 2026-05 시점 newLetter |
|--------|------------------------|
| 이더컴퍼니 | `AQ` |
| 뉴트리정 | `AO` |
| 마인플로 | `AQ` (추정) |
| 클린인테크 | `AQ` (추정) |
| 이든코퍼레이션 | `AQ` (추정) |

이 값들은 단순 참고용. 실제로는 API 응답 그대로 사용.

### 0-G. 시트 사용자 임의 정리 대응

사용자가 그로스 DB 또는 판매 Data를 임의로 정리(데이터 삭제)했을 수 있다. **항상 gviz로 D/F 현재 행수를 다시 확인하고 startRow를 재계산**한다. 메모리/이전 응답에 박힌 startRow를 재사용하면 데이터 어긋남.

```
판매 Data가 갑자기 줄었다 = 사용자가 정리한 것. 그대로 새 startRow에 이어붙이면 됨.
```

### 0-H. 이더컴퍼니 그로스 DB 1055행 경계

이더컴퍼니 그로스 재고 DB의 **1055행 아래는 스마트스토어 영역**. 빅셀 자동화 수식이 들어가면 안 됨 (스마트스토어는 별도 매핑 체계). Standalone API가 lastRow까지 채우는 상황이면 나중에 1055행 이하 수식을 별도로 클리어할 필요.

### 0-I. 뉴트리정 클린인테크 빅셀 D열 포맷 변형

기본 포맷은 `YYYY. M. D` (공백 있음, 예: `2026. 5. 19`). 사용자가 시트 정리하면서 `2026.5.19` (공백 없음)로 바꿔 놓는 경우 있음. 그로스 재고 DB 헤더와 매칭되려면 둘 다 같은 포맷이어야 하므로, 둘이 어긋나 있으면 새 데이터는 그로스 DB가 사용하는 헤더 포맷에 맞춰서 보낸다.

---

## 1단계: 빅셀 Blob intercept + 엑셀 파싱 + 자체상품코드 제거

### 1-1. 빅셀 접속 + 로그인

1. `app.bigcell.co.kr` 접속, 해당 회사 계정으로 로그인 (또는 0-A 트릭으로 계정 자동 전환)
2. 좌측 메뉴 **로켓그로스 > 매출 분석** 이동
3. 날짜를 대상 날짜로 설정 (기본: KST 어제)

또는 URL 직접 이동:
```
https://app.bigcell.co.kr/v2/statistics/coupang?q_sale_date_from=YYYY/MM/DD&q_sale_date_to=YYYY/MM/DD&q_product_types=RFM&q_show_type=detail
```

### 1-2. Blob intercept 주입

빅셀 엑셀은 서버 다운로드가 아니라 클라이언트 Blob 생성이다. URL.createObjectURL을 오버라이드한다:

```javascript
var origCreateObjectURL = URL.createObjectURL;
window.__downloadBlob = null;
URL.createObjectURL = function(blob) {
  window.__downloadBlob = blob;
  window.__downloadBlobSize = blob.size;
  window.__downloadBlobType = blob.type;
  return origCreateObjectURL.call(URL, blob);
};
```

### 1-3. SheetJS 로드

```javascript
var s = document.createElement('script');
s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
s.onload = function(){ window.__xlsxLoaded = true; };
document.head.appendChild(s);
```

### 1-4. "엑셀 다운로드" 버튼 클릭

우측 상단의 다운로드 버튼을 클릭하면 `window.__downloadBlob`에 Blob이 캡처된다.

### 1-5. Blob 파싱 + 반품 필터링 + **자체상품코드 컬럼 제거**

**2026-04-22부터 BigCell export에 col 6=자체상품코드가 추가됨.** 판매 Data로 보내기 전 반드시 제거해야 기존 시트 구조(L=판매가)와 일치한다.

BigCell 엑셀 컬럼 구조 (2026-04-22~):
| col | 내용 | 시트 매핑 |
|-----|------|----------|
| 0 | 스토어명 | F |
| 1 | 노출상품ID | G |
| 2 | 상품명 | H |
| 3 | SKU ID | I |
| 4 | 옵션ID | J |
| 5 | 옵션명 | K |
| **6** | **자체상품코드** | **❌ 제거 필수** |
| 7 | 판매가 | L |
| 8 | 원가 | M |
| ... | ... | ... |

```javascript
(async function(){
  var blob = window.__downloadBlob;
  var buf = await blob.arrayBuffer();
  var wb = XLSX.read(buf, {type:'array'});
  var ws = wb.Sheets[wb.SheetNames[0]];
  var allRows = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
  var header0 = allRows[0];
  // col 6이 자체상품코드인지 헤더로 확인
  var col6IsSelfCode = String(header0[6]||'').indexOf('자체') >= 0;
  var filtered = [];
  var skippedEmpty = 0, skippedReturn = 0;
  for(var i=2; i<allRows.length; i++){
    var row = allRows[i];
    if(!String(row[0]||'').trim()){ skippedEmpty++; continue; }
    if(String(row[5]||'').indexOf('반품') >= 0){ skippedReturn++; continue; }
    // 자체상품코드 컬럼 제거
    var stripped = col6IsSelfCode ? row.slice(0,6).concat(row.slice(7)) : row;
    filtered.push(stripped);
  }
  window.__filtered = filtered;
  return JSON.stringify({total: allRows.length, col6IsSelfCode: col6IsSelfCode, count: filtered.length, skippedReturn: skippedReturn, colCount: filtered[0]?filtered[0].length:0});
})()
```

## 2단계: startRow 확인 (D열 + F열 모두 조회)

**CORS 주의**: gviz는 반드시 **구글 도메인 탭**에서 실행한다. 빅셀 탭(app.bigcell.co.kr)에서 실행하면 CORS 에러 발생.

```javascript
(async function(){
  var sid = '시트ID여기';
  var gid = '1453058054';
  var urlD = 'https://docs.google.com/spreadsheets/d/'+sid+'/gviz/tq?tqx=out:csv&gid='+gid+'&tq=SELECT+D+WHERE+D+is+not+null&range=D1:D70000';
  var rD = await fetch(urlD);
  var tD = await rD.text();
  var linesD = tD.trim().split('\n').length;
  var urlF = 'https://docs.google.com/spreadsheets/d/'+sid+'/gviz/tq?tqx=out:csv&gid='+gid+'&tq=SELECT+F+WHERE+F+is+not+null&range=F1:F70000';
  var rF = await fetch(urlF);
  var tF = await rF.text();
  var linesF = tF.trim().split('\n').length;
  var safeStart = Math.max(linesD, linesF) + 1;
  return JSON.stringify({dCount: linesD, fCount: linesF, startRow: safeStart});
})()
```

## 3단계: 판매 Data 탭에 데이터 전송 + 검증

payload 키는 `startRow`, `rows`, `date` 3개만 사용. 다른 키 사용 금지.

### 3-1. 날짜 포맷 생성

```javascript
// 모든 사업자 공통 (YYYY. M. D 공백 있음)
var target = new Date(Date.now() - 86400000);  // 어제 (KST 환경 가정)
var date = target.getFullYear() + '. ' + (target.getMonth()+1) + '. ' + target.getDate();
// 결과: "2026. 4. 23"
```

### 3-2. doPost 전송

```javascript
(async function(){
  var allRows = window.__filtered;
  var url = "해당회사 판매 Data Apps Script URL";
  var startRow = 2단계결과값;
  var date = "YYYY. M. D";
  var payload = { startRow: startRow, rows: allRows, date: date };
  var r = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'text/plain'},
    body: JSON.stringify(payload),
    redirect: 'follow'
  });
  var txt = await r.text();
  return JSON.stringify({status: r.status, response: txt.substring(0,500)});
})()
```

- `Content-Type: text/plain` + `redirect: 'follow'` 사용
- `mode: 'no-cors'`는 응답이 opaque라 성공 확인 불가 — 금지
- **빅셀 탭에서 실행**: fetch는 script.google.com 도메인 허용. gviz와 달리 CORS 문제 없음

### 3-3. 클린인테크 특이 처리 (⚠️ 중요)

**클린인테크 Apps Script는 `row[3]`을 덮어쓰면 I열 SKU ID가 파괴된다.**

- 이더컴퍼니/뉴트리정/마인플로/이든: `row[3] = date` 덮어쓰기 정상 동작
- **클린인테크**: row[3] 원본 유지 필수. D열(날짜)은 별도 입력 필요

클린인테크 전용 처리:
- Apps Script 자체가 row[3]을 I열로 매핑하는 단순 로직 (다른 사업자와 분리)
- doPost 후 D열 날짜가 비어있으면 Standalone API의 `normalizeDColumn` 액션 호출 또는 수동 입력

### 3-4. doPost 결과 검증

전송 후 반드시 gviz로 데이터가 정상 입력되었는지 확인:

```javascript
(async function(){
  var sid = '시트ID여기';
  var gid = '1453058054';
  var urlF = 'https://docs.google.com/spreadsheets/d/'+sid+'/gviz/tq?tqx=out:csv&gid='+gid+'&tq=SELECT+F+WHERE+F+is+not+null&range=F1:F70000';
  var rF = await fetch(urlF);
  var tF = await rF.text();
  var newFCount = tF.trim().split('\n').length;
  return newFCount;
})()
```

- 기준: `newFCount`가 전송 전보다 증가 → 성공
- 증가하지 않았으면 Apps Script URL, payload 형식, startRow 재확인

## 4단계: 그로스 재고 DB 자동 업데이트 (Standalone Apps Script API)

UI 조작 완전 제거. 한 번의 API 호출로 다음을 모두 처리한다:

1. 최신 날짜 컬럼 왼쪽에 새 컬럼 삽입
2. 날짜 헤더 입력 (YYYY. M. D)
3. 고정 수식을 첫 데이터행에 설정
4. 수식을 전체 데이터행에 copyTo
5. 직전 컬럼 수식→값 변환
6. 비영값 개수 검증

**날짜 컬럼 탐지 방식**: 오른쪽→왼쪽 스캔으로 연속 날짜 블록(그로스 재고 DB 섹션)을 정확히 식별. 시트 내 다른 영역에 날짜 형태 값이 있어도 혼동하지 않는다.

### 4-1. API 호출 (구글 도�