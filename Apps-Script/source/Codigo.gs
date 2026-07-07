/**
 * PEDRO DASHBOARD — Web App API
 * Código.gs — versão corrigida
 *
 * CORREÇÃO PRINCIPAL: usa getDisplayValues() em vez de getValues()
 * para evitar o bug de datas 1899 nos campos Start/End/Date.
 *
 * INSTALAR:
 * 1. Abre o Sheets Pedro_Dashboard_MASTER
 * 2. Extensões → Apps Script
 * 3. Clica em "Código.gs"
 * 4. Selecciona TUDO (Ctrl+A) e apaga
 * 5. Cola este código
 * 6. Ctrl+S
 * 7. Implantar → Gerir implementações → ✏️ → Nova versão → Implantar
 * 8. Copia a nova URL e actualiza o index.html
 */


function doGet(e) {
  var params = e ? (e.parameter || {}) : {};
  var callback = params.callback || "";
  var ss = SpreadsheetApp.openById("1EwIrTyIlUXO-HRgBOH92vNz0G0SbNtLVq_iAgM5fHTw");
  var result = {};


  var sheetNames = [
    "Dashboard_Config",
    "Daily_Log",
    "Tasks",
    "Spending",
    "Food",
    "Exercise",
    "Screen_Time",
    "Calendar",
    "Job_Search",
    "Targets_Full_DB",
    "Top30_Targets",
    "LinkedIn_Contacts",
    "CV_Lettres",
    "Food_Estimation_Rules"
  ];


  sheetNames.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) return;


    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return;


    // CRÍTICO: usar getDisplayValues() para que Start/End/Date
    // sejam exportados como strings limpas (ex: "16:00", "2026-06-05")
    // e não como objectos Date que resultam em "Sun Dec 31 1899..."
    var headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
    var displayValues = sheet.getRange(2, 1, lastRow - 1, lastCol).getDisplayValues();


    var rows = [];
    for (var i = 0; i < displayValues.length; i++) {
      var row = {};
      var hasData = false;
      for (var j = 0; j < headers.length; j++) {
        var h = String(headers[j] || "").trim();
        if (!h) continue;
        var val = String(displayValues[i][j] || "").trim();
        row[h] = val;
        if (val !== "") hasData = true;
      }
      if (hasData) rows.push(row);
    }


    result[name] = rows;
  });


  var payload = JSON.stringify({ ok: true, data: result });


  // JSONP — necessário para o dashboard funcionar
  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + payload + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }


  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
} ////  /************************************************************
