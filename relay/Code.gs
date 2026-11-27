/* SAVE AS: Code.gs · LOCATION: C:/MarvelApps/scotthub/relay/Code.gs
 * (the live copy is a Google Apps Script web app in Scott's Google account,
 *  project "Scott Hub relay" — this file is the source of record)
 *
 * SCOTT HUB RELAY (Scott 2026-10-10: "a personalize app for myself giving me
 * updates on things i need to know when not home"). A private mailbox:
 *   PC  --(write key + snapshot part)--> relay  (stored in Script Properties)
 *   phone --(read pass)--> relay --> the latest parts
 * It is NOT the Day Hub AI relay (customers use that one) and it never calls
 * a paid outside service — no AI, no Whop, nothing that costs money. (v11: it reads
 * usemart.net's two public status pages every 10 minutes, nothing else.)
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
 * v9 (same day, "you still screen and file"): Archive / Trash / Undo taps on one email. Held here for the PC, which is the only thing that can act on them; this relay never touches mail.
 *
 * v10 (Scott 11/15: "Scott Hub Server checks bots good watcher good server up drives staying synced and alert notification if server is
 * down"): SERVER WATCH. A time trigger runs checkServer() every 10 minutes. The server counts as DOWN when the PC's newest part is fresh
 * and says the server isn't checking in, or when the PC's part is old AND the server's own report is old too (nobody has heard from it).
 * Two checks in a row before an email (a single blip never mails), one email when it goes down, one when it's back. The email goes to
 * this script's own Google account (Scott's Gmail), so the Gmail app on his phone rings. "get" also returns parts.watch = {state, since,
 * checked_at} so the phone can show the alert is on. Turn it on: run installServerWatch() once in the editor (it asks for the
 * "send email" + "triggers" permissions); removeServerWatch() turns it off. Nothing else changes.
 *
 * v11 (Scott 11/26, after usemart.net was down 9:42 PM -> 10:30 AM and nobody knew: "Yes, set it up" to a phone alert when it's
 * down 10+ minutes, "should be one of watchers on Scott Hub"): USEMART SITE WATCH, in the same 10-minute trigger. It reads
 * https://usemart.net/api/health (the site + the UseMart program answer) and /api/traffic (the database answers). Bad = no answer,
 * a 5xx, or health without ok:true. DOWN = still bad on a check 8+ minutes after the first bad one (two checks in a row - a blip
 * never mails). One email when it goes down, one when it's back, to the same Gmail. 403 / 429 = usemart.net turned the watch
 * away: "can't check", never a strike and never "up". "get" -> parts.watch.usemart = {state, since, why, checked_at, code, note}.
 * Needs one more permission (connect to an outside site), so run installServerWatch() once after this goes in and click Allow.
 * A UseMart check that throws never stops the server watch.
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
 *   {task:"mailact", dpass, actions:[{id, key, act, undoes, at}]}   phone (v9). act = archive | trash | undo. Reply {ok, ids}. PC: "pull".
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
const MACT_KEEP = 60;              // v9: mail taps kept for the PC
const MACT_MAX = 10;               // one call
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
      return out({ ok: true, decisions: listDecisions(P, DEC_KEEP), learn: listLearn(P, LEARN_KEEP), ideas: listIdeas(P), mail_actions: listMailActs(P) });
    }

    if (req.task === "decide") return out(decide(P, cfg, req));
    if (req.task === "learn") return out(learn(P, cfg, req));
    if (req.task === "idea") return out(idea(P, cfg, req));
    if (req.task === "mailact") return out(mailAct(P, cfg, req));

    if (!same(req.pass, cfg.read)) return out({ error: "wrong passphrase" });
    if (req.task === "ping") return out({ ok: true, app: "scotthub-relay", decide: !!cfg.decide, server: !!cfg.server, usemart: !!cfg.usemart });
    if (req.task === "get") {
      const parts = {};
      PARTS.forEach(function (p) { parts[p] = getPart(P, p); });
      const taps = listDecisions(P, DEC_SHOWN).map(function (d) {
        return { id: d.id, answer: d.answer, sig: d.sig, tapped_at: d.tapped_at, relay_at: d.relay_at };
      });
      parts.watch = watchInfo(P);              // v10
      return out({ ok: true, now: new Date().toISOString(), parts: parts, calendar: calendar(), decisions: taps });
    }
    return out({ error: "unknown task" });
  } catch (err) {
    return out({ error: String(err && err.message || err) });
  }
}

function doGet() { return out({ ok: true, app: "scotthub-relay" }); }

// ---------------------------------------------------------------- v10 SERVER WATCH (see the header)
const WATCH_STALE_MIN = 20;        // the PC part comes every 5 min, the server's report every 5 min while the PC is off
function partAgeMin(P, part) {
  const at = P.getProperty(part + "_at");
  return at ? (Date.now() - new Date(at).getTime()) / 60000 : null;
}
function serverState(P) {
  const mAge = partAgeMin(P, "masterhub"), sAge = partAgeMin(P, "server");
  if (mAge == null && sAge == null) return { down: false, why: "" };   // nothing has ever reported here: not set up, not "down"
  if (mAge != null && mAge <= WATCH_STALE_MIN) {
    const m = getPart(P, "masterhub") || {}, sv = (((m.data || {}).health) || {}).server || {};
    if (sv.error) return { down: false, why: "" };                    // the PC couldn't read the status file: not proof either way
    const hb = sv.heartbeat_age_min;
    if (sv.alive === false || (hb != null && hb > WATCH_STALE_MIN))
      return { down: true, why: "The PC sees the server not checking in (last heartbeat " + (hb != null ? Math.round(hb) + " min ago" : "unknown") + ")." };
    return { down: false, why: "" };
  }
  if (sAge != null && sAge <= WATCH_STALE_MIN) return { down: false, why: "" };
  const quiet = Math.round(Math.min(mAge == null ? 99999 : mAge, sAge == null ? 99999 : sAge));
  return { down: true, why: "Nothing from the server or the PC for " + (quiet >= 99999 ? "a long time" : quiet + " min") + " (power, internet or both)." };
}
function checkServer() {
  const P = PropertiesService.getScriptProperties();
  let um = null;
  try { um = checkUseMart(P); }            // v11 - its own try: a UseMart problem never stops the server watch below
  catch (err) { P.setProperty("um_note", "the watch itself failed: " + cutChars(String(err && err.message || err), 200)); }
  const st = serverState(P), was = P.getProperty("watch_state") || "up", strikes = Number(P.getProperty("watch_strikes") || 0);
  P.setProperty("watch_checked_at", new Date().toISOString());
  if (st.down) {
    P.setProperty("watch_strikes", String(strikes + 1));
    if (was !== "down" && strikes + 1 >= 2) {
      P.setProperty("watch_state", "down");
      P.setProperty("watch_since", new Date().toISOString());
      P.setProperty("watch_why", st.why);
      mailMe("⚠️ CMMG server looks DOWN", st.why + "\n\nChecked twice, 10 minutes apart. Remote Desktop: 93.127.143.55:1097.");
    }
  } else {
    P.setProperty("watch_strikes", "0");
    if (was === "down") {
      const since = P.getProperty("watch_since");
      P.setProperty("watch_state", "up");
      mailMe("✅ CMMG server is back", "It's checking in again" + (since ? " (it looked down since " + since + ")" : "") + ".");
    }
  }
  Logger.log(JSON.stringify({ server: st, usemart: um }));
  return st;
}
function mailMe(subject, body, what) {
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), subject, body + "\n\n- Scott Hub relay, " + (what || "server watch") + " (every 10 min)");
}
function watchInfo(P) {
  return { state: P.getProperty("watch_state") || "up", since: P.getProperty("watch_since") || null,
           why: P.getProperty("watch_why") || null, checked_at: P.getProperty("watch_checked_at") || null,
           usemart: { state: P.getProperty("um_state") || "up", since: P.getProperty("um_since") || null, why: P.getProperty("um_why") || null,
                      checked_at: P.getProperty("um_checked_at") || null, code: Number(P.getProperty("um_code") || 0) || null,
                      note: P.getProperty("um_note") || null } };       // v11
}

// ---------------------------------------------------------------- v11 USEMART SITE WATCH (see the header)
const UM_HEALTH_URL = "https://usemart.net/api/health";
const UM_DB_URL = "https://usemart.net/api/traffic";
const UM_DOWN_AFTER_MIN = 8;       // still bad 8+ min after the first bad check = the next 10-minute check
function fetchCode(url) {
  try {
    const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true, headers: { "Cache-Control": "no-cache" } });
    return { code: r.getResponseCode(), text: cutChars(r.getContentText(), 4000) };
  } catch (err) {
    return { code: 0, text: cutChars(String(err && err.message || err), 300) };
  }
}
function usemartState() {
  const h = fetchCode(UM_HEALTH_URL);
  if (h.code === 403 || h.code === 429) return { state: "unknown", code: h.code, why: "usemart.net turned the watch away (" + h.code + "), so it can't tell from here" };
  let j = null;
  try { j = JSON.parse(h.text); } catch (e) { j = null; }
  if (h.code !== 200 || !j || j.ok !== true) {
    const why = h.code === 502 ? "usemart.net answers 502: nothing is running behind Cloudflare (the UseMart program or its database stopped)"
              : h.code === 524 ? "usemart.net answers 524: the server took too long to answer"
              : h.code ? "usemart.net answers " + h.code
              : "usemart.net did not answer (" + cutChars(h.text, 120) + ")";
    return { state: "down", code: h.code, why: why };
  }
  const d = fetchCode(UM_DB_URL);
  if (d.code === 0 || d.code >= 500) return { state: "down", code: d.code, build: j.build || "", why: "The site answers but its database doesn't (" + (d.code || "no answer") + " from /api/traffic)" };
  return { state: "up", code: 200, build: j.build || "", why: "" };
}
function ctTime(iso) {             // "9:42 PM Wed Nov 25 CT" - Scott's own time
  try { return Utilities.formatDate(new Date(iso), "America/Chicago", "h:mm a EEE MMM d") + " CT"; } catch (e) { return String(iso); }
}
function checkUseMart(P) {
  const st = usemartState(), nowIso = new Date().toISOString(), was = P.getProperty("um_state") || "up";
  P.setProperty("um_checked_at", nowIso);
  P.setProperty("um_code", String(st.code || 0));
  if (st.state === "unknown") { P.setProperty("um_note", st.why); return st; }     // neither a strike nor a clear
  P.deleteProperty("um_note");
  if (st.state === "down") {
    const first = P.getProperty("um_first_bad") || nowIso;
    P.setProperty("um_first_bad", first);
    const badMin = (Date.now() - new Date(first).getTime()) / 60000;
    if (was !== "down" && badMin >= UM_DOWN_AFTER_MIN) {
      P.setProperty("um_state", "down");
      P.setProperty("um_since", first);
      P.setProperty("um_why", st.why);
      mailMe("⚠️ usemart.net is DOWN", st.why + ".\n\nBad on every check since " + ctTime(first) + " (" + Math.round(badMin) + " min)." +
             "\n\nTo bring it back: Remote Desktop to the server (93.127.143.55:1097) and tell the UseMart Claude window: usemart.net is down - bring it back.",
             "usemart.net watch");
    }
  } else {
    P.deleteProperty("um_first_bad");
    if (was === "down") {
      const since = P.getProperty("um_since"), mins = since ? Math.round((Date.now() - new Date(since).getTime()) / 60000) : null;
      P.setProperty("um_state", "up");
      P.deleteProperty("um_why");
      mailMe("✅ usemart.net is back", "It answers again" + (st.build ? " (build " + st.build + ")" : "") + (mins != null ? " - it was down about " + mins + " min, since " + ctTime(since) : "") + ".",
             "usemart.net watch");
    }
  }
  return st;
}
function installServerWatch() {
  removeServerWatch();
  ScriptApp.newTrigger("checkServer").timeBased().everyMinutes(10).create();
  return checkServer();
}
function removeServerWatch() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "checkServer") ScriptApp.deleteTrigger(t); });
}

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
// v9: an Archive / Trash / Undo tap. Junk is used up so the phone stops resending it; the PC runs each id once.
function mailAct(P, cfg, req) {
  if (!cfg.decide) return { error: "approvals aren't switched on in the relay yet" };
  if (same(cfg.decide, cfg.read) || same(cfg.decide, cfg.write)) return { error: "decide must be its own secret - fix SCOTT_HUB" };
  if (!same(req.dpass, cfg.decide)) return { error: "wrong decide pass" };
  const rows = Array.isArray(req.actions) ? req.actions.slice(0, MACT_MAX) : [], ids = [];
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    let n = Number(P.getProperty("mact_n") || 0);
    const held = listMailActs(P).map(function (x) { return x.id; });
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] && typeof rows[i] === "object" ? rows[i] : {};
      const id = /^[a-z0-9]{1,24}$/.test(String(r.id || "")) ? String(r.id) : "";
      if (id) ids.push(id);
      const act = String(r.act || ""), key = String(r.key || ""), undoes = String(r.undoes || "");
      if (!id || ["archive", "trash", "undo"].indexOf(act) < 0 || !/^[0-9a-f]{16}$/.test(key)) continue;
      if (act === "undo" && !/^[a-z0-9]{1,24}$/.test(undoes)) continue;
      if (held.indexOf(id) >= 0) continue;     // a resend after a lost reply: the PC runs each id once, and it shouldn't use up a slot
      held.push(id);
      n++;
      const props = { mact_n: String(n) };
      props["mact_" + n] = JSON.stringify({ id: id, key: key, act: act, undoes: act === "undo" ? undoes : "", relay_at: new Date().toISOString() });
      P.setProperties(props);
      if (n > MACT_KEEP) P.deleteProperty("mact_" + (n - MACT_KEEP));
    }
    return { ok: true, ids: ids };
  } finally { lock.releaseLock(); }
}
function listMailActs(P) {
  const all = P.getProperties(), n = Number(all.mact_n || 0), rows = [];
  for (let i = Math.max(1, n - MACT_KEEP + 1); i <= n; i++) {
    try { if (all["mact_" + i]) rows.push(JSON.parse(all["mact_" + i])); } catch (err) { /* skip a torn one */ }
  }
  return rows;
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
