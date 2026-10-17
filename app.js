/* SAVE AS: app.js · LOCATION: C:/MarvelApps/scotthub/app.js
 * SCOTT HUB - reads the two snapshot parts from Scott's private relay and lays them out
 * in the hub-family three bands (Scott 2026-10-06 layout rule). No data lives in this
 * file or this site: the read pass arrives ONCE through a setup link (#k=...), is kept in
 * this phone's storage, and the hash is wiped from the address bar straight away.
 * The last good answer is kept on the phone so the app still opens with no signal
 * (it says how old it is).
 * Snapshot writers: C:/MasterHub/scott_hub_snapshot.py + C:/MarvelDesktop/scott_hub_snapshot.py
 *
 * v11 APPROVALS (Scott 10/17: "approvals and changes through my scott hub app that should be
 * tied to my claude"): Yes / No on Claude's open questions (A-001 ...). Needs a SECOND pass,
 * the decide pass, from its own one-time link (#d=...) - the read pass can't decide. A tap
 * sends only the id, yes|no and the question's sig; two taps to confirm, and the first answer
 * stands. The PC (C:/MasterHub/scott_approvals.py) shows "received" back in its snapshot.
 * v12 FIX IT (Scott 10/17): each open fail on Health has a two-tap "Fix it" (sends the F- id + sig
 * only). Claude builds the fix switched OFF and offers it back as an A- question; its status
 * (requested / working / fix ready / needs you at the PC / cleared) comes from scott_repairs.py.
 * v13 SERVER REPORT (Scott 10/17: "what makes the server do all same stuff when pc is off?"): a third
 * part, "server", sent by the server itself (C:/MasterHub/scott_hub_server.py) every 5 min while the PC
 * is off - heartbeat, bots, ops runner, its alerts; never bets or money. When the PC's part is stale and
 * the server's is fresh, the top line reads "PC off - server report" and Health leads with it.
 */
"use strict";

const RELAY = "https://script.google.com/macros/s/AKfycbwe4-nvSlI5rVpIJhTprZks_xlv6uOSM5KUzxnXpWkp5rxXVWS3b0tMwzDQgW-X073l/exec";
const K_PASS = "scotthub.k", K_LAST = "scotthub.last", K_PAID = "scotthub.paid";
const K_DEC = "scotthub.d", K_TAPS = "scotthub.taps";
const CONFIRM_MS = 6000;       // second tap must come within 6 s
const STALE_MIN = 15;          // PC writes every 5 min; 3 misses = say so
const SERVER_STALE_MIN = 15;   // the server writes every 5 min while the PC is off
const REFRESH_MS = 120000;
const TZ = "America/Chicago";
// ops_sentinel reads data\server_ops_status.json, but the real file is in the Drive
// control folder (found 10/10) - these two alerts are false while the runner reports.
const FALSE_WHEN_RUNNER_FRESH = /Server ops runner failing|ops-runner heartbeat file is missing/i;

let DATA = null, CAL = null, FETCHED_AT = null, LAST_ERR = null, CAL_FILTER = "all", CAL_EARLY = false;
let RELAY_TAPS = [], ARMED = null, SENDING = false;

const $ = s => document.querySelector(s);
const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
};
const money = n => n == null ? "-" : (n < 0 ? "-$" : "$") + Math.abs(Number(n)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const units = n => n == null ? "-" : (n >= 0 ? "+" : "") + Number(n).toFixed(2) + "u";
const sign = n => n == null ? "" : (n >= 0 ? "pos" : "neg");
const ageMin = iso => iso ? (Date.now() - new Date(iso).getTime()) / 60000 : null;
const t12 = iso => new Date(iso).toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
const dayName = ymd => new Date(ymd + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
function ago(min) {
  if (min == null) return "never";
  if (min < 1) return "just now";
  if (min < 60) return Math.round(min) + " min ago";
  if (min < 48 * 60) return Math.round(min / 60) + " h ago";
  return Math.round(min / 1440) + " days ago";
}
function todayCT() { return new Date().toLocaleDateString("en-CA", { timeZone: TZ }); }
function addDays(ymd, n) { const d = new Date(ymd + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

// ── setup: pass from #k= once ─────────────────────────────────
function takePassFromLink() {
  const m = location.hash.match(/[#&]k=([^&]+)/), d = location.hash.match(/[#&]d=([^&]+)/);
  if (m) store.set(K_PASS, decodeURIComponent(m[1]));
  if (d) store.set(K_DEC, decodeURIComponent(d[1]));
  if (m || d) history.replaceState(null, "", location.pathname + location.search);
}

// ── fetch ─────────────────────────────────────────────────────
async function load() {
  const pass = store.get(K_PASS);
  if (!pass) { $("#setup").classList.remove("hidden"); return; }
  try {
    const r = await fetch(RELAY, { method: "POST", body: JSON.stringify({ task: "get", pass }) });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "relay said no");
    DATA = j.parts; CAL = j.calendar || null; RELAY_TAPS = j.decisions || []; FETCHED_AT = new Date().toISOString(); LAST_ERR = null;
    store.set(K_LAST, JSON.stringify({ parts: DATA, cal: CAL, taps: RELAY_TAPS, at: FETCHED_AT }));
  } catch (e) {
    LAST_ERR = String(e.message || e);
    if (!DATA) {
      const c = JSON.parse(store.get(K_LAST) || "null");
      if (c) { DATA = c.parts; CAL = c.cal || null; RELAY_TAPS = c.taps || []; FETCHED_AT = c.at; }
    }
  }
  render();
}

const mh = () => (DATA && DATA.masterhub && DATA.masterhub.data) || {};
const dk = () => (DATA && DATA.desktop && DATA.desktop.data) || {};
// v13: the server's own report. Its numbers and words are shown escaped, never trusted as markup.
const arr = x => Array.isArray(x) ? x : [];
const obj = x => (x && typeof x === "object" && !Array.isArray(x)) ? x : {};
const sv13 = () => obj(DATA && DATA.server && DATA.server.data);
const svAlerts = S => arr(S.alerts).filter(x => x && typeof x === "object" && !Array.isArray(x));
// Age by the relay's clock (when it arrived), not the server's - a skewed server clock can't fake "fresh".
const svAge = () => ageMin((DATA && DATA.server && DATA.server.received_at) || sv13().generated_at);
const pcStale = () => { const a = ageMin(mh().generated_at); return a == null || a > STALE_MIN; };
// "PC off - server report": the PC's part is stale and the server's is fresh.
const serverOn = () => { const a = svAge(); return pcStale() && a != null && a <= SERVER_STALE_MIN; };

function healthAlerts() {
  const h = mh().health || {};
  const runnerFresh = h.server && h.server.ops_runner_age_min != null && h.server.ops_runner_age_min <= 45;
  const all = h.alerts || [];
  const shown = all.filter(a => !(runnerFresh && FALSE_WHEN_RUNNER_FRESH.test(a.title || "")));
  return { shown, hidden: all.length - shown.length };
}

// ── top: clock + freshness ────────────────────────────────────
function tickClock() {
  const now = new Date();
  $("#clock").textContent = now.toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
  $("#date").textContent = now.toLocaleDateString("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" });
  const hr = Number(now.toLocaleString("en-US", { timeZone: TZ, hour: "numeric", hour12: false }));
  $("#hello").textContent = (hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening") + ", Scott";
  paintFresh();
}

function paintFresh() {
  const f = $("#fresh");
  const gen = mh().generated_at;
  const a = ageMin(gen);
  if (!DATA) { f.className = "fresh down"; f.textContent = LAST_ERR ? "Can't reach the relay - " + LAST_ERR : "connecting…"; return; }
  const off = LAST_ERR ? " · offline copy" : "";
  if (serverOn()) { f.className = "fresh stale"; f.textContent = "PC off - server report " + ago(svAge()) + (a != null ? " · PC quiet since " + t12(gen) : "") + off; return; }
  if (a == null) { f.className = "fresh down"; f.textContent = "No report from the PC yet"; return; }
  if (a <= STALE_MIN) { f.className = "fresh ok"; f.textContent = "PC report " + ago(a) + off; }
  else { f.className = "fresh " + (a > 60 ? "down" : "stale"); f.textContent = "PC quiet since " + t12(gen) + " (" + ago(a) + ")" + off; }
}

// ── PAID (Scott 10/10: "needs button for when it paid to remove") ──
// Scott's tap is final. Kept on this phone; the key carries the due date, so next
// month's bill or a new alert for the same card shows up again on its own.
function paidMap() { try { return JSON.parse(store.get(K_PAID) || "{}"); } catch (e) { return {}; } }
function setPaid(key, on) {
  const m = paidMap();
  if (on) m[key] = new Date().toISOString(); else delete m[key];
  const cut = addDays(todayCT(), -60);                       // forget marks older than 60 days
  Object.keys(m).forEach(k => { if (m[k].slice(0, 10) < cut) delete m[k]; });
  store.set(K_PAID, JSON.stringify(m));
}
const billKey = x => "bill:" + x.date + "|" + x.name;
const alertKey = a => "alert:" + (a.id || a.title) + "|" + (a.when || "");
const isPaid = k => !!paidMap()[k];
const dueOpen = mo => (mo.due_7d || []).filter(x => !isPaid(billKey(x)));
const alertsOpen = mo => (mo.alerts || []).filter(a => !isPaid(alertKey(a)));

// ── calendar (read live by the relay from Scott's Google Calendar) ──
// Same title + same start on two calendars = one event. An all-day title that repeats on
// 3+ days (InDebted puts "Unsubscribe from payment reminders" on EVERY day) = one line.
function calEvents() {
  const raw = (CAL && CAL.ok && CAL.events) || [], seen = new Set(), out = [];
  const dayCount = {};
  raw.forEach(e => { if (e.allDay) dayCount[e.title] = (dayCount[e.title] || 0) + 1; });
  const shownRepeat = new Set();
  raw.forEach(e => {
    const k = e.title + "|" + e.start;
    if (seen.has(k)) return;
    seen.add(k);
    if (e.allDay && dayCount[e.title] >= 3) {
      if (shownRepeat.has(e.title)) return;
      shownRepeat.add(e.title);
      e = Object.assign({}, e, { repeats: dayCount[e.title] });
    }
    out.push(e);
  });
  return out;
}
const evDay = e => e.allDay ? e.start.slice(0, 10) : new Date(e.start).toLocaleDateString("en-CA", { timeZone: TZ });
const evTime = e => e.allDay ? "All day" : t12(e.start) + (e.end ? " - " + t12(e.end) : "");
function todayEvents() {
  const t = todayCT(), now = Date.now();
  return calEvents().filter(e => !e.repeats && evDay(e) === t && (e.allDay || new Date(e.end).getTime() > now));
}

// ── approvals (v11) ───────────────────────────────────────────
// What the relay or this phone already holds for THIS wording (id + sig) of a question.
const ap = () => mh().approvals || {};
const apOpen = () => ap().open || [];
const tapKey = q => q.id + "|" + q.sig;
function tapsMap() { try { return JSON.parse(store.get(K_TAPS) || "{}"); } catch (e) { return {}; } }
function setTap(k, v) {
  const m = tapsMap(), cut = Date.now() - 30 * 86400000;
  m[k] = v;
  Object.keys(m).forEach(x => { if (new Date(m[x].at).getTime() < cut) delete m[x]; });
  store.set(K_TAPS, JSON.stringify(m));
}
function tapFor(q) {
  const r = RELAY_TAPS.filter(d => d.id === q.id && d.sig === q.sig)[0];
  if (r) return { answer: r.answer, at: r.relay_at };
  const l = tapsMap()[tapKey(q)];
  return l && l.state === "sent" ? { answer: l.answer, at: l.at } : null;
}
const apWaiting = () => apOpen().filter(q => !tapFor(q));
const when = iso => iso ? new Date(iso).toLocaleDateString("en-US", { timeZone: TZ, month: "short", day: "numeric" }) + " " + t12(iso) : "";

// Yes / No sit on their own line as two big fixed-size buttons: arming changes the LABEL only,
// never the size or place, so the second tap lands where the first did (a growing button made
// the row re-wrap and the confirm tap miss - found in the 10/17 click test).
function apCard(q, can) {
  const t = tapFor(q), l = tapsMap()[tapKey(q)];
  let act;
  if (t) act = `<div class="ap-sent"><b class="${t.answer === "yes" ? "pos" : "neg"}">${esc(t.answer.toUpperCase())}</b> sent ${esc(t12(t.at))} · the PC picks it up within 5 min</div>`;
  else if (!can) act = `<div class="ap-sent">This phone can't answer.</div>`;
  else {
    const armed = a => ARMED && ARMED.k === tapKey(q) && ARMED.answer === a;
    const btn = a => `<button class="pay${a === "no" ? " undo" : ""}${armed(a) ? " armed" : ""}" data-ap="${esc(q.id)}" data-ans="${a}"${SENDING ? " disabled" : ""}>${armed(a) ? "Tap again: " + a.toUpperCase() : a === "yes" ? "Yes" : "No"}</button>`;
    act = `<div class="ap-btns">${btn("yes")}${btn("no")}</div>` + (l && l.state === "error" ? `<small class="neg">${esc(l.err)}</small>` : "");
  }
  return `<div class="ap-q"><div>${esc(q.id)} · ${esc(q.ask)}</div><small>Claude: ${esc(q.rec)}${q.why ? " · " + esc(q.why) : ""}</small>${q.does ? `<small>${esc(q.does)}</small>` : ""}${act}</div>`;
}

// Two taps: the first arms the button, the second (within CONFIRM_MS) sends. Only the id,
// yes|no and the sig leave the phone - never typed text.
async function sendTap(id, answer) {
  const q = apOpen().concat(fxList()).filter(x => x.id === id)[0];      // A- question or F- fail (Fix it)
  if (!q || SENDING) return;
  const k = tapKey(q), here = () => $("#sheet").dataset.key || "approvals";
  if (!ARMED || ARMED.k !== k || ARMED.answer !== answer || Date.now() - ARMED.at > CONFIRM_MS) {
    const mine = ARMED = { k, answer, at: Date.now() }, sheet = here();
    openSheet(sheet);
    setTimeout(() => { if (ARMED === mine) { ARMED = null; if (here() === sheet) openSheet(sheet); } }, CONFIRM_MS);
    return;
  }
  ARMED = null; SENDING = true; openSheet(here());
  try {
    const r = await fetch(RELAY, { method: "POST", body: JSON.stringify({ task: "decide", dpass: store.get(K_DEC), id: q.id, answer, sig: q.sig, tapped_at: new Date().toISOString() }) });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "relay said no");
    const d = j.decision || {};       // "already": the earlier answer stands
    setTap(k, { state: "sent", answer: d.answer || answer, at: d.relay_at || new Date().toISOString() });
  } catch (e) {
    setTap(k, { state: "error", answer, at: new Date().toISOString(), err: "Not sent: " + String(e.message || e) });
  }
  SENDING = false;
  await load();
}

// ── Fix it (v12, Step 3): every open fail can be handed to Claude ──
// A tap sends only the F- id + its sig. Claude diagnoses and builds the fix switched OFF; it comes
// back as a Yes / No in Approvals, and nothing turns on without that Yes.
const fx = () => mh().repairs || {};
const fxList = () => fx().fixable || [];
const FX_STATUS = {
  requested: f => "🔧 Fix requested " + (f.at ? t12(f.at) : "") + " · Claude picks it up when the repairs routine runs",
  working: () => "🛠️ Claude is working on it",
  fix_ready: f => "✅ Fix ready - answer " + (f.offer || "it") + " in Approvals (nothing is on until your Yes)",
  needs_pc: f => "🖥️ Needs you at the PC" + (f.note ? ": " + f.note : ""),
  cleared: () => "✅ cleared",
};
function fixCard(f, can) {
  const t = tapFor(f);
  let act;
  if (f.status && f.status !== "open") act = `<div class="ap-sent">${esc((FX_STATUS[f.status] || (s => s.status))(f))}</div>`;
  else if (t) act = `<div class="ap-sent">🔧 Fix request sent ${esc(t12(t.at))} · the PC picks it up within 5 min</div>`;
  else if (!can) act = `<div class="ap-sent">This phone can't send fix requests.</div>`;
  else {
    const armed = ARMED && ARMED.k === tapKey(f);
    act = `<div class="ap-btns"><button class="pay${armed ? " armed" : ""}" data-ap="${esc(f.id)}" data-ans="yes"${SENDING ? " disabled" : ""}>${armed ? "Tap again: FIX IT" : "🔧 Fix it"}</button></div>`;
    const l = tapsMap()[tapKey(f)];
    if (l && l.state === "error") act += `<small class="neg">${esc(l.err)}</small>`;
  }
  return `<div class="ap-q"><div class="${f.severity === "FAIL" ? "neg" : "old"}">${esc(f.id)} · ${esc(f.title)}</div>${f.detail ? `<small>${esc(f.detail)}</small>` : ""}${act}</div>`;
}

// ── middle: what needs you ────────────────────────────────────
function needs() {
  const out = [], m = mh(), d = dk(), h = m.health || {}, b = m.bets || {}, mo = d.money || {};
  const add = (cls, text, sub, open) => out.push({ cls, text, sub, open });

  const a = ageMin(m.generated_at), S = serverOn() ? sv13() : null;
  if (S) add("warn", "PC off - server report", (a != null ? "PC quiet since " + t12(m.generated_at) + ". " : "") + "The server checks in every 5 min - its health is under Health. Bets and money are the PC's from then.", "health");
  else if (a != null && a > STALE_MIN) {
    add(a > 60 ? "bad" : "warn", "PC hasn't reported since " + t12(m.generated_at), "Numbers below are from then. PC off, asleep, or the upload stopped.", "health");
    if (DATA.server && a > 30) add("warn", "No server report either - last one " + ago(svAge()), "The server sends one only while it sees the PC off.", "health");
  }
  if (S) {
    const sa = svAlerts(S), sf = sa.filter(x => x.severity === "FAIL"), sw = sa.length - sf.length, bots = Object.entries(obj(S.bots));
    if (sf.length) add("bad", sf.length + " red alert" + (sf.length > 1 ? "s" : "") + " on the server", sf.slice(0, 2).map(x => x.title).join(" · "), "health");
    else add(obj(S.runner).running_operation === true && !sw ? "good" : "warn", "Server up · " + bots.filter(([, up]) => up === true).length + "/" + bots.length + " bots running",
             (obj(S.runner).text || "") + (sw ? " · " + sw + " yellow alert" + (sw > 1 ? "s" : "") + " under Health" : ""), "health");
  }
  const qs = ap().enabled ? apWaiting() : [];
  if (qs.length) add("warn", "🗳️ " + qs.length + " question" + (qs.length > 1 ? "s" : "") + " from Claude", qs.slice(0, 2).map(q => q.id + " " + q.ask).join(" · "), "approvals");
  const ready = fx().enabled ? fxList().filter(f => f.status === "fix_ready") : [];
  if (ready.length) add("good", "✅ " + ready.length + " fix" + (ready.length > 1 ? "es" : "") + " ready for your Yes", ready.slice(0, 2).map(f => f.title).join(" · "), "approvals");
  if (h.pc && h.pc.active === false) add("warn", h.pc.handed_to_server ? "PC handed the operation to the server" : "MasterHub app isn't running on the PC", "Last PC heartbeat " + ago(h.pc.heartbeat_age_min), "health");
  const sv = h.server || {};
  if (!S) {             // the PC's view of the server - replaced by the server's own report while it's in use
    if (sv.alive === false) add("bad", "Server isn't checking in", "Last heartbeat " + ago(sv.heartbeat_age_min), "health");
    const down = Object.entries(sv.bots || {}).filter(([, up]) => !up).map(([k]) => k);
    if (down.length) add("bad", "Bot down: " + down.join(", "), "", "health");
  }
  const al = healthAlerts().shown, fails = al.filter(x => x.severity === "FAIL");
  if (fails.length) add("bad", fails.length + " red alert" + (fails.length > 1 ? "s" : "") + " on the PC", fails.slice(0, 2).map(x => x.title).join(" · ") + (fx().enabled ? " · tap to have Claude fix it" : ""), "health");

  const nowA = alertsOpen(mo).filter(x => x.severity === "NOW");
  if (nowA.length) add("bad", nowA.length + " money alert" + (nowA.length > 1 ? "s" : "") + " need you now", nowA.slice(0, 2).map(x => x.title.split("  -  ")[0]).join(" · "), "money");
  const t = todayCT(), tm = addDays(t, 1);
  const soon = dueOpen(mo).filter(x => x.date === t || x.date === tm);
  if (soon.length) add("warn", soon.length + " bill" + (soon.length > 1 ? "s" : "") + " due today/tomorrow - " + money(soon.reduce((s, x) => s + Number(x.amount || 0), 0)), soon.map(x => x.name).slice(0, 3).join(" · "), "money");
  const fn = mo.cash && mo.cash.first_negative;
  if (fn && fn <= addDays(t, 7)) add("warn", "Cash forecast goes negative " + dayName(fn), "Balances are " + oldestBalance(mo) + " old - check before trusting it", "money");

  const te = todayEvents(), timed = te.filter(e => !e.allDay);
  if (timed.length) {
    const nx = timed[0], soon = (new Date(nx.start).getTime() - Date.now()) / 60000;
    add(soon <= 60 ? "warn" : "", (soon <= 0 ? "Now: " : "Next: ") + t12(nx.start) + " " + nx.title,
        (nx.where ? nx.where + " · " : "") + te.length + " on your calendar today", "calendar");
  } else if (te.length) add("", te.length + " all-day item" + (te.length > 1 ? "s" : "") + " today", te.map(e => e.title).slice(0, 2).join(" · "), "calendar");

  const adFails = [].concat(...(((d.ads || {}).sections) || []).filter(s => /^ADS/i.test(s.title)).map(s => s.rows))
    .filter(r => r.state === "FAILED");
  if (adFails.length) add("warn", "📣 " + adFails.length + " ad channel" + (adFails.length > 1 ? "s" : "") + " failed yesterday",
      adFails.map(r => r.task.replace(/ - .*/, "")).join(" · "), "ads");
  const em = d.email || {};
  const sl = (em.sales || {}).rows || [], newSale = sl.filter(r => r.date >= addDays(todayCT(), -2));
  if (newSale.length) add("good", "💰 " + newSale.length + " new sale" + (newSale.length > 1 ? "s" : "") + " (Winible/Whop)",
      newSale.slice(0, 2).map(r => r.platform + ": " + r.subject).join(" · "), "business");
  if (em.recruiter_count) add("warn", "💼 " + em.recruiter_count + " recruiter message" + (em.recruiter_count > 1 ? "s" : "") + " (last " + em.days + " days)",
      (em.recruiters || []).slice(0, 2).map(r => r.from + ": " + r.subject).join(" · ") + ((em.recruiters || []).some(r => r.archived) ? " - auto-archived, not in your inbox" : ""), "email");
  const deadBox = (em.inboxes || []).filter(i => i.status && i.status !== "ok");
  if (deadBox.length) add("warn", deadBox.length + " inbox" + (deadBox.length > 1 ? "es" : "") + " can't be read: " + deadBox.map(i => i.inbox).join(", "), "Login refused - mail there isn't being checked", "email");

  if (b.today && b.today.pending) add("", b.today.pending + " bet" + (b.today.pending > 1 ? "s" : "") + " still pending today", "Today so far " + b.today.record + " " + units(b.today.units), "bets");
  if (b.open_lives_count) add("", b.open_lives_count + " Lives bet" + (b.open_lives_count > 1 ? "s" : "") + " open", "", "bets");

  const oc = h.odds_credits || {}, act = oc[(oc.active_key || "primary") + "_credits"];
  if (typeof act === "number" && act >= 0 && act < 50000) add("warn", "Odds API key running low: " + act.toLocaleString() + " credits", "", "health");

  if (!out.length) add("good", "All quiet. Nothing needs you right now.", "", null);
  return out;
}

function oldestBalance(mo) {
  const ds = ((mo.cash || {}).accounts || []).map(a => a.days_old).filter(n => n != null && n < 400);
  return ds.length ? Math.max(...ds) + " days" : "unknown";
}

function renderNeeds() {
  $("#needs").innerHTML = needs().map(n =>
    `<li class="${n.cls}"${n.open ? ` data-open="${n.open}" role="button" tabindex="0"` : ""}>${esc(n.text)}${n.sub ? `<small>${esc(n.sub)}</small>` : ""}</li>`).join("");
}

function renderGlance() {
  const b = mh().bets || {}, mo = dk().money || {}, td = b.today || {}, wk = b.week || {}, t5 = b.top5 || {};
  const tile = (k, v, s, cls) => `<div class="tile"><div class="k">${esc(k)}</div><div class="v ${cls || ""}">${esc(v)}</div><div class="s">${esc(s || "")}</div></div>`;
  $("#glance").innerHTML = [
    tile("Today", td.record || "-", units(td.units) + (td.pending ? " · " + td.pending + " pending" : ""), sign(td.units)),
    tile("Last 7 days", wk.record || "-", units(wk.units) + (wk.win_pct != null ? " · " + wk.win_pct + "%" : ""), sign(wk.units)),
    tile("Top 5", t5.wins != null ? `${t5.wins}-${t5.losses}-${t5.pushes}` : "-", units(t5.units) + (t5.since ? " since " + dayName(t5.since) : ""), sign(t5.units)),
    tile("Bills next 7 days", money(dueOpen(mo).reduce((s, x) => s + Number(x.amount || 0), 0)), dueOpen(mo).length + " still to pay", ""),
  ].join("");
}

// ── sheets ────────────────────────────────────────────────────
const row = (l, r, sub, cls) => `<div class="row"><div class="l">${esc(l)}${sub ? `<small>${esc(sub)}</small>` : ""}</div><div class="r ${cls || ""}">${esc(r)}</div></div>`;
const sec = t => `<div class="sec">${esc(t)}</div>`;
const payRow = (l, r, sub, cls, key) => `<div class="row"><div class="l">${esc(l)}${sub ? `<small>${esc(sub)}</small>` : ""}</div><div class="r ${cls || ""}">${esc(r)}${key ? `<br><button class="pay" data-paid="${esc(key)}">Paid ✓</button>` : ""}</div></div>`;

// v13: the server's own report, as a Health section ("" when the server has never sent one).
function serverReport(on) {
  const S = sv13();
  if (!S.generated_at) return "";
  const w = obj(S.watcher), r = obj(S.runner), p = obj(S.pc), sa = obj(S.server_app), d = obj(S.drive), al = svAlerts(S);
  const okc = (good, bad) => good ? "pos" : bad ? "neg" : "";
  // Ages in the report were measured when the server built it: add how old the report is now.
  const agoS = m => m == null || isNaN(Number(m)) ? ago(null) : ago(Number(m) + (svAge() || 0));
  let h = sec(on ? "🖥️ PC off - the server's own report" : "Server's own report · as of " + ago(svAge()) + (S.reason === "startup check" ? " (a check at its last restart)" : " (sent while the PC was off)"));
  h += row("Server report", ago(svAge()), on ? "live from " + (S.host || "the server") + " · every " + (S.every_min || 5) + " min" : "it sends one only while it sees the PC off (and once at each restart)", on ? "pos" : "");
  h += row("Bot watcher", w.alive ? "up" : "not checking in", "heartbeat " + agoS(w.heartbeat_age_min) + (w.restart_pending ? " · restart pending" : ""), okc(w.alive, !w.alive));
  Object.entries(obj(S.bots)).forEach(([k, up]) => { h += row(k, up ? "up" : "DOWN", w.alive ? "" : "as of the watcher's last heartbeat", up ? "pos" : "neg"); });
  h += row("Ops runner", r.owner === "server" ? "running it" : r.owner === "pc" ? "standing by" : "?", (r.text || "") + " · last cycle " + agoS(r.cycle_age_min) + (r.error_count ? " · " + r.error_count + " error" + (r.error_count > 1 ? "s" : "") : "") + (arr(r.ran).length ? " · ran " + arr(r.ran).join(", ") : ""), r.error_count ? "old" : "");
  arr(r.errors).forEach(e => { h += row("Runner error", "", e, "neg"); });
  h += row("PC, as the server sees it", p.closed_for_server ? "closed" : p.readable === false ? "can't read" : "heartbeat " + agoS(p.heartbeat_age_min), p.closed_for_server ? "you closed it for the server" + (p.offline_at ? " " + when(p.offline_at) : "") : "");
  if (sa.heartbeat_age_min != null) h += row("Server app (standby)", sa.acting ? "acting" : "holding", "heartbeat " + agoS(sa.heartbeat_age_min));
  h += row("Google Drive on the server", d.control_ok ? "mounted" : "NOT mounted", "watchdog checked " + agoS(d.watchdog_age_min), okc(d.control_ok, d.control_ok === false));
  if (S.bots_data_age_min != null) h += row("Bots' data", agoS(S.bots_data_age_min), "how old the snapshot the bots answer from is");
  const c = obj(S.checks);
  h += sec("Server alerts · " + (S.alerts_total != null ? S.alerts_total : al.length) + (c.ok != null ? " · " + c.ok + " checks OK" : ""));
  h += al.length ? al.map(x => row(x.title, x.severity, x.detail, x.severity === "FAIL" ? "neg" : "old")).join("") : `<p class="note">No red or yellow alerts on the server.</p>`;
  if (S.alerts_total > al.length) h += `<p class="note">+${esc(S.alerts_total - al.length)} more on the server.</p>`;
  return h;
}

const SHEETS = {
  bets: ["🎯 Bets", () => {
    const b = mh().bets || {}, p = b.last_published || {};
    let h = sec("Record · session " + (b.session_date || "?"));
    [["Today", b.today], ["Last 7 days", b.week], ["Last 30 days", b.month]].forEach(([n, x]) => {
      if (x) h += row(n, units(x.units), x.record + " · " + x.win_pct + "%" + (x.pending ? " · " + x.pending + " pending" : ""), sign(x.units));
    });
    if (p.date) h += row("Last posted day (" + dayName(p.date) + ")", units(p.profit), `${p.wins}-${p.losses}${p.pushes ? "-" + p.pushes + "P" : ""} · ${p.published_via === "boss_report" ? "Boss report" : "results card"}`, sign(p.profit));
    const t5 = b.top5;
    if (t5) h += row("Top 5 running", units(t5.units), `${t5.wins}-${t5.losses}-${t5.pushes} · ${t5.win_pct}% since ${dayName(t5.since)}`, sign(t5.units));
    h += sec("Open Lives bets");
    h += (b.open_lives || []).length ? b.open_lives.map(x => row(x.pick, x.sport, x.game)).join("") : `<p class="note">None open.</p>`;
    if (b.error) h += `<p class="note">PC said: ${esc(b.error)}</p>`;
    return h;
  }],
  health: ["🩺 Health", () => {
    const hh = mh().health || {}, pc = hh.pc || {}, sv = hh.server || {}, oc = hh.odds_credits || {};
    const on = serverOn(), srv = serverReport(on);
    let h = on ? srv : "";
    h += sec(pcStale() && mh().generated_at ? "PC (its last report, " + ago(ageMin(mh().generated_at)) + ")" : "PC");
    h += row("MasterHub app", pc.active ? "running" : "not running", "heartbeat " + ago(pc.heartbeat_age_min), pc.active ? "pos" : "neg");
    h += row("Snapshot", ago(ageMin(mh().generated_at)), "MasterHub half");
    h += row("Snapshot", ago(ageMin(dk().generated_at)), "Marvel Desktop half");
    h += sec(pcStale() ? "Server (as the PC last saw it)" : "Server");
    h += row("Server", sv.alive ? "up" : "not checking in", "heartbeat " + ago(sv.heartbeat_age_min), sv.alive ? "pos" : "neg");
    Object.entries(sv.bots || {}).forEach(([k, up]) => { h += row(k, up ? "up" : "DOWN", "", up ? "pos" : "neg"); });
    h += row("Ops runner", ago(sv.ops_runner_age_min), "owner: " + (sv.ops_owner || "?") + (sv.ops_errors ? " · " + sv.ops_errors + " errors" : ""));
    if (fx().enabled) {
      const fl = fxList(), can = !!store.get(K_DEC);
      h += sec("🔧 Fix it · " + fl.length + " open");
      h += fl.length ? fl.map(f => fixCard(f, can)).join("") : `<p class="note">Nothing failing right now.</p>`;
      if (fx().fixable_total > fl.length) h += `<p class="note">+${fx().fixable_total - fl.length} more open.</p>`;
      (fx().recent || []).slice(0, 5).forEach(f => { h += row(f.id + " · " + f.title, "✅ cleared", f.at ? when(f.at) : ""); });
      h += `<p class="note">Fix it = Claude diagnoses it and builds the fix switched OFF; it comes back as a Yes / No in Approvals. A server fix comes back "needs you at the PC" (it needs a deploy).</p>`;
    }
    const { shown, hidden } = healthAlerts();
    h += sec("Alerts (checked " + (hh.alerts_checked_at ? t12(hh.alerts_checked_at) : "?") + ")");
    h += shown.length ? shown.map(a => row(a.title, a.severity, a.detail, a.severity === "FAIL" ? "neg" : "")).join("") : `<p class="note">No red or yellow alerts.</p>`;
    if (hidden) h += `<p class="note">${hidden} alert(s) hidden: "server ops runner missing" is a known false alarm while the runner is reporting.</p>`;
    h += sec("Background runners (last beat)");
    Object.entries(hh.runners_age_min || {}).forEach(([k, v]) => { h += row(k.replace(/_/g, " "), ago(v)); });
    h += sec("Odds API credits");
    ["primary", "backup", "key3", "key4"].forEach(k => { if (oc[k + "_credits"] != null) h += row(k + (oc.active_key === k ? " (active)" : ""), Number(oc[k + "_credits"]).toLocaleString()); });
    if (!on) h += srv;
    return h;
  }],
  money: ["💵 Money", () => {
    const mo = dk().money || {}, c = mo.cash || {};
    let h = sec("Cash");
    h += row("Starting balance", money(c.starting_balance), "built " + (c.built_at || "?"));
    (c.accounts || []).forEach(a => { h += row(a.name, money(a.balance), "as of " + a.as_of + (a.days_old > 7 ? " · " + a.days_old + " days old" : ""), a.days_old > 14 ? "old" : ""); });
    if (c.low_water != null) h += row("Lowest point ahead", money(c.low_water), c.low_water_date ? dayName(c.low_water_date) : "", sign(c.low_water));
    if (c.first_negative) h += `<p class="note">The forecast goes negative ${esc(dayName(c.first_negative))}, but it starts from balances up to ${esc(oldestBalance(mo))} old.</p>`;
    const due = dueOpen(mo);
    h += sec("Due in the next 7 days · " + money(due.reduce((s, x) => s + Number(x.amount || 0), 0)));
    h += due.map(x => payRow(x.name, money(x.amount), dayName(x.date) + " · " + (x.kind === "CARD_DUE" ? "card payment" : x.kind.toLowerCase()) + (x.confirmed ? "" : " · not confirmed"), "", billKey(x))).join("") || `<p class="note">Nothing left to pay this week.</p>`;
    h += sec("Alerts");
    h += alertsOpen(mo).map(a => payRow(a.title, a.amount != null ? money(a.amount) : a.severity, a.severity + (a.when ? " · " + a.when : ""), a.severity === "NOW" ? "neg" : "", a.severity === "NOW" && a.amount > 0 ? alertKey(a) : null)).join("") || `<p class="note">No money alerts.</p>`;
    const done = (mo.due_7d || []).filter(x => isPaid(billKey(x))).map(x => [x.name + " · " + dayName(x.date), money(x.amount), billKey(x)])
      .concat((mo.alerts || []).filter(a => isPaid(alertKey(a))).map(a => [a.title.split("  -  ")[0], a.amount != null ? money(a.amount) : "", alertKey(a)]));
    if (done.length) {
      h += sec("Marked paid on this phone");
      h += done.map(([l, r, k]) => `<div class="row"><div class="l">${esc(l)}<small>${esc(r)}</small></div><div class="r"><button class="pay undo" data-unpaid="${esc(k)}">Undo</button></div></div>`).join("");
    }
    h += `<p class="note">Paid marks hide the item on this phone. Marvel Desktop still shows it until the payment is in your books.</p>`;
    return h;
  }],
  business: ["📈 Business", () => {
    const bz = dk().business || {}, f = bz.followers || {}, fn = bz.funnel || {};
    const NAMES = { facebook: "Facebook", instagram: "Instagram", x: "X", tiktok: "TikTok", discord: "Discord", telegram: "Telegram" };
    let h = sec("Followers");
    Object.entries(f).forEach(([k, v]) => {
      if (!v || typeof v !== "object") return;
      const ch = v.change == null ? "" : (v.change >= 0 ? "+" : "") + v.change + " since " + v.since;
      h += row(NAMES[k] || k, v.count == null ? "-" : Number(v.count).toLocaleString(), [ch, v.as_of ? "as of " + v.as_of : "", v.how === "MANUAL" ? "counted by hand" : ""].filter(Boolean).join(" · "));
    });
    h += sec("Books");
    (bz.books || []).forEach(x => { h += row(x.name, x.rank ? "#" + Number(x.rank).toLocaleString() : "no rank", `${x.ratings || 0} ratings · $${x.price} · ${x.kdp_units_logged} sold logged · as of ${x.as_of}`); });
    h += sec("Sales funnel" + (fn.as_of ? " · " + fn.as_of : ""));
    if (fn.as_of) {
      h += row("Whop active members", fn.whop_active ?? "-");
      h += row("Whop paid", fn.whop_paid ?? "-", "gross " + money(fn.whop_gross));
      h += row("Telegram", fn.telegram ?? "-");
    }
    const S = (dk().email || {}).sales || {};
    h += sec("💰 Sales emails (Winible + Whop)");
    h += row("Last 30 days", "", Object.entries(S.last_30d || {}).map(([p, n]) => p + " " + n).join(" · "));
    h += (S.rows || []).map(r => row(r.platform + " · " + r.subject, dayName(r.date), r.inbox + (r.archived ? " · was archived" : ""))).join("") || `<p class="note">No sale emails found.</p>`;
    h += `<p class="note">Counted from the "new subscriber / sale / payout" emails Winible and Whop send - Winible has no API. Day Hub / Cruise Hub (Marvel Corp Whop) buyers aren't connected yet.</p>`;
    return h;
  }],
  cmmg: ["🏢 CMMG", () => {
    const b = mh().bets || {}, po = b.posted || {}, c = dk().cmmg || {};
    const rec = w => w ? `${w.wins}-${w.losses}${w.pushes ? "-" + w.pushes + "P" : ""} · ${Number(w.win_rate).toFixed(1)}%` : "-";
    let h = sec("Posted record (the Discord day cards)");
    if (po.through) {
      h += row("Last 7 days", units(po.week && po.week.profit), rec(po.week) + " · through " + dayName(po.through), sign(po.week && po.week.profit));
      h += row("Last 30 days", units(po.month && po.month.profit), rec(po.month), sign(po.month && po.month.profit));
    }
    const lp = b.last_published;
    if (lp && lp.date) h += row("Last posted day · " + dayName(lp.date), units(lp.profit), `${lp.wins}-${lp.losses}${lp.pushes ? "-" + lp.pushes + "P" : ""} · ${lp.win_rate}%`, sign(lp.profit));
    if (!c.company) return h + `<p class="note">No CMMG books yet.</p>`;
    h += sec(c.company + " books · built " + (c.built_at || "?"));
    h += row("Whop revenue (year to date)", money(c.bank.whop_revenue));
    h += row("Bank balance", money(c.bank.balance), "", sign(c.bank.balance));
    h += row("Owed to you", money(c.scott.owed), "spent " + money(c.scott.spent) + " · repaid " + money(c.scott.repaid));
    h += row("Owed to Mooriii", money(c.mooriii.owed), "spent " + money(c.mooriii.spent) + " · repaid " + money(c.mooriii.repaid));
    h += row("Distributable profit", money(c.distributable_profit), "", sign(c.distributable_profit));
    h += row("Your 50%", money(c.scott_share), c.dean_share ? "after Dean " + money(c.scott_after_dean) : "", sign(c.scott_share));
    h += sec("How the profit is worked out");
    (c.waterfall || []).forEach(w => { h += row(w.step, money(w.amount)); });
    const months = Object.keys(c.by_month || {}).sort().reverse();
    if (months.length) {
      h += sec("Revenue by month");
      months.forEach(m => { const v = c.by_month[m]; h += row(m, money(v.revenue), v.expense ? "expense " + money(v.expense) : ""); });
    }
    h += `<p class="note">Counted only with a bank match or a receipt${c.last_reconciled ? " · workbook last reconciled " + esc(c.last_reconciled) : ""}.</p>`;
    return h;
  }],
  pages: ["📊 Page status", () => {
    const P = (mh().pages || {});
    if (P.error) return `<p class="note">PC said: ${esc(P.error)}</p>`;
    const rows = P.pages || [];
    if (!rows.length) return `<p class="note">No page data yet.</p>`;
    const t = todayCT();
    let h = `<p class="note">Each page's own record - the number on its header. Busiest first (picks in the last 30 days).</p>`;
    h += sec("Today · last 7 days · last 30 days");
    rows.forEach(r => {
      const td = r.today || {}, wk = r.week || {}, mo = r.month || {};
      const idle = r.last_pick && r.last_pick < addDays(t, -2) ? " · no picks since " + dayName(r.last_pick) : "";
      h += row(r.page.replace(/_/g, " "), units(wk.units),
        `today ${td.record}${r.pending ? " (" + r.pending + " pending)" : ""} · week ${wk.record} ${wk.win_pct}% · month ${mo.record} ${units(mo.units)}${idle}`,
        sign(wk.units));
    });
    return h;
  }],
  ads: ["📣 Ads & posting", () => {
    const a = dk().ads || {};
    if (!a.sections || !a.sections.length) return `<p class="note">No ads report yet.</p>`;
    const ST = { OK: "✅", FAILED: "❌", LATE: "⚠️", UNKNOWN: "❔" };
    let h = `<p class="note">Marvel Desktop's morning report for ${esc(a.report_day ? dayName(a.report_day) : "?")} (built ${esc(a.built_at ? t12(a.built_at) : "?")}) - it grades yesterday's posting.</p>`;
    a.sections.forEach(s => {
      h += sec(s.title);
      h += s.rows.map(r => row((ST[r.state] || "") + " " + r.task, r.state === "OK" ? "" : r.state,
        [r.detail, r.fix ? "fix: " + r.fix : ""].filter(Boolean).join(" · "), r.state === "FAILED" ? "neg" : r.state === "LATE" ? "old" : "")).join("");
    });
    if ((a.untracked || []).length) h += `<p class="note">Not in the report at all: ${esc(a.untracked.join(", "))} - no posting is tracked there yet.</p>`;
    return h;
  }],
  email: ["📧 Email", () => {
    const em = dk().email || {};
    if (!em.inboxes) return `<p class="note">No email data yet.</p>`;
    let h = sec("💼 Recruiters & job offers · last " + em.days + " days");
    h += (em.recruiters || []).map(r => row(r.from, dayName(r.date), r.subject + " · " + r.inbox + (r.archived ? " · archived" : ""))).join("") || `<p class="note">None found.</p>`;
    h += `<p class="note">${em.job_alerts || 0} job-alert emails (LinkedIn/Indeed alerts) in the same window - counted, not listed. Archived mail is still in All Mail.</p>`;
    h += sec("Important mail · " + (em.important_count || 0));
    h += (em.important || []).map(x => row(x.subject, x.kind.toLowerCase(), dayName(x.date) + " · " + x.from + " · " + x.inbox + (x.unread ? " · unread" : ""), x.kind === "DUE" ? "neg" : "")).join("") || `<p class="note">Nothing important.</p>`;
    const c = em.cleanup || {};
    h += sec("Spam & clutter cleanup");
    h += row("Last cleanup", c.at ? dayName(c.at.slice(0, 10)) + " " + t12(c.at) : "never", c.dry ? "dry run - nothing moved" : "");
    h += row("Spam to trash", c.spam_trashed ?? "-");
    h += row("Clutter archived", c.archived ?? "-");
    h += sec("Inboxes");
    h += (em.inboxes || []).map(i => row(i.inbox, i.status === "ok" ? (i.unread ?? 0) + " unread" : "NOT READ", i.provider + (i.error ? " · " + i.error : ""), i.status === "ok" ? "" : "neg")).join("");
    h += `<p class="note">Scanned ${esc(em.built_at ? dayName(em.built_at.slice(0, 10)) + " " + t12(em.built_at) : "?")} by Marvel Desktop.</p>`;
    return h;
  }],
  calendar: ["📅 Calendar", () => {
    // EVERYTHING WE DO (Scott 10/10): Google Calendar + today's card (games) + today's
    // jobs (Marvel Desktop chores) + bills due, merged by day and time.
    const items = [], t = todayCT();
    calEvents().forEach(e => items.push({ day: evDay(e), sort: e.allDay ? "00:00" : new Date(e.start).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }),
      icon: "📅", keep: e.allDay, title: e.title || "(no title)", right: e.repeats ? "every day" : evTime(e),
      sub: [e.repeats ? "repeats " + e.repeats + " days" : "", e.where, e.cal].filter(Boolean).join(" · ") }));
    const games = {};
    ((mh().bets || {}).slate || []).forEach(g => {
      const k = g.start + "|" + g.game;
      (games[k] = games[k] || { g, bets: [] }).bets.push(g.bet + (g.result ? " (" + g.result + ")" : ""));
    });
    Object.values(games).forEach(({ g, bets }) => items.push({ day: evDay({ start: g.start }), sort: new Date(g.start).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }),
      icon: "🎯", title: g.sport + " · " + g.game, right: t12(g.start), sub: bets.join(" · ") }));
    const jb = dk().jobs || {};
    (jb.rows || []).forEach(r => items.push({ day: jb.day || t, sort: r.at || "00:00", icon: r.state === "DONE" ? "✅" : r.state === "FAILED" ? "❌" : "⚙️",
      title: r.title, right: r.at ? t12(jb.day + "T" + r.at + ":00") : "", sub: [r.state.toLowerCase(), r.owner === "SCOTT" ? "yours" : r.owner ? r.owner.toLowerCase() : ""].filter(Boolean).join(" · "),
      cls: r.state === "FAILED" ? "neg" : "" }));
    dueOpen(dk().money || {}).forEach(x => items.push({ day: x.date, sort: "00:01", keep: true, icon: "💵", title: x.name, right: money(x.amount),
      sub: x.kind === "CARD_DUE" ? "card payment due" : "bill due" }));
    const show = CAL_FILTER === "all" ? items : items.filter(i => i.icon === CAL_FILTER || (CAL_FILTER === "⚙️" && (i.icon === "✅" || i.icon === "❌")));
    const chips = [["all", "All"], ["📅", "📅 Google"], ["🎯", "🎯 Games"], ["⚙️", "⚙️ Jobs"], ["💵", "💵 Bills"]]
      .map(([k, l]) => `<button class="chip${CAL_FILTER === k ? " on" : ""}" data-calf="${k}">${l}</button>`).join("");
    let h = `<div class="chips">${chips}</div>`;
    if (CAL && !CAL.ok) h += `<p class="note">Google Calendar can't be read: ${esc(CAL.error)}</p>`;
    if (!show.length) return h + `<p class="note">Nothing here for the next 7 days.</p>`;
    show.sort((a, b) => (a.day + a.sort).localeCompare(b.day + b.sort));
    // Today's items that started over an hour ago fold away (all-day rows and bills stay).
    const hrAgo = new Date(Date.now() - 3600000).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
    const early = show.filter(i => i.day === t && !i.keep && i.sort < hrAgo);
    if (early.length && !CAL_EARLY) {
      const drop = new Set(early);
      for (let n = show.length - 1; n >= 0; n--) if (drop.has(show[n])) show.splice(n, 1);
      h += `<button class="chip" data-calearly="1">Show earlier today (${early.length})</button>`;
    }
    let last = "";
    show.forEach(i => {
      if (i.day !== last) { h += sec(i.day === t ? "Today" : i.day === addDays(t, 1) ? "Tomorrow" : dayName(i.day)); last = i.day; }
      h += row(i.icon + " " + i.title, i.right, i.sub, i.cls);
    });
    if (CAL && CAL.more) h += `<p class="note">+${CAL.more} more Google events not shown.</p>`;
    return h;
  }],
  approvals: ["🗳️ Approvals", () => {
    const a = ap();
    if (!a.enabled) return `<p class="note">Approvals are switched off on the PC.</p>`;
    if (a.error) return `<p class="note">PC said: ${esc(a.error)}</p>`;
    const can = !!store.get(K_DEC), open = apOpen();
    let h = `<p class="note">Claude's open questions - Yes or No only. Your first answer stands; to change it, tell Claude at the PC.</p>`;
    if (!can) h += `<p class="note">This phone can read but can't answer yet: open the approvals link from your email on this phone, once.</p>`;
    h += sec("Waiting on you · " + apWaiting().length);
    h += open.length ? open.map(q => apCard(q, can)).join("") : `<p class="note">No open questions.</p>`;
    if (a.open_total > open.length) h += `<p class="note">+${a.open_total - open.length} more waiting - they show here as these are answered.</p>`;
    const rc = a.received || [];
    h += sec("Received by the PC");
    // Step 2: what the PC did with it (done / needs you at the PC / declined / failed).
    const RES = { done: "✅ done", needs_pc: "🖥️ needs you at the PC", declined: "nothing done", failed: "❌ failed" };
    h += rc.length ? rc.map(d => row(d.id + (d.ask ? " · " + d.ask : ""), String(d.answer || "").toUpperCase() + (d.status === "accepted" ? " ✓" : ""),
      (d.status === "accepted" ? "received " : "not used - " + d.why + " · ") + when(d.received_at) +
        (d.result ? " · " + (RES[d.result] || d.result) + (d.result_detail ? ": " + d.result_detail : "") : ""),
      d.status !== "accepted" || d.result === "failed" ? "neg" : "pos")).join("")
      : `<p class="note">Nothing received yet.</p>`;
    return h;
  }],
  todo: ["✅ To-do", () => {
    const hl = mh().hot_list || {}, le = (dk().business || {}).loose_ends || {};
    let h = sec("HOT LIST · " + (hl.open_total ?? "?") + " open");
    h += (hl.top || []).map(s => row(s.title.replace(/^[🔴🟢🟠🔵🟡]\s*/u, ""), s.open + " open", s.first)).join("");
    h += sec("Marvel Desktop · " + (le.scott_count ?? "?") + " waiting on you");
    h += (le.scott_top || []).map(t => row(t, "")).join("");
    return h;
  }],
};

function openSheet(key) {
  const s = SHEETS[key];
  if (!s) return;
  $("#sheetTitle").textContent = s[0];
  $("#sheetBody").innerHTML = DATA ? s[1]() : `<p class="note">No data yet.</p>`;
  $("#sheet").classList.remove("hidden");
}

function render() {
  paintFresh();
  if (!DATA) { $("#needs").innerHTML = `<li class="bad">Can't load yet${LAST_ERR ? `<small>${esc(LAST_ERR)}</small>` : ""}</li>`; return; }
  $("#apBubble").classList.toggle("hidden", !ap().enabled);
  renderNeeds();
  renderGlance();
  const open = $("#sheet:not(.hidden)") && $("#sheet").dataset.key;
  if (open) openSheet(open);
}

// ── scene: city at night (no files, no network) ───────────────
function paintScene() {
  let b = "";
  const xs = [0, 34, 60, 98, 130, 168, 196, 236, 262, 300, 330, 366];
  xs.forEach((x, i) => {
    const h = 40 + ((i * 37) % 70), w = 30;
    b += `<rect x="${x}" y="${150 - h}" width="${w}" height="${h}" fill="#0b1020" opacity=".9"/>`;
    for (let y = 150 - h + 8; y < 145; y += 12) for (let wx = x + 6; wx < x + w - 4; wx += 9)
      if ((wx * 7 + y * 3 + i) % 5 < 2) b += `<rect x="${wx}" y="${y}" width="4" height="5" fill="#ff8c00" opacity=".55"/>`;
  });
  const stars = Array.from({ length: 24 }, (_, i) => `<circle cx="${(i * 53) % 400}" cy="${(i * 29) % 70 + 5}" r="1" fill="#fff" opacity=".6"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 150">${stars}<circle cx="372" cy="16" r="9" fill="#f4ecd0" opacity=".8"/>${b}</svg>`;
  $(".scene").style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// ── wiring ────────────────────────────────────────────────────
document.addEventListener("click", e => {
  const cf = e.target.closest("[data-calf]");
  if (cf) { CAL_FILTER = cf.dataset.calf; openSheet("calendar"); return; }
  if (e.target.closest("[data-calearly]")) { CAL_EARLY = true; openSheet("calendar"); return; }
  const apb = e.target.closest("[data-ap]");
  if (apb) { if (!apb.disabled) sendTap(apb.dataset.ap, apb.dataset.ans); return; }
  const pd = e.target.closest("[data-paid]"), up = e.target.closest("[data-unpaid]");
  if (pd || up) {
    setPaid((pd || up).dataset[pd ? "paid" : "unpaid"], !!pd);
    renderNeeds(); renderGlance(); openSheet("money");
    return;
  }
  const o = e.target.closest("[data-open]");
  if (o) { $("#sheet").dataset.key = o.dataset.open; openSheet(o.dataset.open); return; }
  const a = e.target.closest("[data-act]");
  if (a && a.dataset.act === "close") { $("#sheet").classList.add("hidden"); $("#sheet").dataset.key = ""; }
  if (a && a.dataset.act === "refresh") { $("#fresh").textContent = "refreshing…"; load(); }
  if (e.target.id === "sheet") { $("#sheet").classList.add("hidden"); $("#sheet").dataset.key = ""; }
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") $("#sheet").classList.add("hidden");
  if (e.key === "Enter" && e.target.dataset && e.target.dataset.open) e.target.click();
});
document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });

takePassFromLink();
window.addEventListener("hashchange", () => { takePassFromLink(); load(); });   // link opened while the app is up
paintScene();
tickClock();
setInterval(tickClock, 20000);
const cached = JSON.parse(store.get(K_LAST) || "null");
if (cached) { DATA = cached.parts; CAL = cached.cal || null; RELAY_TAPS = cached.taps || []; FETCHED_AT = cached.at; render(); }
load();
setInterval(() => { if (!document.hidden) load(); }, REFRESH_MS);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
