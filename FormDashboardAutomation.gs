 * PEDRO DASHBOARD - Forms to Dashboard automation
 ************************************************************/


var SPREADSHEET_ID = "1EwIrTyIlUXO-HRgBOH92vNz0G0SbNtLVq_iAgM5fHTw";
var TIMEZONE = "Europe/Paris";


var SOURCE_MORNING = "Respostas ao formulário 1";
var SOURCE_NIGHT = "Respostas ao formulário 2";


var SHEET_DAILY = "Daily_Log";
var SHEET_TASKS = "Tasks";
var SHEET_SPENDING = "Spending";
var SHEET_FOOD = "Food";
var SHEET_EXERCISE = "Exercise";
var SHEET_SCREEN = "Screen_Time";
var SHEET_JOB = "Job_Search";
var SHEET_PROCESSED = "_Processed_Form_Responses";


function setupFormDashboardAutomation() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  getProcessedSheet_(ss);
  removeOldTriggers_();
  ScriptApp.newTrigger("pedroDashboardOnFormSubmit")
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();
  Logger.log("Automacao criada com sucesso!");
}


function removeOldTriggers_() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    try {
      var handler = triggers[i].getHandlerFunction();
      if (handler === "onFormSubmit" || handler === "pedroDashboardOnFormSubmit") {
        ScriptApp.deleteTrigger(triggers[i]);
      }
    } catch(err) {
      // ignorar triggers com erro
    }
  }
}


function pedroDashboardOnFormSubmit(e) {
  if (!e) return;
  if (!e.range) return;
  var sheet = e.range.getSheet();
  var rowNumber = e.range.getRow();
  processResponseRow_(sheet, rowNumber);
}


function processExistingResponses() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var morningSheet = ss.getSheetByName(SOURCE_MORNING);
  var nightSheet = ss.getSheetByName(SOURCE_NIGHT);
  if (morningSheet) processSheetRows_(morningSheet);
  if (nightSheet) processSheetRows_(nightSheet);
  Logger.log("Respostas existentes processadas.");
}


function processSheetRows_(sheet) {
  var lastRow = sheet.getLastRow();
  for (var row = 2; row <= lastRow; row++) {
    processResponseRow_(sheet, row);
  }
}


function processResponseRow_(sourceSheet, rowNumber) {
  if (!sourceSheet) return;
  if (rowNumber <= 1) return;
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sourceName = sourceSheet.getName();
  if (sourceName !== SOURCE_MORNING && sourceName !== SOURCE_NIGHT) return;
  var table = readRowAsTable_(sourceSheet, rowNumber);
  var timestampCell = getCell_(table, ["carimbo de data hora", "timestamp"]);
  var timestampText = getText_(timestampCell);
  var uid = sourceName + "|" + rowNumber;
  var processedSheet = getProcessedSheet_(ss);
  if (alreadyProcessed_(processedSheet, uid)) return;
  var mode = sourceName === SOURCE_MORNING ? "morning" : "night";
  var dateCell = getCell_(table, ["qual dia", "data referente", "data"]);
  var targetDate = getTargetDate_(dateCell, timestampCell, mode);
  var dayName = getDayNamePt_(targetDate);
  var now = getNow_();
  if (mode === "morning") {
    processMorning_(ss, table, targetDate, dayName, now);
  } else {
    processNight_(ss, table, targetDate, dayName, now);
  }
  processedSheet.appendRow([uid, targetDate, sourceName, rowNumber, now, "Processed"]);
}


function processMorning_(ss, table, targetDate, dayName, now) {
  var sleepQuality = getText_(getCell_(table, ["como dormiste"]));
  var sleepHours = getText_(getCell_(table, ["quantas horas dormiste"]));
  var sleepWindow = getText_(getCell_(table, ["janela de sono"]));
  var mood = getText_(getCell_(table, ["mood ao acordar"]));
  var energy = getText_(getCell_(table, ["energia inicial"]));
  var priority = getText_(getCell_(table, ["prioridade principal de hoje"]));
  var important = getText_(getCell_(table, ["tens algo importante hoje"]));


  var sleepParts = [];
  if (sleepQuality !== "") sleepParts.push("Qualidade: " + sleepQuality + "/5");
  if (sleepHours !== "") sleepParts.push("Duracao: " + sleepHours);
  if (sleepWindow !== "") sleepParts.push("Janela: " + sleepWindow);
  var sleepSummary = sleepParts.join(" | ");


  var summary = priority !== "" ? "Prioridade do dia: " + priority : "Check-in da manha";


  var notesParts = [];
  if (important !== "") notesParts.push("Importante hoje: " + important);
  if (sleepSummary !== "") notesParts.push("Sono: " + sleepSummary);
  var notes = notesParts.join(" | ");


  appendToSheet_(ss, SHEET_DAILY, [
    targetDate, dayName, "Morning Check-in", summary,
    mood, energy, sleepSummary, notes, "Google Form Manha / Yes", now
  ]);


  if (priority !== "") {
    var taskId = "TASK-" + removeHyphens_(targetDate) + "-M-" + makeShortId_();
    appendToSheet_(ss, SHEET_TASKS, [
      taskId, targetDate, targetDate, "Daily Focus",
      priority, "High", "", "To do", "Personal Dashboard",
      priority, important, now
    ]);
  }
}


function processNight_(ss, table, targetDate, dayName, now) {
  var mood = getText_(getCell_(table, ["mood geral do dia"]));
  var energy = getText_(getCell_(table, ["energia do dia"]));
  var exerciseType = getText_(getCell_(table, ["fizeste exercicio"]));
  var exerciseDesc = getText_(getCell_(table, ["descricao do exercicio"]));
  var spending = getText_(getCell_(table, ["gastos do dia"]));
  var food = getText_(getCell_(table, ["resumo da alimentacao"]));
  var jobAdvanced = getText_(getCell_(table, ["avancaste na busca de emprego"]));
  var jobText = getText_(getCell_(table, ["o que fizeste em job search"]));
  var screenTotal = getText_(getCell_(table, ["screen time total"]));
  var topApp = getText_(getCell_(table, ["app mais usado"]));
  var goodThing = getText_(getCell_(table, ["uma coisa boa do dia"]));
  var freeNotes = getText_(getCell_(table, ["notas livres"]));


  var summary = goodThing !== "" ? "Uma coisa boa: " + goodThing : "Check-in da noite";


  var notesParts = [];
  if (freeNotes !== "") notesParts.push(freeNotes);
  if (jobText !== "") notesParts.push("Job search: " + jobText);
  if (exerciseDesc !== "") notesParts.push("Exercicio: " + exerciseDesc);
  if (food !== "") notesParts.push("Alimentacao: " + food);
  var notes = notesParts.join(" | ");


  appendToSheet_(ss, SHEET_DAILY, [
    targetDate, dayName, "Night Check-in", summary,
    mood, energy, "", notes, "Google Form Noite / Yes", now
  ]);


  if (exerciseType !== "" && !isNo_(exerciseType)) {
    appendToSheet_(ss, SHEET_EXERCISE, [
      targetDate, cleanExerciseType_(exerciseType),
      exerciseDesc, "", "", "", "Done", "Yes"
    ]);
  }


  if (food !== "" && !isEmptyOrNo_(food)) {
    appendToSheet_(ss, SHEET_FOOD, [
      targetDate, "Resumo do dia", food, "", "", "", "Form Noite", "Yes"
    ]);
  }


  if (spending !== "" && !isNoSpending_(spending)) {
    var money = parseMoney_(spending);
    appendToSheet_(ss, SHEET_SPENDING, [
      targetDate, spending, money.amount, money.currency,
      "General", "", "Form Noite", "Yes"
    ]);
  }


  if (screenTotal !== "" || topApp !== "") {
    appendToSheet_(ss, SHEET_SCREEN, [
      targetDate, screenTotal, "", "", topApp, "Form Noite", "Yes"
    ]);
  }


  if (jobText !== "" || (jobAdvanced !== "" && !isNo_(jobAdvanced))) {
    appendToSheet_(ss, SHEET_JOB, [
      targetDate, "Daily activity", "", jobText,
      jobAdvanced, "Medium", "", "", "", "Form Noite"
    ]);
  }
}


function readRowAsTable_(sheet, rowNumber) {
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  var values = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];
  var displays = sheet.getRange(rowNumber, 1, 1, lastCol).getDisplayValues()[0];
  var cols = [];
  for (var i = 0; i < headers.length; i++) {
    cols.push({
      header: headers[i],
      normalizedHeader: normalizeText_(headers[i]),
      value: values[i],
      display: displays[i]
    });
  }
  return { cols: cols };
}


function getCell_(table, possibleNames) {
  var normalizedNames = [];
  for (var i = 0; i < possibleNames.length; i++) {
    normalizedNames.push(normalizeText_(possibleNames[i]));
  }
  for (var a = 0; a < normalizedNames.length; a++) {
    for (var b = 0; b < table.cols.length; b++) {
      if (table.cols[b].normalizedHeader === normalizedNames[a]) {
        return table.cols[b];
      }
    }
  }
  for (var c = 0; c < normalizedNames.length; c++) {
    for (var d = 0; d < table.cols.length; d++) {
      if (stringContains_(table.cols[d].normalizedHeader, normalizedNames[c])) {
        return table.cols[d];
      }
    }
  }
  return { value: "", display: "" };
}


function getText_(cell) {
  if (!cell) return "";
  if (cell.display !== undefined && cell.display !== null) {
    var display = String(cell.display).trim();
    if (display !== "") return display;
  }
  if (cell.value === undefined || cell.value === null) return "";
  return String(cell.value).trim();
}


function getTargetDate_(dateCell, timestampCell, mode) {
  var displayDate = getText_(dateCell);
  var parsedDisplayDate = parseDateText_(displayDate);
  if (parsedDisplayDate !== "") return parsedDisplayDate;
  if (dateCell && dateCell.value instanceof Date) {
    return Utilities.formatDate(dateCell.value, TIMEZONE, "yyyy-MM-dd");
  }
  if (timestampCell && timestampCell.value instanceof Date) {
    var ymd = Utilities.formatDate(timestampCell.value, TIMEZONE, "yyyy-MM-dd");
    var hour = Number(Utilities.formatDate(timestampCell.value, TIMEZONE, "H"));
    if (mode === "night" && hour >= 0 && hour < 5) return previousDate_(ymd);
    return ymd;
  }
  var timestampText = getText_(timestampCell);
  var parsedTimestamp = parseDateText_(timestampText);
  if (parsedTimestamp !== "") {
    if (mode === "night" && textLooksEarlyMorning_(timestampText)) return previousDate_(parsedTimestamp);
    return parsedTimestamp;
  }
  return Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd");
}


function parseDateText_(text) {
  if (!text) return "";
  var s = String(text).trim();
  var firstPart = s.split(" ")[0];
  if (stringContains_(firstPart, "-")) {
    var p1 = firstPart.split("-");
    if (p1.length === 3 && String(p1[0]).length === 4) {
      return p1[0] + "-" + pad2_(p1[1]) + "-" + pad2_(p1[2]);
    }
  }
  if (stringContains_(firstPart, "/")) {
    var p2 = firstPart.split("/");
    if (p2.length === 3) {
      var a = Number(p2[0]);
      var b = Number(p2[1]);
      var day = p2[0];
      var month = p2[1];
      if (a <= 12 && b > 12) { month = p2[0]; day = p2[1]; }
      return p2[2] + "-" + pad2_(month) + "-" + pad2_(day);
    }
  }
  return "";
}


function textLooksEarlyMorning_(text) {
  if (!text) return false;
  var parts = String(text).trim().split(" ");
  if (parts.length < 2) return false;
  var timeParts = parts[1].split(":");
  if (timeParts.length < 2) return false;
  var hour = Number(timeParts[0]);
  return !isNaN(hour) && hour >= 0 && hour < 5;
}


function previousDate_(ymd) {
  var d = ymdToDate_(ymd);
  d.setDate(d.getDate() - 1);
  return Utilities.formatDate(d, TIMEZONE, "yyyy-MM-dd");
}


function ymdToDate_(ymd) {
  var parts = ymd.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}


function getDayNamePt_(ymd) {
  var d = ymdToDate_(ymd);
  var days = ["domingo","segunda-feira","terca-feira","quarta-feira","quinta-feira","sexta-feira","sabado"];
  return days[d.getDay()];
}


function appendToSheet_(ss, sheetName, row) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log("Aba nao encontrada: " + sheetName);
    return;
  }
  sheet.appendRow(row);
}


function getProcessedSheet_(ss) {
  var sheet = ss.getSheetByName(SHEET_PROCESSED);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_PROCESSED);
    sheet.appendRow(["UID","Date","Source Sheet","Source Row","Processed At","Notes"]);
  }
  return sheet;
}


function alreadyProcessed_(processedSheet, uid) {
  var finder = processedSheet.createTextFinder(uid);
  finder.matchEntireCell(true);
  return finder.findNext() !== null;
}


function parseMoney_(text) {
  var s = String(text || "");
  var currency = "";
  if (stringContains_(s, "€")) currency = "EUR";
  else if (stringContains_(s, "R$")) currency = "BRL";
  else if (stringContains_(s, "$")) currency = "USD";
  var amount = "";
  var current = "";
  var allowed = "0123456789,.";
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    if (stringContains_(allowed, ch)) {
      current = current + ch;
    } else {
      if (current !== "") break;
    }
  }
  if (current !== "") amount = current.split(",").join(".");
  return { amount: amount, currency: currency };
}


function isNo_(text) {
  var s = normalizeText_(text);
  return s === "nao" || stringContains_(s, "nao");
}


function isEmptyOrNo_(text) {
  var s = normalizeText_(text);
  return s === "" || s === "nao" || s === "nada" || s === "sem";
}


function isNoSpending_(text) {
  var s = normalizeText_(text);
  return s === "" || s === "nao" || s === "nada" || stringContains_(s, "sem gastos");
}


function cleanExerciseType_(text) {
  var s = String(text || "");
  s = s.split("Sim - ").join("");
  s = s.split("Sim – ").join("");
  s = s.split("Sim — ").join("");
  return s.trim();
}


function normalizeText_(text) {
  var s = String(text || "").toLowerCase();
  s = replaceAccents_(s);
  var output = "";
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    var code = ch.charCodeAt(0);
    var isNumber = code >= 48 && code <= 57;
    var isLetter = code >= 97 && code <= 122;
    output = output + (isNumber || isLetter ? ch : " ");
  }
  return collapseSpaces_(output).trim();
}


function replaceAccents_(s) {
  var from = "áàâãäéèêëíìîïóòôõöúùûüçñ";
  var to =   "aaaaaeeeeiiiiooooouuuucn";
  var output = "";
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    var index = from.indexOf(ch);
    output = output + (index >= 0 ? to.charAt(index) : ch);
  }
  return output;
}


function collapseSpaces_(s) {
  var output = "";
  var lastWasSpace = false;
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    if (ch === " ") {
      if (!lastWasSpace) output = output + ch;
      lastWasSpace = true;
    } else {
      output = output + ch;
      lastWasSpace = false;
    }
  }
  return output;
}


function stringContains_(text, search) {
  return String(text).indexOf(String(search)) >= 0;
}


function removeHyphens_(text) {
  return String(text || "").split("-").join("");
}


function pad2_(value) {
  var s = String(value);
  return s.length === 1 ? "0" + s : s;
}


function getNow_() {
  return Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
}


function makeShortId_() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
} ///// /**
