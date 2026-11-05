/* SAVE AS: Code.gs · LOCATION: C:/MarvelApps/scotthub/relay/Code.gs
 * (the live copy is a Google Apps Script web app in Scott's Google account,
 *  project "Scott Hub relay" — this file is the source of record)
 *
 * SCOTT HUB RELAY (Scott 2026-10-10: "a personalize app for myself giving me
 * updates on things i need to know when not home"). A private mailbox:
 *   PC  --(write key + snapshot part)--> relay  (stored in Script Properties)
 *   phone --(read pass)--> relay --> the latest parts
 * It is NOT the Day Hub AI relay (customers use that one) and it never calls
 * any outside service — no AI, no Whop, nothing that costs money.
 *
 * ONE Script Property, pasted by Scott (any capitals):
 *   SCOTT_HUB = {"write":"<PC key>","read":"<phone pass>"}
 * Two different secrets on purpose: the phone's pass can only READ, so a lost
 * phone can never overwrite the numbers; the PC key lives only on the PC.
 *
 * v2: "get" also returns the next 7 days of Google Calendar (read-only, all calendars).
 *
 * v3 (Scott 10/17: "approvals and changes through my scott hub app that should be tied to my
 * claude"): Yes / No on Claude's open questions. A THIRD secret goes in the same property:
 *   SCOTT_HUB = {"write":"<PC key>","read":"<phone pass>","decide":"<phone decide pass>"}
 * No "decide" in the property = every tap is refused (the relay's OFF switch). The read pass
 * can never decide. The decide pass can only answer yes / no to an ID that the PC's newest
 * snapshot lists as open, quoting that question's sig - so a tap can't invent a question or
 * answer one that was reworded since. The first tap on an ID + sig is kept; another is
 * answered "already decided". Nothing here acts on a tap - the PC pulls them.
 *
 * v4 (Scott 10/17: "what makes the server do all same stuff when pc is off?"): a THIRD part,
 * "server" - the server's own health (heartbeat, bots, ops runner, its alerts; never bets or
 * money), sent by C:/MasterHub/scott_hub_server.py while the PC is off. It has its OWN key in its
 * OWN Script Property, so the PC write key never goes to the server:
 *   SCOTT_HUB_SERVER = <server key>      (a plain value; any capitals)
 * The server key can put the "server" part and nothing else (no get, pull, decide or PC part),
 * and the PC write key can't put "server". No SCOTT_HUB_SERVER = server puts refused (the relay's
 * OFF switch for this). A server key equal to write / read / decide is ignored.
 *
 * v5 (Scott 10/23, UseMart support: "It should come up in my scott hub so can respond from there fast"): a FOURTH part,
 * "usemart" - support items waiting on Scott (count, how many over 24 h, the newest 10: ref, first name, topic, age; never an
 * email or message text), sent every 5 min by the UseMart server (C:/MarvelApps/usemart/api/src/scotthub.ts, switch
 * SCOTT_HUB_SUPPORT). Its OWN key in its OWN Script Property, like the server's:
 *   SCOTT_HUB_USEMART = <usemart key>    (a plain value; any capitals)
 * That key can put the "usemart" part and nothing else; no other key can put it. No SCOTT_HUB_USEMART = usemart puts refused.
 * A usemart key equal to write / read / decide / server is ignored.
 *
 * v7 (Scott 11/01: "should be able to get from my calendar all key bdays"): "get"'s calendar also carries
 * birthdays = the next 12 months (title + day only) from Google's Contacts "Birthdays" calendar - read by id because
 * getAllCalendars() leaves it out - plus his own calendar's events titled birthday / bday / anniversary / 🎂, and
 * birthdays_from = which of the two were read. Cached 1 hour. Nothing else changes; an older phone ignores the fields.
 *
 * v8 (Scott 11/04: "i have idea outside of the office all the time" / "yes build both"): the idea box. The phone saves typed ideas
 * here even while the PC is off (decide pass, same as "learn"); the PC takes them on its next "pull". Text only, cut to IDEA_TEXT. Nothing
 * here acts on an idea, and no phone message ever runs anything on the PC.
 *
 * Tasks (POST, body JSON):
 *   {task:"put",    key, part:"masterhub"|"desktop", data:{...}}             PC
 *   {task:"put",    key:<server key>, part:"server", data:{...}}             server (v4)
 *   {task:"pull",   key}                                     PC: the last 100 taps
 *   {task:"get",    pass}                                    phone (+ last 30 taps)
 *   {task:"ping",   pass}                                    phone / setup check
 *   {task:"decide", dpass, id:"A-017", answer:"yes"|"no", sig, tapped_at}   phone
 *   {task:"decide", dpass, id:"F-004", answer:"yes", sig, tapped_at}   phone "Fix it" (Step 3):
 *        only an F- id the PC's newest snapshot lists under repairs.fixable, with its sig
 *   {task:"learn",  dpass, events:[{id, key, how, text, cls, open, at}]}   phone (v6, Scott 10/25 "8 yes"):
 *        what Scott does with the home cards (Not now / Done / Bring back / open) and which screens he
 *        opens, so the PC can learn what matters to him. Same decide pass; <=20 events a call, each
 *        field checked and cut to size (key / text 120 characters), one stored call <= LEARN_BYTES, all
 *        stored calls <= LEARN_TOTAL characters (oldest dropped) and the newest LEARN_KEEP. Reply
 *        {ok, stored, taken, ids}: ids = the phone ids used up, which the phone then removes. PC: "pull".
 *   {task:"idea",   dpass, ideas:[{id, text, at}]}   phone (v8). Reply {ok, ids}: the ids it now holds, which the phone marks sent. PC: "pull".
 * Storage: each part as compact JSON split into <=8,000-char chunks
 * (Script Properties cap one value at ~9 KB), plus the time it arrived.
 * Only the newest copy of each part is kept. Taps: one property each (dec_<seq>), the
 * newest DEC_KEEP kept.
 */
const PARTS = ["masterhub", "desktop", "server", "usemart"];
const CHUNK = 8000;
const MAX_PART = 60000;            // a part bigger than this is refused, not stored
const MAX_SERVER_PART = 20000;     // the server's report is ~3-6 KB
const MAX_USEMART_PART = 20000;    // v5: UseMart's support card is ~1-3 KB
const DEC_KEEP = 100;
const DEC_SHOWN = 30;
const LEARN_KEEP = 100;            // v6: stored "learn" calls (each <= LEARN_MAX events)
const LEARN_MAX = 20;
const LEARN_BYTES = 8000;          // one stored call, UTF-8 bytes (one Script Property holds ~9 KB)
const LEARN_TOTAL = 60000;         // all stored learn calls together, characters (~180 KB worst case in bytes) - the 500 KB store is shared with the parts + taps
const LEARN_TEXT = 120;            // key / text cut to this many characters (whole characters, never half an emoji)
const LEARN_HOWS = ["snooze", "done", "unhide", "open", "view"];
const IDEA_KEEP = 100;             // v8: newest ideas kept for the PC to take (the PC keeps its own copy for good)
const IDEA_MAX = 10;               // one call
const IDEA_TEXT = 2000;            // characters; 2,000 is at most ~8 KB, inside one Script Property
const IDEA_TOTAL = 60000;          // all stored ideas together, characters - the 500 KB store is shared
function cutChars(s, n) { return Array.from(String(s || "")).slice(0, n).join(""); }

function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const P = PropertiesService.getScriptProperties();
    const cfg = config(P);
    if (cfg.error) return out(cfg);

    if (req.task === "put") {
      if (req.part === "server") {             // v4: the server's own key, this part only
        if (cfg.server_error) return out({ error: cfg.server_error });
        if (!cfg.server) return out({ error: "server reports aren't switched on in the relay yet" });
        if (!same(req.key, cfg.server)) return out({ error: "wrong server key" });
      } else if (req.part === "usemart") {     // v5: UseMart's own key, this part only
        if (cfg.usemart_error) return out({ error: cfg.usemart_error });
        if (!cfg.usemart) return out({ error: "UseMart support isn't switched on in the relay yet" });
        if (!same(req.key, cfg.usemart)) return out({ error: "wrong usemart key" });
      } else if (!same(req.key, cfg.write)) return out({ error: "wrong write key" });
      if (PARTS.indexOf(req.part) < 0) return out({ error: "unknown part" });
      const s = JSON.stringify(req.data || {});
      const cap = req.part === "server" ? MAX_SERVER_PART : req.part === "usemart" ? MAX_USEMART_PART : MAX_PART;
      if (s.length > cap) return out({ error: "part too big: " + s.length });
      const lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try { putPart(P, req.part, s); } finally { lock.releaseLock(); }
      return out({ ok: true, part: req.part, bytes: s.length });
    }

    if (req.task === "pull") {
      if (!same(req.key, cfg.write)) return out({ error: "wrong write key" });
      return out({ ok: true, decisions: listDecisions(P, DEC_KEEP), learn: listLearn(P, LEARN_KEEP), ideas: listIdeas(P) });
    }

    if (req.task === "decide") return out(decide(P, cfg, req));
    if (req.task === "learn") return out(learn(P, cfg, req));
    if (req.task === "idea") return out(idea(P, cfg, req));

    if (!same(req.pass, cfg.read)) return out({ error: "wrong passphrase" });
    if (req.task === "ping") return out({ ok: true, app: "scotthub-relay", decide: !!cfg.decide, server: !!cfg.server, usemart: !!cfg.usemart });
    if (req.task === "get") {
      const parts = {};
      PARTS.forEach(function (p) { parts[p] = getPart(P, p); });
      const taps = listDecisions(P, DEC_SHOWN).map(function (d) {
        return { id: d.id, answer: d.answer, sig: d.sig, tapped_at: d.tapped_at, relay_at: d.relay_at };
      });
      return out({ ok: true, now: new Date().toISOString(), parts: parts, calendar: calendar(), decisions: taps });
    }
    return out({ error: "unknown task" });
  } catch (err) {
    return out({ error: String(err && err.message || err) });
  }
}

function doGet() { return out({ ok: true, app: "scotthub-relay" }); }

function config(P) {
  const all = P.getProperties();
  let raw = null;
  for (const k in all) if (k.trim().toUpperCase() === "SCOTT_HUB") raw = all[k];
  if (!raw) return { error: "relay has no SCOTT_HUB property yet" };
  let c;
  try {
    c = JSON.parse(raw);
  } catch (err) {
    return { error: "SCOTT_HUB is not valid JSON - paste it again" };
  }
  if (!c || !c.write || !c.read) return { error: "SCOTT_HUB needs both write and read" };
  // v4: the server's key lives in its own property; never one taken from SCOTT_HUB. (v5: same for usemart.)
  delete c.server; delete c.usemart;
  let sk = null;
  for (const k in all) if (k.trim().toUpperCase() === "SCOTT_HUB_SERVER") sk = String(all[k] || "").trim();
  if (sk) {
    if (same(sk, c.write) || same(sk, c.read) || (c.decide && same(sk, c.decide))) c.server_error = "SCOTT_HUB_SERVER must be its own secret - fix it";
    else c.server = sk;
  }
  // v5: UseMart's key, its own property, never equal to any other secret
  let uk = null;
  for (const k in all) if (k.trim().toUpperCase() === "SCOTT_HUB_USEMART") uk = String(all[k] || "").trim();
  if (uk) {
    if (same(uk, c.write) || same(uk, c.read) || (c.decide && same(uk, c.decide)) || (c.server && same(uk, c.server))) c.usemart_error = "SCOTT_HUB_USEMART must be its own secret - fix it";
    else c.usemart = uk;
  }
  return c;
}

// Exact match after trimming (these are long random keys, not typed words).
function same(a, b) { return !!a && String(a).trim() === String(b).trim(); }

function putPart(P, part, s) {
  const old = Number(P.getProperty(part + "_n") || 0);
  const n = Math.max(1, Math.ceil(s.length / CHUNK));
  const props = {};
  for (let i = 0; i < n; i++) props[part + "_" + i] = s.slice(i * CHUNK, (i + 1) * CHUNK);
  props[part + "_n"] = String(n);
  props[part + "_at"] = new Date().toISOString();
  P.setProperties(props);
  for (let i = n; i < old; i++) P.deleteProperty(part + "_" + i);
}

function getPart(P, part) {
  const n = Number(P.getProperty(part + "_n") || 0);
  if (!n) return null;
  let s = "";
  for (let i = 0; i < n; i++) s += P.getProperty(part + "_" + i) || "";
  try {
    return { received_at: P.getProperty(part + "_at"), data: JSON.parse(s) };
  } catch (err) {
    return { received_at: P.getProperty(part + "_at"), error: "stored copy unreadable" };
  }
}

// v3: one Yes / No tap. Checked against the PC's newest masterhub part, never stored blind.
function decide(P, cfg, req) {
  if (!cfg.decide) return { error: "approvals aren't switched on in the relay yet" };
  if (same(cfg.decide, cfg.read) || same(cfg.decide, cfg.write)) return { error: "decide must be its own secret - fix SCOTT_HUB" };
  if (!same(req.dpass, cfg.decide)) return { error: "wrong decide pass" };
  const id = String(req.id || ""), answer = String(req.answer || "").toLowerCase(), sig = String(req.sig || "");
  if (!/^[AF]-\d{3,5}$/.test(id)) return { error: "bad id" };
  // A- = Claude's Yes / No question; F- = "Fix it" on an open fail (Step 3) - a request, yes only.
  const fix = id.charAt(0) === "F";
  if (fix ? answer !== "yes" : (answer !== "yes" && answer !== "no")) return { error: fix ? "a fix request is yes only" : "answer must be yes or no" };
  const mh = getPart(P, "masterhub");
  const blk = mh && mh.data && (fix ? mh.data.repairs : mh.data.approvals);
  if (!blk || !blk.enabled) return { error: (fix ? "Fix-it is" : "approvals are") + " switched off on the PC" };
  const q = ((fix ? blk.fixable : blk.open) || []).filter(function (x) { return x && x.id === id; })[0];
  if (!q) return { error: id + (fix ? " isn't an open fail any more" : " isn't an open question (already answered or withdrawn)") };
  if (q.sig !== sig) return { error: id + " changed since your phone loaded it - refresh and look again" };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const prior = listDecisions(P, DEC_KEEP).filter(function (d) { return d.id === id && d.sig === sig; })[0];
    if (prior) return { ok: true, already: true, decision: prior };
    const n = Number(P.getProperty("dec_n") || 0) + 1;
    const t = Date.parse(String(req.tapped_at || ""));      // a time or nothing - never free text
    const d = {
      uid: Utilities.getUuid(), seq: n, id: id, answer: answer, sig: sig,
      tapped_at: isNaN(t) ? "" : new Date(t).toISOString(), relay_at: new Date().toISOString()
    };
    const props = { dec_n: String(n) };
    props["dec_" + n] = JSON.stringify(d);
    P.setProperties(props);
    if (n > DEC_KEEP) P.deleteProperty("dec_" + (n - DEC_KEEP));
    return { ok: true, decision: d };
  } finally { lock.releaseLock(); }
}

// The newest `max` taps, oldest first.
function listDecisions(P, max) {
  const all = P.getProperties(), n = Number(all.dec_n || 0), rows = [];
  for (let i = Math.max(1, n - max + 1); i <= n; i++) {
    try { if (all["dec_" + i]) rows.push(JSON.parse(all["dec_" + i])); } catch (err) { /* skip a torn one */ }
  }
  return rows;
}

// v6: what Scott does with the home cards, for the PC to learn from. Checked field by field - nothing free-form
// is kept beyond a short card text - and stored as one property per call (learn_<seq>), newest LEARN_KEEP kept.
function learn(P, cfg, req) {
  if (!cfg.decide) return { error: "approvals aren't switched on in the relay yet" };
  if (same(cfg.decide, cfg.read) || same(cfg.decide, cfg.write)) return { error: "decide must be its own secret - fix SCOTT_HUB" };
  if (!same(req.dpass, cfg.decide)) return { error: "wrong decide pass" };
  const evs = Array.isArray(req.events) ? req.events.slice(0, LEARN_MAX) : [];
  const rec = { uid: Utilities.getUuid(), seq: 0, relay_at: new Date().toISOString(), events: [] };
  const ids = [];                 // every event used up (stored or dropped as junk) - the phone removes exactly these
  let taken = 0;
  for (let i = 0; i < evs.length; i++) {
    const e = evs[i];
    const id = e && typeof e === "object" && /^[a-z0-9]{1,24}$/.test(String(e.id || "")) ? String(e.id) : "";
    const how = e && typeof e === "object" ? String(e.how || "") : "";
    if (LEARN_HOWS.indexOf(how) < 0) { taken++; if (id) ids.push(id); continue; }        // junk: used up, not kept
    const t = Date.parse(String(e.at || ""));
    const cls = String(e.cls || ""), open = String(e.open || "");
    const row = {
      id: id, how: how, key: cutChars(e.key, LEARN_TEXT), text: cutChars(e.text, LEARN_TEXT),
      cls: ["bad", "warn", "good", ""].indexOf(cls) >= 0 ? cls : "", open: /^[a-z]{0,12}$/.test(open) ? open : "",
      at: isNaN(t) ? "" : new Date(t).toISOString()
    };
    rec.events.push(row);
    if (Utilities.newBlob(JSON.stringify(rec)).getBytes().length > LEARN_BYTES) { rec.events.pop(); break; }   // the rest waits for the next call
    taken++;
    if (id) ids.push(id);
  }
  if (!rec.events.length) return { ok: true, stored: 0, taken: taken, ids: ids };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const n = Number(P.getProperty("learn_n") || 0) + 1;
    rec.seq = n;
    const props = { learn_n: String(n) };
    props["learn_" + n] = JSON.stringify(rec);
    P.setProperties(props);
    if (n > LEARN_KEEP) P.deleteProperty("learn_" + (n - LEARN_KEEP));
    // a byte budget, not just a count: drop the oldest calls while all of them together pass LEARN_TOTAL
    const all = P.getProperties(), kept = [];
    let total = 0;
    for (let i = Math.max(1, n - LEARN_KEEP + 1); i <= n; i++) {
      const v = all["learn_" + i];
      if (v) { kept.push(["learn_" + i, v.length]); total += v.length; }
    }
    while (total > LEARN_TOTAL && kept.length > 1) { const k = kept.shift(); P.deleteProperty(k[0]); total -= k[1]; }
    return { ok: true, stored: rec.events.length, taken: taken, ids: ids };
  } finally { lock.releaseLock(); }
}

// v8: the idea box. Junk (no id, no words) is used up so the phone stops resending it; a re-sent id is harmless, the PC dedupes by id.
function idea(P, cfg, req) {
  if (!cfg.decide) return { error: "approvals aren't switched on in the relay yet" };
  if (same(cfg.decide, cfg.read) || same(cfg.decide, cfg.write)) return { error: "decide must be its own secret - fix SCOTT_HUB" };
  if (!same(req.dpass, cfg.decide)) return { error: "wrong decide pass" };
  const rows = Array.isArray(req.ideas) ? req.ideas.slice(0, IDEA_MAX) : [], ids = [];
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    let n = Number(P.getProperty("idea_n") || 0);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] && typeof rows[i] === "object" ? rows[i] : {};
      const id = /^[a-z0-9]{1,24}$/.test(String(r.id || "")) ? String(r.id) : "";
      const text = cutChars(String(r.text || "").trim(), IDEA_TEXT);
      if (id) ids.push(id);
      if (!id || !text) continue;
      const t = Date.parse(String(r.at || ""));
      n++;
      const props = { idea_n: String(n) };
      props["idea_" + n] = JSON.stringify({ id: id, text: text, at: isNaN(t) ? "" : new Date(t).toISOString(), relay_at: new Date().toISOString() });
      P.setProperties(props);
      if (n > IDEA_KEEP) P.deleteProperty("idea_" + (n - IDEA_KEEP));
    }
    const all = P.getProperties(), kept = [];
    let total = 0;
    for (let i = Math.max(1, n - IDEA_KEEP + 1); i <= n; i++) {
      const v = all["idea_" + i];
      if (v) { kept.push(["idea_" + i, v.length]); total += v.length; }
    }
    while (total > IDEA_TOTAL && kept.length > 1) { const k = kept.shift(); P.deleteProperty(k[0]); total -= k[1]; }
    return { ok: true, ids: ids };
  } finally { lock.releaseLock(); }
}
function listIdeas(P) {
  const all = P.getProperties(), n = Number(all.idea_n || 0), rows = [];
  for (let i = Math.max(1, n - IDEA_KEEP + 1); i <= n; i++) {
    try { if (all["idea_" + i]) rows.push(JSON.parse(all["idea_" + i])); } catch (err) { /* skip a torn one */ }
  }
  return rows;
}

// The newest `max` learn calls, oldest first.
function listLearn(P, max) {
  const all = P.getProperties(), n = Number(all.learn_n || 0), rows = [];
  for (let i = Math.max(1, n - max + 1); i <= n; i++) {
    try { if (all["learn_" + i]) rows.push(JSON.parse(all["learn_" + i])); } catch (err) { /* skip a torn one */ }
  }
  return rows;
}

// v2 (Scott 10/10: "access to calendar for everything we do"): every calendar on Scott's
// Google account, today + the next CAL_DAYS days, read here at request time so the phone
// sees it even when the PC is off. Read-only - never creates or changes an event.
const CAL_DAYS = 7;
const CAL_MAX = 80;
function calendar() {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + (CAL_DAYS + 1) * 86400000);
    const rows = [];
    CalendarApp.getAllCalendars().forEach(function (cal) {
      if (cal.isHidden && cal.isHidden()) return;
      cal.getEvents(start, end).forEach(function (ev) {
        rows.push({
          cal: cal.getName(), title: ev.getTitle(), allDay: ev.isAllDayEvent(),
          start: ev.getStartTime().toISOString(), end: ev.getEndTime().toISOString(),
          where: ev.getLocation() || ""
        });
      });
    });
    rows.sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });
    const out = { ok: true, events: rows.slice(0, CAL_MAX), more: Math.max(0, rows.length - CAL_MAX) };
    const b = birthdays(start);
    if (b.ok) { out.birthdays = b.list; out.birthdays_from = b.from; } else out.birthdays_error = b.error;
    return out;
  } catch (err) {
    return { ok: false, error: String(err && err.message || err) };   // not authorized yet, etc.
  }
}

// v7 (Scott 11/01: "should be able to get from my calendar all key bdays"): the next BDAY_DAYS days of birthdays come
// back as calendar.birthdays = [{title, day:"YYYY-MM-DD"}] (a handful a year), so the phone can show the next one even
// when it is weeks away. Two sources, both read-only:
//   1. Google's "Birthdays" calendar (built from Google Contacts) - NOT in getAllCalendars(), so read by its id;
//   2. yearly events on his own calendar titled birthday / bday / anniversary / 🎂 (the ones Claude adds for him).
// One that fails is skipped; only when both fail does the phone get birthdays_error. Never breaks the rest of get.
// birthdays_from = {contacts, mine} says which sources were read, so "none saved" can't hide a missing Contacts calendar.
// The window is today up to (not including) the same date next year - every date once, leap years too. The answer is
// kept BDAY_CACHE_S in the script cache: the phone asks every 2 minutes and a year of his calendar is slow to read.
const BDAY_CAL_IDS = ["addressbook#contacts@group.v.calendar.google.com", "#contacts@group.v.calendar.google.com"];
const BDAY_MAX = 40;
const BDAY_CACHE_S = 3600;
const BDAY_RE = /birthday|\bb-?day\b|🎂|anniversary/i;
function birthdays(start) {
  const cache = (function () { try { return CacheService.getScriptCache(); } catch (err) { return null; } })();
  const ck = "bday7|" + Utilities.formatDate(start, Session.getScriptTimeZone(), "yyyy-MM-dd");
  try { const hit = cache && cache.get(ck); if (hit) return JSON.parse(hit); } catch (err) { /* read it fresh */ }
  const r = readBirthdays(start);
  try { if (cache && r.ok) cache.put(ck, JSON.stringify(r), BDAY_CACHE_S); } catch (err) { /* too big / no cache: fine */ }
  return r;
}
function readBirthdays(start) {
  const end = new Date(start.getTime()); end.setFullYear(end.getFullYear() + 1);
  const rows = [], seen = {}, from = { contacts: false, mine: false };
  // getAllDayStartDate() is midnight in the SCRIPT's zone, so it is read back in that zone; a timed event uses its calendar's
  const day = (cal, ev) => ev.isAllDayEvent() ? Utilities.formatDate(ev.getAllDayStartDate(), Session.getScriptTimeZone(), "yyyy-MM-dd")
    : Utilities.formatDate(ev.getStartTime(), (cal.getTimeZone && cal.getTimeZone()) || Session.getScriptTimeZone(), "yyyy-MM-dd");
  const add = (cal, ev) => {
    const r = { title: String(ev.getTitle() || "").slice(0, 80), day: day(cal, ev) }, k = r.title + "|" + r.day;
    if (!seen[k]) { seen[k] = 1; rows.push(r); }
  };
  let last = "Birthdays calendar not found";
  for (let i = 0; i < BDAY_CAL_IDS.length && !from.contacts; i++) {
    try {
      const cal = CalendarApp.getCalendarById(BDAY_CAL_IDS[i]);
      if (!cal) continue;
      cal.getEvents(start, end).forEach(function (ev) { add(cal, ev); });
      from.contacts = true;
    } catch (err) { last = String(err && err.message || err); }
  }
  try {
    const mine = CalendarApp.getDefaultCalendar();
    mine.getEvents(start, end).forEach(function (ev) { if (BDAY_RE.test(String(ev.getTitle() || ""))) add(mine, ev); });
    from.mine = true;
  } catch (err) { last = String(err && err.message || err); }
  if (!from.contacts && !from.mine) return { ok: false, error: last.slice(0, 160) };
  rows.sort(function (a, b) { return a.day < b.day ? -1 : a.day > b.day ? 1 : 0; });
  return { ok: true, list: rows.slice(0, BDAY_MAX), from: from };
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
