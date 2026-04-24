---
name: bigcell-daily-update
description: 빅셀(BigCell) 로켓그로스 매출분석 엑셀 다운로드 → 반품 제거 → 자체상품코드 컬럼 제거 → 구글시트 판매 Data append → 그로스 재고 DB 날짜 컬럼 삽입(Standalone API)까지의 일일 데이터 업데이트 완전 자동화 스킬. 반드시 이 스킬을 사용해야 하는 경우 "빅셀 업데이트", "빅셀 일일", "매출분석 업데이트", "그로스 시트 업데이트", "빅셀 데이터 넣어줘", "이더컴퍼니 업데이트", "뉴트리정 업데이트", "클린인 업데이트", "마인플로 업데이트", "이든코퍼레이션 업데이트" 등 빅셀 매출 데이터를 구글시트에 반영하는 모든 요청. 사용자가 "빅셀"이나 회사명 + "업데이트/시트/데이터" 키워드를 언급하면 이 스킬을 사용할 것.
---

# 빅셀 일일 업데이트 스킬 (v2.0.0 - 2026-04-24 확정본)

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

## 1단계: 빅셀 Blob intercept + 엑셀 파싱 + 자체상품코드 제거

### 1-1. 빅셀 접속 + 로그인

1. `app.bigcell.co.kr` 접속, 해당 회사 계정으로 로그인
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

### 4-1. API 호출 (구글 도메인 탭에서 실행)

```javascript
(async function(){
  var url = "https://script.google.com/macros/s/AKfycbzgZvLhXAHv1qQh7wzxktp4NcPnydIYNo9QyP6VWkRFKkKsmhWeGj6Hr50EY_8FSADyTA/exec";
  var payload = {
    sheetId: '해당회사시트ID',
    date: '2026. 4. 23'
  };
  var r = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'text/plain'},
    body: JSON.stringify(payload),
    redirect: 'follow'
  });
  return await r.text();
})()
```

### 4-2. 응답 해석

**정상 응답 (새 컬럼 삽입됨):**
```json
{
  "status": "ok",
  "newCol": 43, "newLetter": "AQ",
  "oldCol": 44, "oldLetter": "AR",
  "date": "2026. 4. 23",
  "formulaRow": 3, "lastRow": 55,
  "newNonZero": 72, "oldNonZero": 71,
  "formula": "=ARRAYFORMULA(INDEX(...))"
}
```

**중복 방지 (이미 같은 날짜 존재):**
```json
{
  "status": "skip",
  "message": "이미 동일 날짜 컬럼 존재",
  "date": "2026. 4. 23",
  "latestStr": "2026. 4. 23",
  "latestCol": 42,
  "latestLetter": "AP"
}
```

**에러:**
```json
{
  "status": "error",
  "message": "에러 메시지"
}
```

### 4-3. 검증 기준

- `newNonZero`와 `oldNonZero`가 비슷한 수준 → **정상** (일별 판매 변동으로 약간의 차이 정상)
- `newNonZero`가 **0** → 수식 오류 또는 날짜 포맷 불일치. 판매 Data에 해당 날짜 데이터 확인
- 상단 행만 보고 ₩0이라서 타입 오류라고 성급히 판단 금지 — 판매량 0 상품은 정상적으로 0 표시

### 4-4. 타임아웃 대응 (매우 중요)

Apps Script 실행이 45초를 넘으면 클라이언트 측 CDP 타임아웃 발생. **서버에서는 계속 실행된다.**

**대응 패턴**:
1. 타임아웃 발생
2. 30~45초 대기
3. **같은 payload로 재호출** → `status: 'skip'` 응답이면 첫 호출이 성공적으로 완료된 것
4. 또는 gviz로 AP/AN 등 신규 컬럼 비영값 개수 확인

```javascript
// 타임아웃 후 재확인 (동일 payload 재전송)
// 결과가 "skip"이면 첫 호출 완료됨
```

### 4-5. 컬럼 삭제 (롤백용)

잘못 삽입된 컬럼을 삭제해야 할 경우:

```javascript
(async function(){
  var url = "https://script.google.com/macros/s/AKfycbzgZvLhXAHv1qQh7wzxktp4NcPnydIYNo9QyP6VWkRFKkKsmhWeGj6Hr50EY_8FSADyTA/exec";
  var payload = {
    sheetId: '해당회사시트ID',
    action: 'deleteCol',
    col: 43
  };
  var r = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'text/plain'},
    body: JSON.stringify(payload),
    redirect: 'follow'
  });
  return await r.text();
})()
```

### 4-6. D열 날짜 정규화 (클린인테크 전용)

클린인테크 등 D열에 Date 객체/텍스트 혼재 시 강제 정규화:

```javascript
var payload = {
  sheetId: '1AVPuPo7rkT-K923BOl2vFe5aKAHJE7bUNZM0kQ0w_PE',
  action: 'normalizeDColumn',
  startRow: 2  // 생략 시 2
};
```

결과는 `{normalized, skipped, empty}` 카운트 반환.

## 금지 사항 (Ctrl+H 사고 이후)

1. **Ctrl+H 찾기/바꾸기로 전체 시트 수식 일괄 변경 금지** — 30,034셀 터치 전례로 불신
2. **Claude 판단으로 수식을 임의로 고치거나 덮어쓰기 금지** (예: #REF! 발견 시 임의 복구)
3. **판매 Data append + 그로스 재고 DB Standalone API 이외의 구조 변경 금지** (행 삽입/삭제, 서식 변경)
4. **Ctrl+Z 금지** — UI 실수 시 되돌리기로 완료 작업 날아가는 사고 반복. 잘못 눌렀으면 Escape + 상태 재확인

**허용**: 판매 Data append + Standalone API(열 추가/수식 입력)까지의 자동화는 **반드시 유지**한다 (2026-04-23 대표님 재확인). Apps Script 인코딩 버그는 `.gs` 소스에 유니코드 이스케이프(`"\uD310\uB9E4 Data"`)로 원천 차단된 버전을 배포해서 해결.

## 주의사항 총정리

1. **startRow는 D열+F열 max + 1**: 한쪽만 보면 덮어쓰기 사고
2. **날짜 포맷은 YYYY. M. D**: 공백 있음, 모든 사업자 동일 (텍스트 그대로, Date 변환 금지)
3. **자체상품코드 컬럼 제거**: `row.slice(0,6).concat(row.slice(7))` 필수 (2026-04-22 변경)
4. **수식은 고정 템플릿**: 컬럼 레터와 행번호만 자동 생성, 구조 변경 금지
5. **그로스 재고 DB는 API로 처리**: UI 조작 사용 금지
6. **CORS**: gviz와 Standalone API 호출은 구글 도메인 탭에서만 실행
7. **검증은 비영값 개수로**: newNonZero/oldNonZero 비교 또는 gviz COUNT
8. **중복 방지 내장**: 같은 날짜로 다시 호출하면 자동 skip
9. **타임아웃 = 서버 실행 중**: 45초 타임아웃 시 30초 후 재호출 or gviz 확인
10. **클린인테크 row[3] 금지**: I열 SKU ID 파괴 — 분기 처리 필수
11. **시트명 유니코드 이스케이프**: V8 UTF-8 재해석 버그 원천 차단
12. **Ctrl+H / Ctrl+Z 절대 금지**: 과거 사고 전례

## 첨부 파일

- `bigcell-apps-script.gs`: Standalone Apps Script 소스 (v5, 유니코드 이스케이프 적용)
  - 배포 URL: `https://script.google.com/macros/s/AKfycbzgZvLhXAHv1qQh7wzxktp4NcPnydIYNo9QyP6VWkRFKkKsmhWeGj6Hr50EY_8FSADyTA/exec`
  - 타 PC에서 자체 배포 시: Apps Script > 새 프로젝트 > 내용 붙여넣기 > 배포 > 웹 앱 (실행: 나, 액세스: 모든 사용자) > URL 저장
