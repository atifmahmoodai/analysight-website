/**
 * AnalySight website lead capture (Google Apps Script)
 * ---------------------------------------------------
 * Receives leads from analysight.com, validates them, blocks spam bots,
 * scores them 0-100 (hot / warm / cold), saves them to this Google Sheet
 * and emails you an alert.
 *
 * Setup: see SETUP-LEADS.md in the website repository.
 */

// ====== EDIT THESE ======
const NOTIFY_EMAIL = "atifmahmood.ai@gmail.com"; // where lead alerts are sent ("" turns alerts off)
const ALERT_PRIORITIES = ["hot", "warm", "cold"];  // which leads trigger an email, e.g. ["hot", "warm"]
const SHEET_NAME = "Leads";
// ========================

const HEADERS = [
  "lead_id", "received_at", "priority", "lead_score", "status",
  "name", "email", "whatsapp", "company", "project_type", "data_sources",
  "data_size", "budget", "timeline", "message", "tried_lab", "source_page"
];

/** Website posts here. */
function doPost(e) {
  try {
    let body = {};
    try { body = JSON.parse((e && e.postData && e.postData.contents) || "{}"); } catch (err) { body = {}; }
    return json_(handleLead_(body));
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: "Something went wrong on our side. Please use WhatsApp or email instead." });
  }
}

/** Visiting the URL in a browser shows this; handy to check the deployment is live. */
function doGet() {
  return json_({ ok: true, service: "AnalySight lead capture", time: new Date().toISOString() });
}

/** Core logic, kept separate so it can be tested. */
function handleLead_(b) {
  const clean = (v, max) => String(v == null ? "" : v)
    .replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max || 500);

  // Honeypot: real visitors never fill the hidden "website" field. Pretend success, store nothing.
  if (clean(b.website)) return { ok: true };

  const lead = {
    name: clean(b.name, 120),
    email: clean(b.email, 160).toLowerCase(),
    whatsapp: clean(b.whatsapp, 30).replace(/[^\d+]/g, ""),
    company: clean(b.company, 160),
    project_type: clean(b.project_type, 80),
    data_sources: clean(b.data_sources, 200),
    data_size: clean(b.data_size, 60),
    budget: clean(b.budget, 60),
    timeline: clean(b.timeline, 60),
    message: clean(b.message, 3000),
    tried_lab: clean(b.tried_lab, 20) || "no",
    source_page: clean(b.source_page, 200)
  };

  const errors = [];
  if (lead.name.length < 2) errors.push("Please enter your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) errors.push("Please enter a valid email address.");
  if (!lead.project_type) errors.push("Please choose a project type.");
  if (lead.message.length < 10) errors.push("Please tell us a little about the project (at least 10 characters).");
  if (errors.length) return { ok: false, error: errors.join(" ") };

  // Duplicate guard: the same email + message within 2 minutes (double clicks, resubmits) is saved once.
  const cache = CacheService.getScriptCache();
  const dupKey = "lead:" + Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, lead.email + "|" + lead.message));
  const previous = cache.get(dupKey);
  if (previous) return JSON.parse(previous);

  // Score 0-100 so the best leads are easy to spot.
  const pick = (map, key, fallback) => (Object.prototype.hasOwnProperty.call(map, key) ? map[key] : fallback);
  let score = 0;
  score += pick({ "Under $500": 5, "$500 to $2,000": 15, "$2,000 to $5,000": 25, "$5,000+": 35 }, lead.budget, 8);
  score += pick({ "As soon as possible": 25, "Within 1 to 3 months": 15, "Just exploring": 5 }, lead.timeline, 8);
  score += pick({ "Over 1 million rows": 10, "100k to 1 million rows": 8, "10k to 100k rows": 6, "Under 10k rows": 4 }, lead.data_size, 3);
  score += lead.tried_lab === "own" ? 15 : lead.tried_lab === "sample" ? 8 : 0;
  if (lead.company) score += 5;
  if (lead.whatsapp.replace(/\D/g, "").length >= 8) score += 5;
  if (lead.message.length >= 80) score += 5;
  score = Math.min(100, score);
  const priority = score >= 60 ? "hot" : score >= 35 ? "warm" : "cold";

  const leadId = "DL-" + Date.now().toString(36).toUpperCase() + "-" +
    Math.random().toString(36).slice(2, 6).toUpperCase();
  const record = Object.assign({ lead_id: leadId, received_at: new Date(), priority: priority, lead_score: score, status: "new" }, lead);

  // Lock so two leads arriving at the same moment don't overwrite each other's row.
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = getSheet_();
    // safe_() stops spreadsheet formula injection (a value like =HYPERLINK(...) typed into the form).
    sheet.appendRow(HEADERS.map((h) => safe_(record[h])));
  } finally {
    lock.releaseLock();
  }

  const response = { ok: true, lead_id: leadId, priority: priority };
  cache.put(dupKey, JSON.stringify(response), 120);

  // The alert is sent after saving, and a mail failure never loses the lead.
  try { sendAlert_(record); } catch (err) { console.error("Alert email failed: " + err); }

  return response;
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function safe_(v) {
  if (v instanceof Date || typeof v === "number") return v;
  const s = String(v == null ? "" : v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function sendAlert_(r) {
  if (!NOTIFY_EMAIL || ALERT_PRIORITIES.indexOf(r.priority) === -1) return;
  const icon = { hot: "🔥", warm: "🟠", cold: "🔵" }[r.priority];
  const esc = (s) => String(s || "-").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rows = [
    ["Name", r.name], ["Email", r.email], ["WhatsApp", r.whatsapp], ["Company", r.company],
    ["Needs", r.project_type], ["Data lives in", r.data_sources], ["Data size", r.data_size],
    ["Budget", r.budget], ["Timeline", r.timeline], ["Tried the lab", r.tried_lab], ["Page", r.source_page]
  ].map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#667"><b>${k}</b></td><td style="padding:4px 0">${esc(v)}</td></tr>`).join("");
  const wa = r.whatsapp ? `<p><a href="https://wa.me/${r.whatsapp.replace(/\D/g, "")}">Reply on WhatsApp</a></p>` : "";
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: r.email,
    subject: `${icon} ${r.priority.toUpperCase()} lead (${r.lead_score}/100): ${r.name}, ${r.project_type}`,
    htmlBody: `<h2 style="margin:0 0 8px">${icon} New ${r.priority} lead, score ${r.lead_score}/100</h2>
      <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${rows}</table>
      <p style="font-family:Arial,sans-serif;font-size:14px"><b>Message</b><br>${esc(r.message).replace(/\n/g, "<br>")}</p>
      ${wa}
      <p style="color:#889;font-size:12px">Reference ${r.lead_id}. Reply to this email to answer ${esc(r.name)} directly.
      <a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}">Open the lead sheet</a></p>`
  });
}

/** Run this once from the editor: creates the sheet header, asks for permissions, sends a test email. */
function setup() {
  getSheet_();
  if (NOTIFY_EMAIL) {
    MailApp.sendEmail(NOTIFY_EMAIL, "AnalySight lead alerts are on",
      "Setup worked. New website leads will be saved to:\n" + SpreadsheetApp.getActiveSpreadsheet().getUrl());
  }
  console.log("Setup complete. Now deploy as a web app.");
}
/** Returns a JSON response (used by doGet and doPost). */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}