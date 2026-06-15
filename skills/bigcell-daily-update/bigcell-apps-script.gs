/**
 * 빅셀 그로스 재고 DB 업데이트 - 독립형(Standalone) v8
 * v8 추가: action:'etherizeDates' — 클린인테크 등 날짜 헤더가 텍스트("2026. M. D")·MM/DD 혼합인 시트를
 *          이더컴퍼니 스타일(전부 MM/DD 날짜값)로 정리. 데이터 안 깨지게:
 *            (1) gid=0 시트를 백업 탭으로 복사
 *            (2) 최신(leftmost) 날짜열 수식 → 값으로 고정(freeze) → 매칭 의존성 제거
 *            (3) row2 모든 날짜 헤더(텍스트/MM-DD) → 날짜값 + 'mm/dd' 표시형식
 *          판매 Data D열·다른 수식은 건드리지 않음. updateGrowthDB(일일 파이프라인)도 무변경.
 * v7 유지: IFERROR(...,0), rewrapLatest, 옵션ID 자동감지.
 * payload: { sheetId, date } | { sheetId, action:'deleteCol', col } |
 *          { sheetId, action:'normalizeDColumn' } | { sheetId, action:'rewrapLatest' } |
 *          { sheetId, action:'etherizeDates' }
 */
function doGet(e) {
  return resp({status: 'ready', type: 'standalone-growthDB-v8'});
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (!data.sheetId) return resp({error: 'sheetId 누락'});
    if (data.action === 'deleteCol') return deleteColumn(data);
    if (data.action === 'normalizeDColumn') return normalizeDColumn(data);
    if (data.action === 'rewrapLatest') return rewrapLatest(data);
    if (data.action === 'etherizeDates') return etherizeDates(data);
    if (!data.date) return resp({error: 'date 누락'});
    return updateGrowthDB(data);
  } catch(err) {
    return resp({status: 'error', message: err.message});
  }
}

function buildFormula(SHEET_NAME, optLetter, fRow, newL) {
  return "=ARRAYFORMULA(IFERROR(INDEX('" + SHEET_NAME + "'!$AE$1:$AE$63111, MATCH(1, ('" +
    SHEET_NAME + "'!$J$1:$J$63111=$" + optLetter + fRow + ")*('" +
    SHEET_NAME + "'!$D$1:$D$63111=" + newL + "$2), 0)), 0))";
}

/** 텍스트/MM-DD/Date → Date 객체. MM/DD는 연도 2026으로 간주(현재 데이터 전부 2026). */
function toDate(v) {
  if (v instanceof Date) return v;
  if (v == null || v === '') return null;
  var s = String(v).trim();
  var m = s.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})$/);
  if (m) return new Date(parseInt(m[1],10), parseInt(m[2],10)-1, parseInt(m[3],10));
  var mm = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (mm) return new Date(2026, parseInt(mm[1],10)-1, parseInt(mm[2],10));
  return null;
}

/** ★v8: 날짜 헤더를 이더 스타일(MM/DD 날짜값)로 정리. 백업 + 최신열 freeze + 헤더 변환. */
function etherizeDates(data) {
  var ss = SpreadsheetApp.openById(data.sheetId);
  var sheet = getGid0Sheet(ss);
  if (!sheet) return resp({error: 'gid=0 시트 없음'});

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  // (1) 백업 탭 복사
  var stamp = Utilities.formatDate(new Date(), 'GMT+9', 'yyyyMMdd_HHmm');
  var backupName = '백업_' + stamp;
  sheet.copyTo(ss).setName(backupName);

  // (2) 최신(leftmost) 날짜열 freeze: 수식 → 값
  var latestCol = findLatestDateCol(sheet);
  var frozen = 0;
  if (latestCol > 0 && lastRow > 2) {
    var fr = sheet.getRange(3, latestCol, lastRow - 2, 1);
    var hasFormula = fr.getFormulas().some(function(r){ return r[0] !== ''; });
    if (hasFormula) { fr.setValues(fr.getValues()); frozen = lastRow - 2; }
  }

  // (3) row2 날짜 헤더 → Date 값 + 'mm/dd' 형식
  var row2 = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
  var conv = 0, cols = [];
  for (var c = 0; c < row2.length; c++) {
    var d = toDate(row2[c]);
    if (d) {
      var cell = sheet.getRange(2, c + 1);
      cell.setValue(d);
      cell.setNumberFormat('mm"/"dd');
      conv++; cols.push(colLetter(c + 1));
    }
  }
  SpreadsheetApp.flush();

  return resp({
    status: 'ok', action: 'etherizeDates', backup: backupName,
    frozenLatestCol: latestCol, frozenLatestLetter: latestCol > 0 ? colLetter(latestCol) : null,
    frozenCells: frozen, headersConverted: conv,
    firstDateCol: cols[0] || null, lastDateCol: cols[cols.length-1] || null
  });
}

function normalizeDColumn(data) {
  var ss = SpreadsheetApp.openById(data.sheetId);
  var sheet = ss.getSheetByName(PMDATA());
  if (!sheet) return resp({error: 'sheet not found: PMData'});
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
    if (m) { out[i] = [new Date(parseInt(m[1],10), parseInt(m[2],10)-1, parseInt(m[3],10))]; normalized++; }
    else {
      var m2 = s.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\b/);
      if (m2) { out[i] = [new Date(parseInt(m2[1],10), parseInt(m2[2],10)-1, parseInt(m2[3],10))]; normalized++; }
      else { out[i] = [v]; skipped++; }
    }
  }
  range.setValues(out);
  range.setNumberFormat('yyyy. m. d');
  SpreadsheetApp.flush();
  return resp({status:'ok', action:'normalizeDColumn', lastRow:lastRow, startRow:startRow, numRows:numRows, normalized:normalized, skipped:skipped, empty:empty});
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

function dateToStr(v) {
  if (v instanceof Date) { return v.getFullYear() + '. ' + (v.getMonth() + 1) + '. ' + v.getDate(); }
  return String(v).trim();
}

function isDateValue(v) {
  if (v == null || v === '') return false;
  if (v instanceof Date) return true;
  var s = String(v).trim();
  return /^\d{4}\.\s*\d{1,2}\.\s*\d{1,2}$/.test(s);
}

function detectOptionCol(sheet) {
  var lastCol = sheet.getLastColumn();
  var probe = sheet.getRange(3, 1, 1, Math.min(lastCol, 14)).getValues()[0];
  for (var c = 2; c < probe.length; c++) {
    if (/^\d{11}$/.test(String(probe[c]).trim())) return c + 1;
  }
  return 5;
}

/** 최신(=가장 왼쪽) 날짜 컬럼. Date값/텍스트 둘 다 인식. */
function findLatestDateCol(sheet) {
  var lastCol = sheet.getLastColumn();
  var row2 = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
  var rightIdx = -1;
  for (var i = row2.length - 1; i >= 0; i--) { if (isDateValue(row2[i])) { rightIdx = i; break; } }
  if (rightIdx < 0) return -1;
  var leftIdx = rightIdx;
  for (var i = rightIdx - 1; i >= 0; i--) { if (isDateValue(row2[i])) { leftIdx = i; } else break; }
  return leftIdx + 1;
}

function rewrapLatest(data) {
  var ss = SpreadsheetApp.openById(data.sheetId);
  var sheet = getGid0Sheet(ss);
  if (!sheet) return resp({error: 'gid=0 시트 없음'});
  var latestCol = findLatestDateCol(sheet);
  if (latestCol < 0) return resp({error: '날짜 컬럼을 찾을 수 없음'});
  var newL = colLetter(latestCol);
  var dateStr = dateToStr(sheet.getRange(2, latestCol).getValue());
  var lastRow = sheet.getLastRow();
  var fRow = 3;
  var optCol = detectOptionCol(sheet);
  var optLetter = colLetter(optCol);
  var SHEET_NAME = PMDATA();
  var formula = buildFormula(SHEET_NAME, optLetter, fRow, newL);
  sheet.getRange(fRow, latestCol).setFormula(formula);
  if (lastRow > fRow) {
    sheet.getRange(fRow, latestCol).copyTo(
      sheet.getRange(fRow, latestCol, lastRow - fRow + 1, 1),
      SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
  }
  SpreadsheetApp.flush();
  var vals = sheet.getRange(fRow, latestCol, lastRow - fRow + 1, 1).getValues();
  var nz = 0, zero = 0, naCount = 0;
  for (var j = 0; j < vals.length; j++) {
    var v = vals[j][0];
    if (v === '#N/A' || (typeof v === 'string' && v.indexOf('#') === 0)) naCount++;
    else if (v > 0) nz++;
    else if (v === 0) zero++;
  }
  return resp({status:'ok', action:'rewrapLatest', latestCol:latestCol, latestLetter:newL, date:dateStr,
    optionCol:optCol, optionLetter:optLetter, lastRow:lastRow, nonZero:nz, zero:zero, naRemaining:naCount});
}

function updateGrowthDB(data) {
  var date = data.date.trim();
  var ss = SpreadsheetApp.openById(data.sheetId);
  var sheet = getGid0Sheet(ss);
  if (!sheet) return resp({error: 'gid=0 시트 없음'});
  var lastCol = sheet.getLastColumn();
  var row2 = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
  var rightIdx = -1;
  for (var i = row2.length - 1; i >= 0; i--) { if (isDateValue(row2[i])) { rightIdx = i; break; } }
  if (rightIdx < 0) return resp({error: '날짜 컬럼을 찾을 수 없음'});
  var leftIdx = rightIdx;
  for (var i = rightIdx - 1; i >= 0; i--) { if (isDateValue(row2[i])) { leftIdx = i; } else break; }
  var latestCol = leftIdx + 1;
  var latestStr = dateToStr(row2[latestCol - 1]);
  if (latestStr === date) {
    return resp({status: 'skip', message: '이미 동일 날짜 컬럼 존재', date: date, latestStr: latestStr,
      latestCol: latestCol, latestLetter: colLetter(latestCol)});
  }
  sheet.insertColumnBefore(latestCol);
  var newCol = latestCol;
  var oldCol = latestCol + 1;
  sheet.getRange(2, newCol).setValue(date);
  var newL = colLetter(newCol);
  var lastRow = sheet.getLastRow();
  var fRow = 3;
  var optCol = detectOptionCol(sheet);
  var optLetter = colLetter(optCol);
  var SHEET_NAME = PMDATA();
  var formula = buildFormula(SHEET_NAME, optLetter, fRow, newL);
  sheet.getRange(fRow, newCol).setFormula(formula);
  if (lastRow > fRow) {
    sheet.getRange(fRow, newCol).copyTo(sheet.getRange(fRow, newCol, lastRow - fRow + 1, 1), SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
  }
  SpreadsheetApp.flush();
  var oldHasFormula = sheet.getRange(fRow, oldCol).getFormula();
  if (oldHasFormula) {
    var oldRange = sheet.getRange(fRow, oldCol, lastRow - fRow + 1, 1);
    oldRange.setValues(oldRange.getValues());
    SpreadsheetApp.flush();
  }
  var newVals = sheet.getRange(fRow, newCol, lastRow - fRow + 1, 1).getValues();
  var oldVals = sheet.getRange(fRow, oldCol, lastRow - fRow + 1, 1).getValues();
  var newNZ = 0, oldNZ = 0;
  for (var j = 0; j < newVals.length; j++) { if (newVals[j][0] > 0) newNZ++; }
  for (var j = 0; j < oldVals.length; j++) { if (oldVals[j][0] > 0) oldNZ++; }
  return resp({status: 'ok', newCol: newCol, newLetter: newL, oldCol: oldCol, oldLetter: colLetter(oldCol),
    optionCol: optCol, optionLetter: optLetter, date: date, formulaRow: fRow, lastRow: lastRow,
    newNonZero: newNZ, oldNonZero: oldNZ});
}

function PMDATA() { return String.fromCharCode(54032, 47588) + " Data"; }

function getGid0Sheet(ss) {
  var allSheets = ss.getSheets();
  for (var i = 0; i < allSheets.length; i++) { if (allSheets[i].getSheetId() === 0) return allSheets[i]; }
  return null;
}

function colLetter(n) {
  var s = '';
  while (n > 0) { var r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function resp(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
