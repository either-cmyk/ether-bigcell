/**
 * 빅셀 그로스 재고 DB 업데이트 - 독립형(Standalone) Apps Script v5
 *
 * 날짜 컬럼: 왼쪽=최신, 오른쪽=오래된 순서
 * 오른쪽→왼쪽 스캔으로 연속 날짜 블록(그로스 재고 DB 섹션) 정확히 찾기
 * Date 객체/텍스트 모두 지원
 *
 * 배포 URL: https://script.google.com/macros/s/AKfycby2JKRW6hBypZve_E8O6HbmXP5o8crRfwGvGGeNNVmuJqoE8vtDYyRrmQCzjYEcwBOM/exec
 * 프로젝트: https://script.google.com/home/projects/1k16QVe1DpF-GU1t9UwcXDHalRs5Xdzbu5Imf1PUNpLzwTnGvQCZC36zJ/edit
 */

function doGet(e) {
  return resp({status: 'ready', type: 'standalone-growthDB-v5'});
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (!data.sheetId) return resp({error: 'sheetId 누락'});
    if (data.action === 'deleteCol') return deleteColumn(data);
    if (data.action === 'normalizeDColumn') return normalizeDColumn(data);
    if (!data.date) return resp({error: 'date 누락'});
    return updateGrowthDB(data);
  } catch(err) {
    return resp({status: 'error', message: err.message});
  }
}

/**
 * 판매 Data 시트 D열을 Date 타입으로 정규화.
 * 텍스트 "YYYY. M. D" 또는 기존 Date 값 → new Date(YYYY, M-1, D) 로 통일.
 * 빈 셀이나 파싱 불가능한 값은 그대로 둠.
 */
function normalizeDColumn(data) {
  var ss = SpreadsheetApp.openById(data.sheetId);
  // 시트명 유니코드 이스케이프 (UTF-8 인코딩 버그 회피)
  var sheet = ss.getSheetByName("\uD310\uB9E4 Data");
  if (!sheet) return resp({error: "\uD310\uB9E4 Data \uC2DC\uD2B8 \uC5C6\uC74C"});
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return resp({status: 'ok', normalized: 0, lastRow: lastRow});
  var startRow = (data.startRow && data.startRow > 1) ? data.startRow : 2;
  var numRows = lastRow - startRow + 1;
  if (numRows <= 0) return resp({status: 'ok', normalized: 0, lastRow: lastRow, startRow: startRow});
  var range = sheet.getRange(startRow, 4, numRows, 1);
  var vals = range.getValues();
  var out = new Array(numRows);
  var normalized = 0, skipped = 0, empty = 0;
  for (var i = 0; i < numRows; i++) {
    var v = vals[i][0];
    if (v === '' || v == null) { out[i] = [v]; empty++; continue; }
    if (v instanceof Date) { out[i] = [v]; normalized++; continue; }
    var s = String(v).trim();
    var m = s.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\s*$/);
    if (m) {
      out[i] = [new Date(parseInt(m[1],10), parseInt(m[2],10)-1, parseInt(m[3],10))];
      normalized++;
    } else {
      var m2 = s.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\b/);
      if (m2) {
        out[i] = [new Date(parseInt(m2[1],10), parseInt(m2[2],10)-1, parseInt(m2[3],10))];
        normalized++;
      } else {
        out[i] = [v];
        skipped++;
      }
    }
  }
  range.setValues(out);
  range.setNumberFormat('yyyy. m. d');
  SpreadsheetApp.flush();
  return resp({
    status: 'ok',
    action: 'normalizeDColumn',
    lastRow: lastRow,
    startRow: startRow,
    numRows: numRows,
    normalized: normalized,
    skipped: skipped,
    empty: empty
  });
}

function deleteColumn(data) {
  if (!data.col) return resp({error: 'col 누락'});
  var ss = SpreadsheetApp.openById(data.sheetId);
  var sheet = getGid0Sheet(ss);
  if (!sheet) return resp({error: 'gid=0 시트 없음'});
  var colVal = sheet.getRange(2, data.col).getValue();
  sheet.deleteColumn(data.col);
  return resp({status: 'ok', action: 'deleteCol', deletedCol: data.col, deletedValue: dateToStr(colVal)});
}

/** Date 객체를 'YYYY. M. D' 형식 텍스트로 변환 */
function dateToStr(v) {
  if (v instanceof Date) {
    return v.getFullYear() + '. ' + (v.getMonth() + 1) + '. ' + v.getDate();
  }
  return String(v).trim();
}

/** 셀 값이 날짜인지 판단 */
function isDateValue(v) {
  if (v == null || v === '') return false;
  if (v instanceof Date) return true;
  var s = String(v).trim();
  return /^\d{4}\.\s*\d{1,2}\.\s*\d{1,2}$/.test(s);
}

function updateGrowthDB(data) {
  var date = data.date.trim();
  var ss = SpreadsheetApp.openById(data.sheetId);
  var sheet = getGid0Sheet(ss);
  if (!sheet) return resp({error: 'gid=0 시트 없음'});

  var lastCol = sheet.getLastColumn();
  var row2 = sheet.getRange(2, 1, 1, lastCol).getValues()[0];

  // 오른쪽→왼쪽 스캔: 가장 오른쪽 날짜 찾기
  var rightIdx = -1;
  for (var i = row2.length - 1; i >= 0; i--) {
    if (isDateValue(row2[i])) { rightIdx = i; break; }
  }
  if (rightIdx < 0) return resp({error: '날짜 컬럼을 찾을 수 없음'});

  // 왼쪽으로 연속된 날짜 블록의 시작점 찾기
  var leftIdx = rightIdx;
  for (var i = rightIdx - 1; i >= 0; i--) {
    if (isDateValue(row2[i])) { leftIdx = i; }
    else break;
  }

  // leftIdx = 가장 최신 날짜 (0-indexed)
  var latestCol = leftIdx + 1; // 1-indexed

  // 중복 방지
  var latestStr = dateToStr(row2[latestCol - 1]);
  if (latestStr === date) {
    return resp({status: 'skip', message: '이미 동일 날짜 컬럼 존재', date: date, latestStr: latestStr,
      latestCol: latestCol, latestLetter: colLetter(latestCol), dateBlockSize: rightIdx - leftIdx + 1});
  }

  // 새 컬럼 삽입 (최신 날짜 왼쪽에)
  sheet.insertColumnBefore(latestCol);
  var newCol = latestCol;
  var oldCol = latestCol + 1; // 기존 최신 → 오른쪽으로 밀림

  // 날짜 헤더 입력
  sheet.getRange(2, newCol).setValue(date);

  var newL = colLetter(newCol);
  var lastRow = sheet.getLastRow();
  var fRow = 3;

  // 고정 수식 (컬럼 레터만 변경)
  // 시트명 "판매 Data"는 유니코드 이스케이프로 하드코딩 (V8 런타임 UTF-8 인코딩 버그 회피)
  // \uD310 = '판', \uB9E4 = '매'
  var SHEET_NAME = "\uD310\uB9E4 Data";
  var formula = "=ARRAYFORMULA(INDEX('" + SHEET_NAME + "'!$AE$1:$AE$63111, MATCH(1, ('" + SHEET_NAME + "'!$J$1:$J$63111=$E" + fRow + ")*('" + SHEET_NAME + "'!$D$1:$D$63111=" + newL + "$2), 0)))";

  sheet.getRange(fRow, newCol).setFormula(formula);

  if (lastRow > fRow) {
    sheet.getRange(fRow, newCol).copyTo(
      sheet.getRange(fRow, newCol, lastRow - fRow + 1, 1),
      SpreadsheetApp.CopyPasteType.PASTE_FORMULA,
      false
    );
  }
  SpreadsheetApp.flush();

  // 직전 컬럼 수식→값 변환 (수식이 있는 경우만)
  var oldHasFormula = sheet.getRange(fRow, oldCol).getFormula();
  if (oldHasFormula) {
    var oldRange = sheet.getRange(fRow, oldCol, lastRow - fRow + 1, 1);
    oldRange.setValues(oldRange.getValues());
    SpreadsheetApp.flush();
  }

  // 검증: 비영값 개수
  var newVals = sheet.getRange(fRow, newCol, lastRow - fRow + 1, 1).getValues();
  var oldVals = sheet.getRange(fRow, oldCol, lastRow - fRow + 1, 1).getValues();
  var newNZ = 0, oldNZ = 0;
  for (var j = 0; j < newVals.length; j++) { if (newVals[j][0] > 0) newNZ++; }
  for (var j = 0; j < oldVals.length; j++) { if (oldVals[j][0] > 0) oldNZ++; }

  return resp({
    status: 'ok',
    newCol: newCol, newLetter: newL,
    oldCol: oldCol, oldLetter: colLetter(oldCol),
    date: date, formulaRow: fRow, lastRow: lastRow,
    newNonZero: newNZ, oldNonZero: oldNZ,
    dateBlockStart: leftIdx + 1, dateBlockEnd: rightIdx + 1 + 1,
    formula: formula.substring(0, 300)
  });
}

function getGid0Sheet(ss) {
  var allSheets = ss.getSheets();
  for (var i = 0; i < allSheets.length; i++) {
    if (allSheets[i].getSheetId() === 0) return allSheets[i];
  }
  return null;
}

function colLetter(n) {
  var s = '';
  while (n > 0) {
    var r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function resp(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
