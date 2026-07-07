 * PEDRO DASHBOARD — Auto Sync Script v2
 * Sincroniza automaticamente:
 * 1. Google Calendar → Sheets (aba Calendar)
 * 2. Google Drive pasta CVs → Sheets (aba CV_Lettres)
 *
 * COMO INSTALAR:
 * 1. Abre o Google Sheets Pedro_Dashboard_MASTER
 * 2. Extensões → Apps Script
 * 3. Clica no "+" ao lado de Arquivos → "Script"
 * 4. Chama o ficheiro "SyncAuto"
 * 5. Cola este código completo
 * 6. Ctrl+S para guardar
 * 7. Selecciona "setupAutoSync" → ▶ Executar
 * 8. Autoriza as permissões (Calendar + Drive + Sheets)
 * 9. Pronto — sincroniza a cada hora automaticamente!
 */


var SPREADSHEET_ID = "1EwIrTyIlUXO-HRgBOH92vNz0G0SbNtLVq_iAgM5fHTw";
var TIMEZONE = "Europe/Paris";
var CV_FOLDER_ID = "1HEcc7gcwY-2rn25bmpdlTnrzj2XBC8VG";


var SHEET_CALENDAR = "Calendar";
var SHEET_CV = "CV_Lettres";


// ─────────────────────────────────────────────────────────────────────────────
// SETUP — corre UMA vez para activar a sincronização automática
// ─────────────────────────────────────────────────────────────────────────────
function setupAutoSync() {
  removeOldTriggers_();


  ScriptApp.newTrigger("syncAll")
    .timeBased()
    .everyHours(1)
    .create();


  ScriptApp.newTrigger("syncAll")
    .forSpreadsheet(SpreadsheetApp.openById(SPREADSHEET_ID))
    .onOpen()
    .create();


  Logger.log("✅ Auto sync activado!");
  syncAll();
}


function removeOldTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    try {
      if (t.getHandlerFunction() === "syncAll") {
        ScriptApp.deleteTrigger(t);
      }
    } catch(e) {}
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// SYNC PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
function syncAll() {
  try { syncCalendar(); } catch(e) { Logger.log("Erro Calendar: " + e); }
  try { syncCVDrive(); } catch(e) { Logger.log("Erro CV Drive: " + e); }
  Logger.log("✅ Sync completo: " + new Date().toLocaleString());
}


// ─────────────────────────────────────────────────────────────────────────────
// 1. GOOGLE CALENDAR → SHEETS
// ─────────────────────────────────────────────────────────────────────────────
function syncCalendar() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_CALENDAR);
  if (!sheet) sheet = ss.insertSheet(SHEET_CALENDAR);


  sheet.clearContents();
  sheet.appendRow(["Date","Start","End","Title","Type","Location","Status","Notes","URL","Calendar","Last Synced"]);


  var now = new Date();
  var start = new Date(now); start.setMonth(start.getMonth() - 3);
  var end = new Date(now); end.setMonth(end.getMonth() + 6);


  var calendars = CalendarApp.getAllCalendars();
  var allEvents = [];


  calendars.forEach(function(cal) {
    var calName = cal.getName().toLowerCase();
    if (calName.includes("birthday") || calName.includes("anniversaire") ||
        calName.includes("feriado") || calName.includes("holiday")) return;
    try {
      var events = cal.getEvents(start, end);
      events.forEach(function(e) {
        var eStart = e.getStartTime();
        var eEnd = e.getEndTime();
        var isAllDay = e.isAllDayEvent();
        var title = e.getTitle() || "";
        allEvents.push([
          Utilities.formatDate(eStart, TIMEZONE, "yyyy-MM-dd"),
          isAllDay ? "" : Utilities.formatDate(eStart, TIMEZONE, "HH:mm"),
          isAllDay ? "" : Utilities.formatDate(eEnd, TIMEZONE, "HH:mm"),
          title,
          detectEventType_(title, e.getDescription() || ""),
          e.getLocation() || "",
          "Confirmed",
          (e.getDescription() || "").substring(0, 200),
          "",
          cal.getName(),
          Utilities.formatDate(now, TIMEZONE, "yyyy-MM-dd HH:mm:ss")
        ]);
      });
    } catch(err) {
      Logger.log("Erro calendário " + cal.getName() + ": " + err);
    }
  });


  allEvents.sort(function(a, b) {
    return String(a[0] + a[1]).localeCompare(String(b[0] + b[1]));
  });


  if (allEvents.length > 0) {
    sheet.getRange(2, 1, allEvents.length, 11).setValues(allEvents);
  }


  Logger.log("📅 Calendar: " + allEvents.length + " eventos sincronizados");
}


function detectEventType_(title, desc) {
  var t = (title + " " + desc).toLowerCase();
  if (t.includes("entretien") || t.includes("interview") || t.includes("entrevista")) return "Interview";
  if (t.includes("check-in") || t.includes("checkin") || t.includes("formulaire") || t.includes("form")) return "Check-in";
  if (t.includes("call") || t.includes("téléphonique") || t.includes("phone")) return "Call";
  if (t.includes("vol ") || t.includes("flight") || t.includes("voo") || t.includes("ryanair") || t.includes("vueling")) return "Travel";
  if (t.includes("webinar") || t.includes("formation") || t.includes("atelier") || t.includes("apec")) return "Formation";
  if (t.includes("cérémonie") || t.includes("ceremony") || t.includes("diplôme") || t.includes("psl")) return "Cérémonie";
  if (t.includes("networking") || t.includes("salon") || t.includes("conférence")) return "Networking";
  if (t.includes("médecin") || t.includes("doctor") || t.includes("dentiste") || t.includes("rdv")) return "Santé";
  if (t.includes("sport") || t.includes("gym") || t.includes("basic-fit")) return "Sport";
  return "Événement";
}


// ─────────────────────────────────────────────────────────────────────────────
// 2. GOOGLE DRIVE (pasta CVs) → SHEETS
// ─────────────────────────────────────────────────────────────────────────────
function syncCVDrive() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_CV);
  if (!sheet) sheet = ss.insertSheet(SHEET_CV);


  sheet.clearContents();
  sheet.appendRow(["Name","Type","Target / Company","Language","URL","Notes","Date Added","Last Synced"]);


  var folder = DriveApp.getFolderById(CV_FOLDER_ID);
  var rows = [];
  var now = new Date();


  // Ler ficheiros na pasta principal
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    var row = buildCVRow_(file, now);
    if (row) rows.push(row);
  }


  // Ordenar: CVs primeiro, depois cartas, depois outros
  rows.sort(function(a, b) {
    var order = {"CV": 0, "Cover Letter": 1, "Support": 2, "Document": 3};
    return (order[a[1]] || 4) - (order[b[1]] || 4);
  });


  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 8).setValues(rows);
  }


  Logger.log("📄 CV/Drive: " + rows.length + " ficheiros sincronizados");
}


function buildCVRow_(file, now) {
  var name = file.getName();
  var ext = name.split(".").pop().toLowerCase();


  // Ignorar ficheiros não relevantes
  var ignoredTypes = ["png", "jpg", "jpeg", "xlsx", "docx", "html"];
  if (ignoredTypes.indexOf(ext) >= 0 && ext !== "pdf") {
    // Manter docx de lettre/motivation
    if (ext === "docx" && !detectDocType_(name).includes("Cover")) return null;
    if (ext !== "docx") return null;
  }


  var url = "https://drive.google.com/file/d/" + file.getId() + "/view";
  var type = detectDocType_(name);
  var company = detectCompany_(name);
  var language = detectLanguage_(name, type);


  return [
    name.replace(/\.(pdf|docx|doc)$/i, ""),
    type,
    company,
    language,
    url,
    "",
    Utilities.formatDate(file.getDateCreated(), TIMEZONE, "yyyy-MM-dd"),
    Utilities.formatDate(now, TIMEZONE, "yyyy-MM-dd HH:mm:ss")
  ];
}


function detectDocType_(name) {
  var n = name.toLowerCase();
  if (n.includes("cv") || n.includes("curriculum") || n.includes("resume")) return "CV";
  if (n.includes("cover") || n.includes("motivation") || n.includes("lettre") || n.includes("carta")) return "Cover Letter";
  if (n.includes("bilan") || n.includes("competence") || n.includes("portfolio")) return "Support";
  if (n.includes("objectif") || n.includes("projet")) return "Support";
  return "Document";
}


function detectCompany_(name) {
  var companies = [
    "Syntetica","Amcor","Chanel","Channel","Aptar","IPC","Corning",
    "Pochet","Deloitte","Fairmat","Valorplast","IBMM","CNRS",
    "Loreal","Arkema","Carbios","Pierre Fabre","Albea",
    "NAOS","Bioderma","Clarins","LVMH","Postdoc","Post_Doc","Post Doc"
  ];
  var n = name.toLowerCase();
  for (var i = 0; i < companies.length; i++) {
    if (n.includes(companies[i].toLowerCase())) {
      if (companies[i] === "Channel") return "Chanel";
      if (companies[i] === "Post_Doc" || companies[i] === "Post Doc") return "Postdoc";
      return companies[i];
    }
  }
  return "Geral";
}


function detectLanguage_(name, type) {
  var n = name.toLowerCase();
  if (n.includes("_fr") || n.includes("fr.") || n.includes("_fr_") || n.includes("francais")) return "FR";
  if (n.includes("_en") || n.includes("en.") || n.includes("english") || n.includes("cover")) return "EN";
  if (n.includes("_br") || n.includes("_pt") || n.includes("portugues")) return "PT";
  // Cover letters em inglês por defeito se o nome for em inglês
  if (type === "Cover Letter" && (n.includes("cover") || n.includes("motivation letter"))) return "EN";
  return "FR";
} /// adicionar um documento com esses codigos  para identificar mais facil seja aqui ou na base de dados do drive;
