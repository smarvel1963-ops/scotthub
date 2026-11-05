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
 * v14 USEMART SUPPORT (Scott 10/23: "It should come up in my scott hub so can respond from there fast"): a fourth part,
 * "usemart", sent every 5 min by the UseMart server (usemart api/src/scotthub.ts, switch SCOTT_HUB_SUPPORT) - support items
 * waiting on Scott, how many are past his 24-hour target, the newest 10 (ref, first name, topic, age). A UseMart card in
 * "What needs you" (red when any is over 24 h) and a UseMart sheet with a Reply button per item. The Reply link is BUILT
 * HERE from the item's id (checked to be a plain id) - never a link taken from the data.
 * v15 FINANCE (Scott 10/25: "desktop program tying into scott hub phone app along with finance pages"; "every other week
 * that get update"): the desktop part may carry "finance" - the bank reconcile Claude writes every other payday weekend
 * (banks matched to the bank, till next payday, what's due before it, out of the hole, business costs), who owes Scott
 * (MONEY SENT) and the "things to chase" list. Shown at the top of Money; the old statement balances move under it.
 * "What needs you" says when he's short before payday and when the bills haven't been run in 16+ days.
 * v16 TIDY (Scott 10/25: "tiddy up scott hub make it more useful"): the reconcile is the one money truth (due-now,
 * till-payday tile; the desktop bill list is labeled "not your plan"); past-due cards fold into one card; the stale
 * "cash goes negative" line is dropped while the reconcile is there; What needs you is sorted red-first, capped at 6
 * with "+N more"; a one-line brief sits above it.
 * v17 LEARNING ("self learning to benefit me the most"), kept on this phone: the bubbles reorder by what he opens;
 * each card has Not now (12 h) / Done (until its words change); a card set aside 3+ times goes quiet by itself
 * (never a red one); Money shows every bills run (is the gap shrinking?) and what was really spent vs the plan.
 * v18 LEARN SYNC (Scott 10/25 "8 yes"): those taps (Not now / Done / Bring back / open a card) and which screens he
 * opens also go to the relay (task "learn", relay v6, the decide pass - this phone only sends when it holds one), so
 * the PC (scott_hub_upload, switch "learn") keeps them for Claude to learn from. Queued here and resent until the
 * relay takes them (an older relay says no - they wait). Each bills run's row also shows everyday spending per week.
 * v19 TILES LOOK (Scott 11/01, after a tile dashboard he saw: "want our stuff to be more modern as we go" + "we can
 * experiment on scott hub and load that hub with things i need to know about every day about my life"): one screen at a
 * glance - a clock + weather tile, What needs you (top 3), then one tile per area with its key number; a tile opens the
 * same sheet its bubble does. Bright by day, dark after sunset. Weather + National Weather Service alerts for a town kept
 * on THIS phone (never in this public code). SWITCH: off by default until v21 - "✨ New look" turns it on for this phone,
 * "Classic" turns it off (scotthub.look); ?look=tiles|classic does the same from a link.
 * v20 GAMES + BIRTHDAYS (Scott 11/01 "Games + birthdays"), tiles look only: a Games tile from today's card (next start,
 * live count, "to grade", picks riding - NEVER a day W-L: the slate is every board's picks, the Today tile's record is the
 * one record) with a Games sheet (live / coming up / waiting on a grade / finished board picks, plus his teams' games from
 * sports calendars such as the Razorbacks ones), and a Birthdays tile: calendar events titled birthday / bday /
 * anniversary / 🎂 in the relay's 7 days plus (relay v7) 12 months of Contacts birthdays and his own yearly ones.
 * v21 UPDATE READY + NEW LOOK ON (Scott 11/03: "scott hub never got the down load for amazing new look we built" + "show on
 * front screen update ready"): an update now says so at the top of the front screen, and the tiles are the default.
 * v23 TALK TO CLAUDE + IDEA BOX (Scott 11/04: "i need to be able to communicate back and forth with you on scott hub" / "i have idea outside of
 * the office all the time" / "yes build both"): a tile that opens his Claude session (Claude Code's own Remote Control runs it on the PC; nothing here
 * can reach the PC), and a box for ideas. An idea is kept on this phone until the relay holds it, so no signal or a PC that's off loses nothing.
 * v24 VIEWS (Scott 11/04: "need 3 squares to track view on my 3 sites"): UseMart, Sites by Marvel and the CMMG site, from UseMart's public visitor counter
 * (usemart.net/api/visits). The phone reads it directly, so it keeps working while the PC is off. Totals only: the counter keeps no addresses or cookies.
 * "Classic" still goes back and stays. RELEASE RULE: every push bumps VERSION here, version.json and the cache name in sw.js.
 * v22 NEW LOOKS TILE (Scott 11/03: "i still dont see updates on my apps", on 1.58.2): the Day Hub + Cruise Hub new looks are off for customers and
 * only opened from a preview link. All Hubs share this address, so this tile sets each one's look key for THIS phone, with no link to tap.
 */
"use strict";

const RELAY = "https://script.google.com/macros/s/AKfycbwe4-nvSlI5rVpIJhTprZks_xlv6uOSM5KUzxnXpWkp5rxXVWS3b0tMwzDQgW-X073l/exec";
const K_PASS = "scotthub.k", K_LAST = "scotthub.last", K_PAID = "scotthub.paid";
const K_DEC = "scotthub.d", K_TAPS = "scotthub.taps";
const CONFIRM_MS = 6000;       // second tap must come within 6 s
const STALE_MIN = 15;          // PC writes every 5 min; 3 misses = say so
const SERVER_STALE_MIN = 15;   // the server writes every 5 min while the PC is off
const UM_STALE_MIN = 20;       // v14: UseMart writes every 5 min while its switch is on
const UM_REPLY = "https://usemart.net/#admin-support/";
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
  checkUpdate();                     // v21: open, resume, Refresh and the timer all look
  if (tilesOn()) loadWeather();      // v19: its own 30-min cache; never waits on the relay
  loadViews();                       // v24: its own 5-minute wait; reads the sites' counter, never the relay
  const pass = store.get(K_PASS);
  if (!pass) { $("#setup").classList.remove("hidden"); return; }
  try {
    const r = await fetch(RELAY, { method: "POST", body: JSON.stringify({ task: "get", pass }) });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "relay said no");
    DATA = j.parts; CAL = j.calendar || null; RELAY_TAPS = j.decisions || []; FETCHED_AT = new Date().toISOString(); LAST_ERR = null;
    flushLearn();             // v18: anything queued while offline / before relay v6
    flushIdeas();             // v23: ideas waiting on this phone
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

// v14: UseMart support. Words shown escaped; ids must be plain uuids before a Reply link is built from them.
const um = () => obj(DATA && DATA.usemart && DATA.usemart.data);
const umAge = () => ageMin(DATA && DATA.usemart && DATA.usemart.received_at);
const umItems = () => arr(um().newest).filter(x => x && typeof x === "object" && /^[0-9a-f-]{36}$/i.test(String(x.id || "")));
const umHave = () => !!(DATA && DATA.usemart && DATA.usemart.data);

// v15: finance from the desktop part (absent until the desktop switch FINANCE_ENABLED is on). Words shown escaped.
const fin = () => obj(dk().finance);
const finHave = () => !!fin().reconciled_day;
const isYmd = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
// v16: what's due now (overdue / processing) or by tomorrow, from the reconcile. The weekly everyday-spending
// line is a budget, not a bill, so it never shows as "due".
const finSoon = (t, tm) => arr(fin().before_payday).filter(x => x && Number(x.amount) < 0 && !/^Everyday spending/i.test(String(x.item || ""))
  && (x.when === t || x.when === tm || x.when === "overdue" || x.when === "processing"));
const CARD_RE = /card|concora|credit|over limit|past due/i;

// ── v17 LEARNING (Scott 10/25: "make it more useful and self learning") - all on this phone, nothing sent ──
// 1) Which screens he opens (last 30 days) -> the bubbles reorder to his most-used first (after 5+ opens).
// 2) "Not now" (12 h) and "Done" (until the card's words change) on each card. A card set aside 3+ times
//    goes quiet on its own - it moves under "+N more" - except red cards, which never hide themselves.
//    Opening a card resets that, because opening it says it matters.
const K_USE = "scotthub.use", K_HIDE = "scotthub.hide", K_LEARNQ = "scotthub.learnq";
const SNOOZE_MS = 12 * 3600000, QUIET_AFTER = 3, USE_DAYS = 30, LEARN_AFTER = 5;
let LAST_CARDS = {}, LEARN_SENDING = false;
const loadJ = (k, d) => { try { return JSON.parse(store.get(k) || "null") || d; } catch (e) { return d; } };
function recordUse(key) {
  const u = loadJ(K_USE, {}), now = Date.now(), cut = now - USE_DAYS * 86400000;
  u[key] = arr(u[key]).filter(t => t > cut).concat(now).slice(-60);
  store.set(K_USE, JSON.stringify(u));
  learnEvent("view", { key: "sheet|" + key, open: key });
}
// v18: queue what he did, send it to the relay for the PC (decide pass only; resent until taken).
const cutChars = (s, n) => Array.from(String(s || "")).slice(0, n).join("");   // whole characters, never half an emoji
function learnEvent(how, c) {
  const q = loadJ(K_LEARNQ, []);
  q.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), how, key: cutChars(c.key, 120),
           text: cutChars(c.text, 120), cls: c.cls || "", open: c.open || "", at: new Date().toISOString() });
  store.set(K_LEARNQ, JSON.stringify(q.slice(-200)));
  flushLearn();
}
function flushLearn() {
  const dp = store.get(K_DEC), q = loadJ(K_LEARNQ, []);
  if (!dp || !q.length || LEARN_SENDING) return;
  LEARN_SENDING = true;
  const batch = q.slice(0, 20);
  fetch(RELAY, { method: "POST", body: JSON.stringify({ task: "learn", dpass: dp, events: batch }) })
    .then(r => r.json())
    .then(j => {
      if (!j || !j.ok) return;                       // an older relay says no - they wait
      // remove exactly what the relay used up (by id), so a tap made while this was in flight is never lost
      const gone = new Set(Array.isArray(j.ids) ? j.ids : batch.slice(0, typeof j.taken === "number" ? j.taken : batch.length).map(e => e.id));
      store.set(K_LEARNQ, JSON.stringify(loadJ(K_LEARNQ, []).filter(e => !gone.has(e.id))));
    })
    .catch(() => {})
    .then(() => { LEARN_SENDING = false; });
}
// v23: the idea box. Kept here until the relay says it holds it; resent on every refresh. mh().ideas_taken = the ids the PC has filed.
const K_IDEAS = "scotthub.ideas", K_IDEADRAFT = "scotthub.ideadraft", IDEA_TEXT = 2000;
let IDEA_SENDING = false;
const ideaList = () => arr(loadJ(K_IDEAS, [])).filter(i => i && i.id);
const ideasUnsent = () => ideaList().filter(i => !i.sent);
function saveIdea(text) {
  const t = cutChars(String(text || "").trim(), IDEA_TEXT);
  if (!t) return false;
  const rows = ideaList();
  rows.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), text: t, at: new Date().toISOString(), sent: false });
  // the list keeps 30, but an idea not yet sent is never dropped
  while (rows.length > 30) { const k = rows.findIndex(i => i.sent); if (k < 0) break; rows.splice(k, 1); }
  store.set(K_IDEAS, JSON.stringify(rows));
  store.set(K_IDEADRAFT, "");
  flushIdeas();
  return true;
}
function flushIdeas() {
  const dp = store.get(K_DEC), batch = ideasUnsent().slice(0, 10);
  if (!dp || !batch.length || IDEA_SENDING) return;
  IDEA_SENDING = true;
  fetch(RELAY, { method: "POST", body: JSON.stringify({ task: "idea", dpass: dp, ideas: batch.map(i => ({ id: i.id, text: i.text, at: i.at })) }) })
    .then(r => r.json())
    .then(j => {
      if (!j || !j.ok || !Array.isArray(j.ids)) return;     // an older relay says no: they wait here
      const got = new Set(j.ids);
      store.set(K_IDEAS, JSON.stringify(ideaList().map(i => got.has(i.id) ? { ...i, sent: true } : i)));
    })
    .catch(() => {})
    .then(() => {
      IDEA_SENDING = false;
      const s = $("#sheet");
      if (s && s.dataset.key === "claude" && !s.classList.contains("hidden")) openSheet("claude");
      renderTiles();
    });
}
// v24: views on the three sites. Last good numbers are kept, so no signal shows the old count with its time, never a blank.
const K_VIEWS = "scotthub.views", VIEWS_EVERY = 5 * 60000, VIEW_URL = "https://usemart.net/api/visits?site=";
const VIEW_SITES = [["usemart.net", "UseMart", "🛒"], ["sitesbymarvel.com", "Sites by Marvel", "🌐"], ["cmmgsports.com", "CMMG site", "🏆"]];
let VIEWS_AT = 0;
const viewData = () => obj(loadJ(K_VIEWS, {}));
const nViews = v => Number(v || 0).toLocaleString("en-US");
async function loadViews() {
  if (Date.now() - VIEWS_AT < VIEWS_EVERY) return;
  VIEWS_AT = Date.now();
  const got = await Promise.all(VIEW_SITES.map(([s]) => fetch(VIEW_URL + encodeURIComponent(s)).then(r => r.ok ? r.json() : null).catch(() => null)));
  const v = viewData();
  got.forEach((j, i) => { if (j && j.on && j.today) v[VIEW_SITES[i][0]] = { today: j.today, month: j.month, total: j.total, at: new Date().toISOString() }; });
  store.set(K_VIEWS, JSON.stringify(v));
  renderTiles();
  const s = $("#sheet");
  if (s && s.dataset.key === "views" && !s.classList.contains("hidden")) openSheet("views");
}
const useCount = (u, key) => arr(u[key]).filter(t => t > Date.now() - USE_DAYS * 86400000).length;
function orderBubbles() {
  const nav = document.querySelector(".bubbles");
  if (!nav || !nav.querySelectorAll) return;
  const u = loadJ(K_USE, {}), btns = Array.from(nav.querySelectorAll("button[data-open]"));
  if (btns.reduce((s, b) => s + useCount(u, b.dataset.open), 0) < LEARN_AFTER) return;   // not enough to learn from yet
  const acts = Array.from(nav.querySelectorAll("button[data-act]"));     // Refresh (+ v19 New look) stay last, in order
  btns.map((b, i) => ({ b, i, n: useCount(u, b.dataset.open) })).sort((a, z) => z.n - a.n || a.i - z.i).forEach(x => nav.appendChild(x.b));
  acts.forEach(b => nav.appendChild(b));
}
const cardKey = n => (n.open || "-") + "|" + String(n.text || "").replace(/[0-9$,.:+\-]+/g, "#");
function cardState(n) {
  const h = loadJ(K_HIDE, {})[cardKey(n)] || {};
  if (h.done_text && h.done_text === n.text) return "done";
  if (h.until && h.until > Date.now()) return "not now";
  if ((h.snoozes || 0) >= QUIET_AFTER && n.cls !== "bad") return "quiet";
  return "";
}
function hideCard(key, how) {
  const all = loadJ(K_HIDE, {}), h = all[key] || {}, card = LAST_CARDS[key] || {};
  learnEvent(how, { key, text: card.text, cls: card.cls, open: card.open });
  if (how === "snooze") { h.until = Date.now() + SNOOZE_MS; h.snoozes = (h.snoozes || 0) + 1; }
  if (how === "done") h.done_text = card.text;
  if (how === "open" || how === "unhide") { h.snoozes = 0; delete h.until; delete h.done_text; }
  if (how === "unhide" || !Object.keys(h).length || (how === "open" && !h.snoozes)) delete all[key]; else all[key] = h;
  store.set(K_HIDE, JSON.stringify(all));
}
const cardName = x => String(x.title || "").split("  -  ")[0].replace(/\s*\.\.\.\d+\s*$/, "").replace(/\s*\|.*$/, "");

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
  renderTlHero();          // v19: also flips bright/dark at sunrise and sunset
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

  // v19: National Weather Service alerts for the town set on this phone (tiles look). A Warning is a red card on top;
  // a Watch is a yellow card added last; advisories stay on the clock tile's pill only.
  const wa = wxAlerts(), wWarn = wa.filter(x => /warning/i.test(x.event)), wWatch = wa.filter(x => /watch/i.test(x.event) && !/warning/i.test(x.event));
  const wxCard = (cls, l) => add(cls, "⚠️ " + l.slice(0, 2).map(x => x.event).join(" · ") + (l.length > 2 ? " +" + (l.length - 2) : ""), l[0].headline, "weather");
  if (wWarn.length) wxCard("bad", wWarn);

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
  if (umHave()) {           // v14: UseMart support waiting on Scott
    const U = um(), n = Number(U.waiting) || 0, late = Number(U.over_24h) || 0, age = umAge();
    if (age != null && age > UM_STALE_MIN) add("warn", "UseMart support card is stale - last update " + ago(age), "The UseMart server sends it every 5 min while the switch is on.", "usemart");
    else if (n) add(late ? "bad" : "warn", "🛒 " + n + " UseMart support item" + (n > 1 ? "s" : "") + " waiting on you" + (late ? " · " + late + " over 24 h" : ""),
                    umItems().slice(0, 2).map(x => x.name + ": " + x.topic).join(" · ") + " · tap to reply", "usemart");
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
  const t = todayCT(), tm = addDays(t, 1);
  if (finHave()) {          // v15/v16: the bank reconcile is the ONE money truth here
    const F = fin(), tp = obj(F.till_payday), ds = Number(F.days_since_reconcile);
    if (tp.total != null && Number(tp.total) < 0) add("bad", "Short " + money(-Number(tp.total)) + " before payday" + (isYmd(F.next_payday) ? " " + dayName(F.next_payday) : ""),
                                                      arr(tp.accounts).map(a => a.name + " " + money(a.balance)).join(" · "), "money");
    const soonF = finSoon(t, tm);
    if (soonF.length) add("warn", soonF.length + " due now / tomorrow - " + money(-soonF.reduce((s, x) => s + Number(x.amount || 0), 0)),
                          soonF.slice(0, 3).map(x => x.item.split(":")[0]).join(" · "), "money");
    if (ds > 16) add("warn", "Bills not run since " + (isYmd(F.reconciled_day) ? dayName(F.reconciled_day) : "?"), "Payday weekend - tell Claude \"run bills\"", "money");
    // v16: the desktop's own money alerts, folded. Its "cash goes negative" works from statement balances weeks
    // old, so the reconcile replaces it; past-due / over-limit cards become ONE card; anything else stays.
    const cards = nowA.filter(x => CARD_RE.test(x.title)), staleCash = nowA.filter(x => /^Cash goes negative/i.test(x.title));
    if (cards.length) add("bad", "💳 " + cards.length + " card" + (cards.length > 1 ? "s" : "") + " past due or over limit",
                          cards.slice(0, 3).map(cardName).join(" · ") + " · check they're paid", "money");
    nowA.filter(x => !cards.includes(x) && !staleCash.includes(x)).forEach(x => add("warn", x.title.split("  -  ")[0], "", "money"));
  } else {
    if (nowA.length) add("bad", nowA.length + " money alert" + (nowA.length > 1 ? "s" : "") + " need you now", nowA.slice(0, 2).map(x => x.title.split("  -  ")[0]).join(" · "), "money");
    const soon = dueOpen(mo).filter(x => x.date === t || x.date === tm);
    if (soon.length) add("warn", soon.length + " bill" + (soon.length > 1 ? "s" : "") + " due today/tomorrow - " + money(soon.reduce((s, x) => s + Number(x.amount || 0), 0)), soon.map(x => x.name).slice(0, 3).join(" · "), "money");
    const fn = mo.cash && mo.cash.first_negative;
    if (fn && fn <= addDays(t, 7)) add("warn", "Cash forecast goes negative " + dayName(fn), "Balances are " + oldestBalance(mo) + " old - check before trusting it", "money");
  }

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
  if (wWatch.length) wxCard("warn", wWatch);

  if (!out.length) add("good", "All quiet. Nothing needs you right now.", "", null);
  return out;
}

function oldestBalance(mo) {
  const ds = ((mo.cash || {}).accounts || []).map(a => a.days_old).filter(n => n != null && n < 400);
  return ds.length ? Math.max(...ds) + " days" : "unknown";
}

// v16: most urgent first (red, yellow, green, the rest - same order inside each), only NEEDS_MAX shown,
// "+N more" opens the rest.
const NEEDS_MAX = 6;
let NEEDS_ALL = false;
const needRank = c => c === "bad" ? 0 : c === "warn" ? 1 : c === "good" ? 2 : 3;
function renderNeeds() {
  const all = needs().filter(n => !(n.cls === "good" && !n.open && /^All quiet/.test(n.text)))
    .map((n, i) => Object.assign({ i, key: cardKey(n), st: cardState(n) }, n))
    .sort((a, b) => needRank(a.cls) - needRank(b.cls) || a.i - b.i);
  LAST_CARDS = {};
  all.forEach(n => { LAST_CARDS[n.key] = { text: n.text, cls: n.cls, open: n.open || "" }; });
  const live = all.filter(n => !n.st), tucked = all.filter(n => n.st);
  const btns = n => n.st ? `<span class="cbtns"><button class="cb" data-unhide="${esc(n.key)}">Bring back</button></span>`
    : `<span class="cbtns"><button class="cb" data-snooze="${esc(n.key)}">Not now</button><button class="cb" data-done="${esc(n.key)}">Done</button></span>`;
  const li = n => `<li class="${n.cls}${n.st ? " tucked" : ""}"${n.open ? ` data-open="${n.open}" data-key="${esc(n.key)}" role="button" tabindex="0"` : ""}>` +
    `${esc(n.text)}${n.st ? ` <em>· ${n.st === "quiet" ? "quiet - set aside " + QUIET_AFTER + "+ times" : n.st}</em>` : ""}${n.sub ? `<small>${esc(n.sub)}</small>` : ""}${btns(n)}</li>`;
  const cap = tilesOn() ? TL_NEEDS_MAX : NEEDS_MAX;      // v19: the tiles carry the rest at a glance
  const top = live.slice(0, cap), rest = live.slice(cap).concat(tucked);
  let h = top.map(li).join("");
  if (!live.length) h += `<li class="good">All quiet. Nothing needs you right now.</li>`;
  if (NEEDS_ALL) h += rest.map(li).join("");
  if (rest.length) h += `<li class="more" data-act="needs-more" role="button" tabindex="0">${NEEDS_ALL ? "Show less" : "+" + rest.length + " more" + (tucked.length ? " (" + tucked.length + " set aside)" : "")}</li>`;
  $("#needs").innerHTML = h;
}

function renderGlance() {
  const b = mh().bets || {}, mo = dk().money || {}, td = b.today || {}, wk = b.week || {}, t5 = b.top5 || {};
  const tile = (k, v, s, cls) => `<div class="tile"><div class="k">${esc(k)}</div><div class="v ${cls || ""}">${esc(v)}</div><div class="s">${esc(s || "")}</div></div>`;
  $("#glance").innerHTML = [
    tile("Today", td.record || "-", units(td.units) + (td.pending ? " · " + td.pending + " pending" : ""), sign(td.units)),
    tile("Last 7 days", wk.record || "-", units(wk.units) + (wk.win_pct != null ? " · " + wk.win_pct + "%" : ""), sign(wk.units)),
    tile("Top 5", t5.wins != null ? `${t5.wins}-${t5.losses}-${t5.pushes}` : "-", units(t5.units) + (t5.since ? " since " + dayName(t5.since) : ""), sign(t5.units)),
    finHave() ? finTile(tile)   // v16: the reconcile's till-payday number replaces the desktop bill list
              : tile("Bills next 7 days", money(dueOpen(mo).reduce((s, x) => s + Number(x.amount || 0), 0)), dueOpen(mo).length + " still to pay", ""),
  ].join("");
}

function finTile(tile) {
  const F = fin(), tp = obj(F.till_payday), n = arr(F.chase).length;
  return tile("Till payday", money(tp.total), (isYmd(F.next_payday) ? dayName(F.next_payday) : "") + (n ? " · " + n + " to chase" : ""), sign(tp.total));
}

// v16: one line under the clock - money, bets, next calendar item, things to chase.
function renderBrief() {
  const bits = [], F = fin(), td = (mh().bets || {}).today || {};
  if (finHave()) {
    const tp = obj(F.till_payday);
    if (tp.total != null) bits.push((Number(tp.total) < 0 ? "💵 Short " + money(-Number(tp.total)) : "💵 OK " + money(tp.total)) + " till " + (isYmd(F.next_payday) ? dayName(F.next_payday) : "payday"));
  }
  if (td.record) bits.push("🎯 " + td.record + " " + units(td.units) + " today");
  const nx = todayEvents().filter(e => !e.allDay && new Date(e.start).getTime() > Date.now())[0];
  if (nx) bits.push("📅 " + t12(nx.start) + " " + nx.title);
  if (finHave() && arr(F.chase).length) bits.push("🔎 " + arr(F.chase).length + " to chase");
  const b = $("#brief");
  if (b) { b.textContent = bits.join("  ·  "); b.classList.toggle("hidden", !bits.length); }
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

// v15: the Finance block at the top of Money.
function financeBlock() {
  const F = fin(), tp = obj(F.till_payday), me = obj(F.month_end), ow = obj(F.owed), bz = obj(F.business);
  const ds = Number(F.days_since_reconcile), when = s => isYmd(s) ? dayName(s) : String(s || "");
  let h = sec("🏦 Banks · matched to the bank " + when(F.reconciled_day) + (ds > 0 ? " · " + ds + " day" + (ds > 1 ? "s" : "") + " ago" : ""));
  arr(F.banks).forEach(b => { h += row(b.name, money(b.balance), b.note || "", sign(b.balance)); });
  if (F.banks_total != null) h += row("All three", money(F.banks_total), "", sign(F.banks_total));
  if (tp.total != null) {
    h += sec("⏳ Till payday " + when(F.next_payday) + " · " + money(tp.total));
    arr(tp.accounts).forEach(a => { h += row(a.name, money(a.balance), "on " + when(tp.day), sign(a.balance)); });
    const pin = arr(F.payday_in);
    if (pin.length) h += row("Payday brings", money(pin.reduce((s, x) => s + Number(x.amount || 0), 0)), pin.map(x => x.name + " " + money(x.amount)).join(" · "), "pos");
  }
  const oh = arr(F.out_of_hole);
  if (oh.length) h += sec("🧭 Out of the hole") + oh.map(t => `<p class="note">${esc(t)}</p>`).join("");
  const bp = arr(F.before_payday).filter(x => x && typeof x === "object");
  if (bp.length) h += sec("📋 Before payday · " + bp.length) + bp.map(x => row(x.item, money(x.amount), x.account + " · " + when(x.when), sign(x.amount))).join("");
  if (me.total != null) {
    h += sec("📅 Month end " + when(me.day) + " · " + money(me.total));
    arr(me.accounts).forEach(a => { h += row(a.name, money(a.balance), "", sign(a.balance)); });
  }
  // v17: every bills run is kept - is the gap before payday shrinking? and what was really spent.
  const hi = arr(F.history).filter(x => x && isYmd(x.day));
  if (hi.length) {
    h += sec("📈 Each bills run · is the gap shrinking?");
    hi.forEach((x, i) => {
      const p = hi[i - 1], d = p && x.till_payday_total != null && p.till_payday_total != null ? Number(x.till_payday_total) - Number(p.till_payday_total) : null;
      const ew = Number(x.spending_days) > 0 ? " · everyday " + money((Number(x.everyday || 0) + Number(x.believe_card || 0)) / Number(x.spending_days) * 7) + "/wk" : "";
      h += row(when(x.day), money(x.till_payday_total), "till payday" + (d == null ? " · first run kept" : " · " + (d >= 0 ? "better by " : "worse by ") + money(Math.abs(d))) + ew, sign(x.till_payday_total));
    });
  }
  const sp = obj(F.spending), sd = Number(sp.days) || 0;
  if (sd > 0) {
    const wk = v => money(Number(v || 0) / sd * 7) + "/wk";
    h += sec("🧠 What you really spent · " + when(sp.from) + " - " + when(sp.to));
    h += row("Everyday (cards)", wk(Number(sp.everyday || 0) + Number(sp.believe_card || 0)), "plan " + money(sp.plan_everyday_per_week) + "/wk" + (sp.everyday_items ? " · " + sp.everyday_items : ""));
    h += row("Afterpay", wk(sp.afterpay), "installments that cleared");
    h += row("Gas", wk(sp.gas), "");
    h += `<p class="note">${hi.length >= 2 ? "Claude compares these at each bills run and suggests a better weekly number. Nothing changes without your yes."
                                         : "One run so far. After the next bills run Claude can suggest a weekly number from what you really spend. Nothing changes without your yes."}</p>`;
  }
  const ch = arr(F.chase).filter(c => c && typeof c === "object");
  h += sec("🔎 Things to chase · " + ch.length) + (ch.length ? ch.map(c => row(c.title, "", c.detail)).join("") : `<p class="note">Nothing to chase.</p>`);
  if (ow.error) h += sec("🤝 Who owes you") + `<p class="note">${esc(ow.error)}</p>`;
  else if (ow.total != null) {
    h += sec("🤝 Who owes you · " + money(ow.total));
    arr(ow.people).filter(p => p && Number(p.owed) > 0).forEach(p => { h += row(p.name, money(p.owed), p.last ? "last " + when(p.last) : ""); });
  }
  if (bz.total != null) {
    h += sec("🏢 Business (CMMG) " + when(bz.from) + " - " + when(bz.to) + " · " + money(bz.total));
    arr(bz.items).forEach(i => { h += row(i.name, money(i.amount)); });
  }
  return h;
}

const HUB_LOOKS = [["dayhub", "Day Hub"], ["cruisehub", "Cruise Hub"]];     // v22: the Hubs with a new look so far
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
    let h = finHave() ? financeBlock() + sec("From statements (older)") : sec("Cash");
    h += row("Starting balance", money(c.starting_balance), "built " + (c.built_at || "?"));
    (c.accounts || []).forEach(a => { h += row(a.name, money(a.balance), "as of " + a.as_of + (a.days_old > 7 ? " · " + a.days_old + " days old" : ""), a.days_old > 14 ? "old" : ""); });
    if (c.low_water != null) h += row("Lowest point ahead", money(c.low_water), c.low_water_date ? dayName(c.low_water_date) : "", sign(c.low_water));
    if (c.first_negative) h += `<p class="note">The forecast goes negative ${esc(dayName(c.first_negative))}, but it starts from balances up to ${esc(oldestBalance(mo))} old.</p>`;
    const due = dueOpen(mo);
    h += sec((finHave() ? "Desktop bill list (not your plan) · " : "Due in the next 7 days · ") + money(due.reduce((s, x) => s + Number(x.amount || 0), 0)));
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
  usemart: ["🛒 UseMart support", () => {
    const U = um(), items = umItems();
    let h = `<p class="note">Waiting on you: <b>${esc(Number(U.waiting) || 0)}</b>${Number(U.over_24h) ? ` · <span class="neg">${esc(U.over_24h)} over 24 h</span>` : ""} · updated ${esc(ago(umAge()))}. The page promises a reply within 2 business days; your target is 24 hours.</p>`;
    h += items.length ? items.map(x => `<div class="row"><div class="l">${esc(x.name)} · ${esc(x.topic)}<small>ref ${esc(x.ref)} · waiting ${esc(ago(Number(x.age_min)))}${x.over_24h ? " · over 24 h" : ""}</small></div>` +
      `<div class="r ${x.over_24h ? "neg" : ""}"><a class="umreply" href="${UM_REPLY + encodeURIComponent(String(x.id).toLowerCase())}" target="_blank" rel="noopener">Reply ↗</a></div></div>`).join("")
      : `<p class="note">Nothing waiting. 👍</p>`;
    h += `<p class="note">Reply opens the item in UseMart → Account → Owner controls → Support & reports (sign in as an admin on this phone once).</p>`;
    return h;
  }],
  games: ["🏟️ Games today", () => {          // v20
    const G = gamesToday(), t = todayCT(), sd = (mh().bets || {}).session_date;
    const betsLine = x => x.bets.map(b => b.bet + (b.result ? " (" + b.result + ")" : "")).join(" · ");
    const grp = (title, list, right, cls) => list.length ? sec(title + " · " + list.length) + list.map(x => row(x.sport + " · " + x.game, right(x), betsLine(x), cls(x))).join("") : "";
    let h = `<p class="note">Today's card${isYmd(sd) ? " (" + esc(dayName(sd)) + ")" : ""} - every game with a board pick on it, by start time. ` +
      `Your day's record is the Today tile.</p>`;
    if (!G.length) h += `<p class="note">No picks on today's card yet.</p>`;
    h += grp("🔴 Live now", G.filter(x => x.state === "live"), x => "since " + gameWhen(x), () => "");
    h += grp("⏭️ Coming up", G.filter(x => x.state === "next"), x => gameWhen(x), () => "");
    h += grp("⏳ Waiting on a grade", G.filter(x => x.state === "wait"), x => gameWhen(x), () => "old");
    h += grp("✅ Finished · board picks", G.filter(x => x.state === "done"), x => x.w + "-" + x.l, x => x.w > x.l ? "pos" : x.l > x.w ? "neg" : "");
    const mine = calEvents().filter(e => SPORT_CAL.test(String(e.cal || "")) && evDay(e) >= t);
    if (mine.length) h += sec("🏈 Your teams · next 7 days (Google Calendar)") + mine.slice(0, 10).map(e =>
      row(e.title || "(no title)", (evDay(e) === t ? "Today" : dayName(evDay(e))) + (e.allDay ? "" : " " + t12(e.start)), e.cal || "")).join("");
    if (CAL && CAL.more) h += `<p class="note">The calendar list was cut short (${esc(CAL.more)} later events) - a team game late in the week may be missing.</p>`;
    return h;
  }],
  dates: ["🎂 Birthdays & dates", () => {          // v20
    const D = dateEvents(), wk = D.filter(e => dateIn(e) <= 7), later = D.filter(e => dateIn(e) > 7);
    const line = e => row((/🎂/u.test(String(e.title)) ? "" : "🎂 ") + e.title, dateDay(e), (dateIn(e) > 1 ? "in " + dateIn(e) + " days · " : "") + (e.cal || ""), dateIn(e) === 0 ? "old" : "");
    let h = CAL && !CAL.ok ? `<p class="note neg">Google Calendar can't be read: ${esc(CAL.error)}</p>` : "";
    if (CAL && CAL.birthdays_error) h += `<p class="note neg">Birthdays calendar can't be read: ${esc(CAL.birthdays_error)}</p>`;
    if (CAL && CAL.birthdays_from && CAL.birthdays_from.contacts === false) h += `<p class="note neg">Google Contacts' Birthdays calendar wasn't found - only your own calendar's birthday events are listed.</p>`;
    if (CAL && CAL.more) h += `<p class="note">The calendar list was cut short (${esc(CAL.more)} later events) - a birthday on another calendar late in the week may be missing.</p>`;
    h += sec("This week · " + wk.length) + (wk.length ? wk.map(line).join("") : `<p class="note">None this week.</p>`);
    if (CAL && Array.isArray(CAL.birthdays)) h += sec("Coming up · next 12 months · " + later.length) + (later.length ? later.map(line).join("") : `<p class="note">Nothing else saved.</p>`);
    return h + `<p class="note">From Google Contacts (a contact's birthday) and any yearly event on your calendar titled "birthday", "bday", "anniversary" or 🎂. ` +
      `Tell Claude names and dates and it adds them for you.</p>`;
  }],
  weather: ["🌤️ Weather", () => {          // v19
    const P = loadJ(K_PLACE, null), edit = `<button class="pay undo" data-act="place-edit">${P ? "Change town" : "Set your town"}</button>`;
    if (!P) return `<p class="note">No town set on this phone yet.</p>` + edit;
    let h = sec("📍 " + P.label + (WX && WX.at ? " · updated " + ago((Date.now() - WX.at) / 60000) : ""));
    if (wxMine()) {
      const fin2 = v => Number.isFinite(Number(v)), rn = Math.round(Number(WX.rain));
      h += row("Now", Math.round(WX.temp) + "°", "");
      if (fin2(WX.hi) && fin2(WX.lo)) h += row("Today", "High " + Math.round(WX.hi) + "° · Low " + Math.round(WX.lo) + "°", Number.isFinite(rn) ? "rain chance " + rn + "%" : "");
      if (fin2(WX.lo2)) h += row("Tonight", "Low " + Math.round(Math.min(Number(WX.lo2), WX.temp)) + "°", "");
      const s = arr(WX.sun)[0];
      if (s) h += row("Sunrise · sunset", t12(new Date(s[0]).toISOString()) + " · " + t12(new Date(s[1]).toISOString()), "the new look turns bright at sunrise and dark at sunset");
      const wa = wxAlerts(), age = wxAlertsAge();
      h += sec("Weather alerts · National Weather Service" + (isFinite(age) ? " · checked " + ago(age / 60000) : ""));
      h += wa.map(a => row(a.event, a.ends ? "until " + when(a.ends) : "", a.headline, /warning/i.test(a.event) ? "neg" : "old")).join("");
      if (WX.alertsErr) h += `<p class="note neg">Couldn't reach the Weather Service on the last try - retrying every 5 min. Not an all-clear.` +
        `${isFinite(age) ? " Last good check " + esc(ago(age / 60000)) + "." : ""}</p>`;
      else if (age > WX_CLEAR_MS) h += `<p class="note neg">${isFinite(age) ? "Last good check " + esc(ago(age / 60000)) : "Not checked yet"} - not current. Tap 🔄 or check a weather app.</p>`;
      else if (!wa.length) h += `<p class="note">No alerts. 👍</p>`;
    } else h += `<p class="note">Getting the forecast…</p>`;
    return h + `<p class="note">The town stays on this phone only. Forecast from Open-Meteo, alerts from weather.gov.</p>` + edit;
  }],
  views: ["👀 Site views", () => {
    const v = viewData();
    let h = "";
    VIEW_SITES.forEach(([s, name, icon]) => {
      const d = v[s];
      h += sec(icon + " " + name);
      if (!d) { h += `<p class="note">No count yet.</p>`; return; }
      h += row("Today", nViews(obj(d.today).views), nViews(obj(d.today).uniques) + " people");
      h += row("This month", nViews(obj(d.month).views), nViews(obj(d.month).uniques) + " people");
      h += row("All time", nViews(obj(d.total).views), nViews(obj(d.total).uniques) + " people");
    });
    return h + `<p class="note">The same person within 30 minutes counts as one view, and "people" counts each person once a day. Search robots aren't counted. Counting started when the counter was added.</p>`;
  }],
  claude: ["🤖 Claude", () => {
    const off = pcStale(), dp = !!store.get(K_DEC), taken = new Set(arr(mh().ideas_taken));
    let h = `<a class="pay claudego" href="https://claude.ai/code" target="_blank" rel="noopener">Talk to Claude</a>`;
    h += `<p class="note">${off ? "Your PC looks off or quiet" + (mh().generated_at ? " (last report " + esc(ago(ageMin(mh().generated_at))) + ")" : "") + ". Claude runs on the PC, so it can't answer until the PC is back. Save your idea below." : "Your PC is on. Your session shows in the list once /rc is running on the PC."}</p>`;
    h += sec("Save an idea");
    h += `<form data-ideaform class="ideaform"><textarea name="idea" rows="4" maxlength="${IDEA_TEXT}" placeholder="Type your idea" aria-label="Your idea">${esc(store.get(K_IDEADRAFT) || "")}</textarea><button type="submit" class="pay">Save idea</button></form>`;
    if (!dp) h += `<p class="note">This phone doesn't have your approvals link yet, so ideas stay here until it does.</p>`;
    const rows = ideaList().slice().reverse();
    if (rows.length) h += sec("Your ideas");
    h += rows.map(i => row(i.text, taken.has(i.id) ? "✓ On your PC" : i.sent ? "Saved online" : "Waiting to send", new Date(i.at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Chicago" }))).join("");
    return h;
  }],
  hublooks: ["✨ New looks", () => {
    let h = `<p class="note">Turns a Hub's new look on or off for this phone only. Customers still see the old look.</p>`;
    HUB_LOOKS.forEach(([id, name]) => {
      const on = store.get(id + ".look") === "tiles", here = !!store.get(id + ".v1");
      h += `<div class="row"><div class="l">${name}<small>${on ? "New look on" : "Old look"}${here ? "" : " · not seen on this phone's browser yet. If it's installed from another browser, this can't reach it"}</small></div>` +
        `<div class="r"><span class="chip${on ? " on" : ""}" role="button" tabindex="0" data-act="hublook" data-hub="${id}">${on ? "On" : "Off"}</span> <a class="chip" href="../${id}/" target="_blank" rel="noopener">Open</a></div></div>`;
    });
    return h + `<p class="note">Close and reopen a Hub if it's already open. Classic Look inside a Hub turns it back off too. Home, Auto, Trip and Money don't have a new look yet.</p>`;
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
  renderTlHero();
  if (!DATA) { $("#needs").innerHTML = `<li class="bad">Can't load yet${LAST_ERR ? `<small>${esc(LAST_ERR)}</small>` : ""}</li>`; return; }
  $("#apBubble").classList.toggle("hidden", !ap().enabled);
  $("#umBubble").classList.toggle("hidden", !umHave());
  renderBrief();
  renderNeeds();
  renderGlance();
  renderTiles();
  orderBubbles();
  const open = $("#sheet:not(.hidden)") && $("#sheet").dataset.key;
  if (open) openSheet(open);
}

// ── v21 UPDATE READY ──
// The worker fetches new files when the app is OPENED, but a phone resumes an app left open on its old code. version.json says
// what's published; a mismatch shows the button at the top of the front screen, in both looks.
const VERSION = "24";
async function checkUpdate() {
  try {
    const r = await fetch("version.json?x=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return;
    const j = await r.json();
    $("#updBar").classList.toggle("hidden", !(Number(j.version) > Number(VERSION)));
  } catch (e) { /* offline: the next check tries again */ }
}
let UPDATING = false;
async function applyUpdate() {
  if (UPDATING) return;
  UPDATING = true; $("#updBar").textContent = "Updating…";
  // A reload alone can reuse scripts from the browser's 10-minute cache, and then the button just comes back. Fetch this app's own files fresh first.
  const fresh = [...document.querySelectorAll("script[src], link[rel=stylesheet]")].map(el => el.src || el.href).filter(u => new URL(u).origin === location.origin)
    .map(u => fetch(u, { cache: "reload" }).then(r => r.ok).catch(() => false));
  const got = await Promise.race([Promise.all(fresh).then(l => l.every(Boolean)), new Promise(r => setTimeout(() => r(false), 8000))]);
  if (!got) { UPDATING = false; $("#updBar").textContent = "Weak signal: tap to try again"; return; }   // half new, half old files could break the app: stay as it is
  location.reload();
}

// ── v19 TILES LOOK (switch: scotthub.look; v21: on unless this phone chose "classic") ──
const K_LOOK = "scotthub.look", K_PLACE = "scotthub.place", K_WX = "scotthub.wx";
const TL_NEEDS_MAX = 3, WX_EVERY_MS = 30 * 60000, WX_RETRY_MS = 5 * 60000;
const WX_URL = "https://api.open-meteo.com/v1/forecast", GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WX_OLD_MS = 3 * 3600000;       // alerts older than this are never shown as an all-clear
let WX = loadJ(K_WX, null), WX_BUSY = false, WX_AGAIN = false, WX_TRIED = 0, PLACE_EDIT = false, PLACE_MSG = "", PLACE_TYPED = null;
const tilesOn = () => store.get(K_LOOK) !== "classic";

// Weather for a town typed once on this phone (same lookups as Day Hub: a ZIP goes to Zippopotam - exact;
// a name to Open-Meteo's US search). Kept to 2 decimals (about a kilometre) - only ever sent to the weather services.
const ZIP5 = /^\s*(\d{5})(?:-\d{4})?\s*$/;
// "Town, ST": Open-Meteo gives the full state name, so a 2-letter state is matched through this list.
const US_ST = Object.fromEntries(("AL Alabama|AK Alaska|AZ Arizona|AR Arkansas|CA California|CO Colorado|CT Connecticut|DE Delaware|" +
  "DC District of Columbia|FL Florida|GA Georgia|HI Hawaii|ID Idaho|IL Illinois|IN Indiana|IA Iowa|KS Kansas|KY Kentucky|LA Louisiana|" +
  "ME Maine|MD Maryland|MA Massachusetts|MI Michigan|MN Minnesota|MS Mississippi|MO Missouri|MT Montana|NE Nebraska|NV Nevada|" +
  "NH New Hampshire|NJ New Jersey|NM New Mexico|NY New York|NC North Carolina|ND North Dakota|OH Ohio|OK Oklahoma|OR Oregon|" +
  "PA Pennsylvania|RI Rhode Island|SC South Carolina|SD South Dakota|TN Tennessee|TX Texas|UT Utah|VT Vermont|VA Virginia|" +
  "WA Washington|WV West Virginia|WI Wisconsin|WY Wyoming").split("|").map(s => [s.slice(0, 2).toLowerCase(), s.slice(3).toLowerCase()]));
async function findPlace(q) {
  const z = ZIP5.exec(q || "");
  if (z) {
    const r = await fetch("https://api.zippopotam.us/us/" + z[1]);
    if (!r.ok) return null;
    const p = arr((await r.json()).places)[0];
    return p ? { lat: Number(p.latitude), lon: Number(p.longitude), label: p["place name"] + ", " + p["state abbreviation"] } : null;
  }
  const name = String(q || "").split(",")[0].trim(), st = (String(q || "").split(",")[1] || "").trim().toLowerCase();
  if (!name) return null;
  const j = await (await fetch(GEO_URL + "?name=" + encodeURIComponent(name) + "&count=10&language=en&countryCode=US")).json();
  const want = US_ST[st] || st, res = arr(j.results).filter(x => x && Number.isFinite(Number(x.latitude)));
  // a state that matches nothing is "not found" (try the ZIP) - never a same-named town somewhere else
  const isSt = a => a === want || (st === "dc" && /^washington,? d\.?c/.test(a));
  const hit = st ? res.find(x => isSt(String(x.admin1 || "").toLowerCase())) : res[0];
  return hit ? { lat: Number(hit.latitude), lon: Number(hit.longitude), label: hit.name + ", " + (hit.admin1 || "US") } : null;
}

async function loadWeather(force) {
  const P = loadJ(K_PLACE, null), now = Date.now();
  if (!P) return;
  if (WX_BUSY) { if (force) WX_AGAIN = true; return; }        // a town saved mid-fetch runs again right after
  const fresh = WX && WX.place === P.label && now - WX.at < (WX.alertsErr ? WX_RETRY_MS : WX_EVERY_MS);
  if (!force && (fresh || now - WX_TRIED < WX_RETRY_MS)) return;
  WX_BUSY = true; WX_TRIED = now;
  const mine = WX && WX.place === P.label ? WX : null;
  let w = null;
  try {
    // unixtime: sunrise / sunset arrive as real instants, so a daylight-saving change can't shift them an hour
    const q = "latitude=" + P.lat + "&longitude=" + P.lon + "&current=temperature_2m,weather_code" +
      "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset" +
      "&temperature_unit=fahrenheit&timezone=auto&timeformat=unixtime&forecast_days=2";
    const r = await fetch(WX_URL + "?" + q), j = await r.json(), D = obj(j.daily), C = obj(j.current);
    if (!r.ok || j.error || !isNum(C.temperature_2m)) throw new Error("forecast");   // an error reply never replaces a good forecast
    const ms = s => Number(s) * 1000, hi = arr(D.temperature_2m_max), lo = arr(D.temperature_2m_min);
    w = { at: now, place: P.label, temp: C.temperature_2m, code: C.weather_code, hi: hi[0], lo: lo[0], lo2: lo[1],
      rain: arr(D.precipitation_probability_max)[0],
      sun: arr(D.sunrise).map((s, i) => [ms(s), ms(arr(D.sunset)[i])]).filter(x => x.every(Number.isFinite)),
      alerts: mine ? arr(mine.alerts) : [], alertsAt: mine ? mine.alertsAt : null };       // the last alerts check carries over
    if (isNum(w.hi)) w.hi = Math.max(w.hi, w.temp);        // never a high below now
    if (isNum(w.lo)) w.lo = Math.min(w.lo, w.temp);
  } catch (e) { w = mine ? Object.assign({}, mine) : null; }     // keep the last forecast; try again in 5 min
  if (w) {
    try {       // checked even when the forecast failed. An error reply, a non-US point or a rate limit = "unavailable"
      const ra = await fetch("https://api.weather.gov/alerts/active?point=" + P.lat + "," + P.lon), a = await ra.json();
      if (!ra.ok || !Array.isArray(a.features)) throw new Error("alerts");
      w.alerts = a.features.map(f => obj(f && f.properties)).slice(0, 6)
        .map(p => ({ event: String(p.event || "Weather alert"), headline: String(p.headline || ""), ends: String(p.ends || p.expires || "") }));
      w.alertsAt = now; w.alertsErr = false;
    } catch (e) { w.alertsErr = true; }
    WX = w; store.set(K_WX, JSON.stringify(w));
  }
  WX_BUSY = false;
  render();
  if (WX_AGAIN) { WX_AGAIN = false; loadWeather(true); }
}
const isNum = v => typeof v === "number" && Number.isFinite(v);
const wxMine = () => { const P = loadJ(K_PLACE, null); return !!(P && WX && WX.place === P.label && isNum(WX.temp)); };
// How old the last GOOD alerts check is. Green "No weather alerts" only under 45 min; nothing at all past 3 hours.
const WX_CLEAR_MS = 45 * 60000;
const wxAlertsAge = () => WX && isNum(WX.alertsAt) ? Date.now() - WX.alertsAt : Infinity;
const wxOld = () => wxAlertsAge() > WX_OLD_MS;
// Active NWS alerts for this phone's town (tiles look) from the last good check under 3 hours old - a failed
// re-check keeps showing the last known Warning until its own end time, never hides it.
function wxAlerts() {
  if (!tilesOn() || !wxMine() || wxOld()) return [];
  return arr(WX.alerts).filter(a => a && (!a.ends || !(Date.parse(a.ends) < Date.now())));
}
function wxIcon(code, day) {
  const c = Number(code);
  if (c === 0) return day ? "☀️" : "🌙";
  if (c <= 2) return day ? "🌤️" : "☁️";
  if (c === 3) return "☁️";
  if (c <= 48) return "🌫️";
  if (c <= 67 || (c >= 80 && c <= 82)) return "🌧️";
  if (c <= 77 || c === 85 || c === 86) return "🌨️";
  return "⛈️";
}

// Bright from sunrise to sunset (the forecast's own times); 7 AM - 6 PM by the clock until a town is set.
function dayPhase() {
  const now = Date.now(), p = WX ? arr(WX.sun).find(x => Array.isArray(x) && now < x[1]) : null;
  if (p) return now >= p[0] ? { day: true, next: p[1] } : { day: false, next: p[0] };
  const hr = Number(new Date().toLocaleString("en-US", { timeZone: TZ, hour: "numeric", hour12: false }));
  return { day: hr >= 7 && hr < 18, next: null };
}
function applyLook() {
  const on = tilesOn(), ph = dayPhase(), b = document.body;
  b.classList.toggle("tl", on); b.classList.toggle("tl-day", on && ph.day); b.classList.toggle("tl-night", on && !ph.day);
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute("content", on && ph.day ? "#1d4ed8" : "#0b1020");
  return ph;
}

// The overnight low after sunset (tomorrow's minimum), the day's low before it - never above the temperature now.
function wxLow() {
  const s = arr(WX.sun)[0], tonight = Array.isArray(s) && Date.now() > s[1] && isNum(WX.lo2);
  return tonight ? Math.min(Number(WX.lo2), WX.temp) : Number(WX.lo);
}
// The alerts line under the weather: red / amber pill for an alert, amber when it can't be trusted, green only when checked and clear.
function wxAlertLine(P) {
  const wa = wxAlerts(), red = wa.some(x => /warning/i.test(x.event)), go = `data-open="weather" role="button" tabindex="0"`;
  const age = wxAlertsAge(), checked = isFinite(age) ? "checked " + ago(age / 60000) : "not checked yet";
  if (wa.length) return `<div class="tl-al ${red ? "bad" : "warn"}" ${go}>⚠️ ${esc(wa.map(x => x.event).join(" · "))}` +
    `${age > WX_CLEAR_MS || WX.alertsErr ? " · " + esc(checked) : ""}</div>`;
  if (WX.alertsErr) return `<div class="tl-al warn" ${go}>Weather alerts unavailable - retrying${isFinite(age) ? " · last " + esc(checked) : ""}</div>`;
  if (age > WX_CLEAR_MS) return `<div class="tl-al warn" ${go}>Weather alerts ${esc(checked)}</div>`;
  return `<div class="tl-al"><span class="dotg"></span>No weather alerts · ${esc(P.label)}</div>`;
}
function renderTlHero() {
  const ph = applyLook(), el = $("#tlHero"), ae = document.activeElement;
  if (!el || !tilesOn() || (ae && ae.tagName === "INPUT" && el.contains(ae))) return;     // never wipe a town being typed
  try {
    const now = new Date(), P = loadJ(K_PLACE, null);
    const [hm, ap] = now.toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).split(/\s+/);
    const badge = ph.next ? (ph.day ? "🌙 Dark at " : "☀️ Bright at ") + t12(new Date(ph.next).toISOString()) : "";
    let wx;
    if (PLACE_EDIT || !P) wx = `<form class="tl-place" data-placeform><input name="q" autocomplete="off" placeholder="Town, ST or ZIP for weather" ` +
      `value="${esc(PLACE_TYPED != null ? PLACE_TYPED : P ? P.label : "")}"><button type="submit">Save</button>` +
      (P ? `<button type="button" class="tl-cancel" data-act="place-cancel">Cancel</button>` : "") + `</form>` +
      (PLACE_MSG ? `<div class="tl-al">${esc(PLACE_MSG)}</div>` : "");
    else if (wxMine()) {
      const rain = Math.round(Number(WX.rain)), hi = Math.round(Number(WX.hi)), lo = Math.round(wxLow());
      wx = `<div class="tl-wx" data-open="weather" role="button" tabindex="0">${wxIcon(WX.code, ph.day)} ${Math.round(WX.temp)}° now` +
        `${ph.day ? (Number.isFinite(hi) ? " · High " + hi + "°" : "") : (Number.isFinite(lo) ? " · Low " + lo + "°" : "")}${rain >= 30 ? " · 💧 " + rain + "%" : ""}</div>` + wxAlertLine(P);
    } else wx = `<div class="tl-wx" data-open="weather" role="button" tabindex="0">Weather for ${esc(P.label)}…</div>`;
    const f = $("#fresh");
    el.innerHTML = (badge ? `<span class="tl-badge">${esc(badge)}</span>` : "") +
      `<div class="tl-hello">${esc($("#hello").textContent)}</div><div class="tl-clock">${esc(hm)}<small>${esc(ap || "")}</small></div>` +
      `<div class="tl-date">${esc($("#date").textContent)}</div>${wx}<div class="${esc(f.className)}">${esc(f.textContent)}</div>`;
  } catch (e) { el.innerHTML = `<div class="tl-al warn">Clock tile hit a snag: ${esc(e.message || e)}</div>`; }
}

// ── v20 games + birthdays ──
// Today's card (bets.slate: each board pick with its game's start and result), one entry per game. A game that started
// under LIVE_H hours ago with a pick still open is live; older and still open = waiting on a grade. NOTE: the slate is
// every board's picks (FIRE 10, top 10s, props...), not the official record - so no day W-L is ever totaled from it
// here; the Today tile's record (page_stats_tracker) is the one record.
const LIVE_H = 5;
const SPORT_CAL = /razorback|football|baseball|basketball|hockey|soccer|\bnfl\b|\bnba\b|\bnhl\b|\bmlb\b|ncaa/i;   // his teams' calendars
const RES_W = /^(WIN|WON|W)$/i, RES_L = /^(LOSS|LOST|L)$/i, RES_DONE = /^(WIN|WON|W|LOSS|LOST|L|PUSH|P|VOID|CANCELL?ED|NO ACTION)$/i;
// sport + both teams in any order ("A @ B" = "B vs A") - two pages may write the same game either way
const gameKey = (sport, game) => String(sport || "").toLowerCase() + "|" +
  String(game || "").toLowerCase().split(/\s+(?:@|vs\.?|v\.?|at)\s+/).map(s => s.replace(/[^\p{L}\p{N}]+/gu, " ").trim()).sort().join("|");
function gamesToday() {
  const out = [], now = Date.now();
  // one game = same matchup within 3 hours (two pages can stamp the same game minutes apart; a doubleheader stays two)
  arr((mh().bets || {}).slate).filter(x => x && typeof x === "object" && x.start && x.game && Number.isFinite(new Date(x.start).getTime()))
    .sort((a, z) => new Date(a.start) - new Date(z.start)).forEach(x => {
      const t = new Date(x.start).getTime(), key = gameKey(x.sport, x.game);
      let g = out.find(o => o.key === key && t - o.t < 3 * 3600000);
      if (!g) out.push(g = { t, key, start: x.start, game: String(x.game), sport: String(x.sport || ""), bets: [] });
      g.bets.push(x);
    });
  return out.map(x => {
    const r = b => String(b.result || "").trim();
    const open = x.bets.filter(b => !RES_DONE.test(r(b))).length, w = x.bets.filter(b => RES_W.test(r(b))).length, l = x.bets.filter(b => RES_L.test(r(b))).length;
    return Object.assign(x, { open, w, l, state: x.t > now ? "next" : !open ? "done" : now - x.t < LIVE_H * 3600000 ? "live" : "wait" });
  });
}
// A start time, with its day in front when it isn't today (last night's late game, tomorrow's early one).
const gameWhen = x => { const d = new Date(x.start).toLocaleDateString("en-CA", { timeZone: TZ });
  return (d === todayCT() ? "" : new Date(x.start).toLocaleDateString("en-US", { timeZone: TZ, weekday: "short" }) + " ") + t12(x.start); };
// Birthdays / anniversaries: calendar events in the relay's 7 days titled with one of these, plus (relay v7) the next
// 12 months from Google Contacts' Birthdays calendar and his own yearly birthday events (calendar.birthdays). Deduped.
const DATE_RE = /birthday|\bb-?day\b|🎂|anniversary/iu;
function dateEvents() {
  const t = todayCT(), seen = new Set(), out = [];
  const week = calEvents().filter(e => e && DATE_RE.test(String(e.title || "")));
  const year = arr(CAL && CAL.birthdays).filter(b => b && isYmd(b.day)).map(b => ({ title: String(b.title || ""), start: b.day, allDay: true, cal: "Birthdays" }));
  week.concat(year).forEach(e => {
    const k = String(e.title).toLowerCase() + "|" + evDay(e);
    if (evDay(e) >= t && !seen.has(k)) { seen.add(k); out.push(e); }
  });
  return out.sort((a, z) => evDay(a).localeCompare(evDay(z)));
}
// "🎂 Mom's birthday" / "Birthday: Sarah" / "Happy Birthday, Mom!" -> the name; anniversaries keep their title.
const dateWho = e => String(e.title || "").replace(/[🎂🎉🎈️]/gu, "").replace(/['’]s\s+(birthday|b-?day)\b/gi, "")
  .replace(/\b(happy\s+)?(birthday|b-?day)\b/gi, "").replace(/\s{2,}/g, " ").replace(/^[\s\-–—:,|·!]+|[\s\-–—:,|·!]+$/g, "").trim() || String(e.title || "");
const dateIn = e => Math.round((new Date(evDay(e) + "T12:00:00") - new Date(todayCT() + "T12:00:00")) / 86400000);
const dateDay = e => { const n = dateIn(e); return n === 0 ? "Today" : n === 1 ? "Tomorrow" : dayName(evDay(e)); };

// One tile per area: its key number, a pill (green / red / amber) and one line under it. Tapping opens the area's
// sheet. The first six stay put (the daily core); the rest follow what he opens most, as the bubbles do (v17).
function tileList() {
  const m = mh(), d = dk(), b = m.bets || {}, td = b.today || {}, wk = b.week || {}, t5 = b.top5 || {}, h = m.health || {}, T = [];
  const add = (open, icon, title, value, unit, chip, tone, sub, alarm) => T.push({ open, icon, title, value, unit, chip, tone, sub, alarm });
  const pill = n => n == null ? "" : sign(n);
  add("bets", "🎯", "Today", td.record || "-", "", td.units != null ? units(td.units) : "", pill(td.units), td.pending ? td.pending + " still pending" : "nothing pending");
  // v20 Games: next start, live count, picks riding - never a second day record (that is the Today tile's job)
  const G = gamesToday(), nxt = G.filter(x => x.state === "next"), live = G.filter(x => x.state === "live"), wait = G.filter(x => x.state === "wait");
  const riding = G.reduce((s, x) => s + x.open, 0), picks = n => n + " pick" + (n === 1 ? "" : "s");
  if (!G.length) add("games", "🏟️", "Games today", "None", "", "", "", "no picks on today's card yet");
  else if (nxt.length) add("games", "🏟️", "Games today", gameWhen(nxt[0]), "next", live.length ? live.length + " LIVE" : "", "",
                           nxt[0].sport + " · " + nxt[0].game + " · " + picks(riding) + " riding");
  else if (live.length) add("games", "🏟️", "Games today", String(live.length), "live", "", "", picks(riding) + " riding" + (wait.length ? " · " + wait.length + " to grade" : ""));
  else if (wait.length) add("games", "🏟️", "Games today", String(wait.length), "to grade", "", "", picks(riding) + " still open", "warn");
  else add("games", "🏟️", "Games today", "Done", "", "", "", "every pick graded");
  if (finHave()) {
    const F = fin(), tp = obj(F.till_payday), n = arr(F.chase).length, short = Number(tp.total) < 0;
    add("money", "💵", "Till payday", money(tp.total), "", tp.total == null ? "" : short ? "SHORT" : "OK", short ? "neg" : "pos",
        (isYmd(F.next_payday) ? "payday " + dayName(F.next_payday) : "") + (n ? " · " + n + " to chase" : ""), short ? "bad" : "");
  } else {
    const due = dueOpen(d.money || {});
    add("money", "💵", "Bills · 7 days", money(due.reduce((s, x) => s + Number(x.amount || 0), 0)), "", "", "", due.length + " still to pay");
  }
  const te = todayEvents(), nx = te.filter(e => !e.allDay)[0];
  if (nx) {
    const mins = Math.round((new Date(nx.start).getTime() - Date.now()) / 60000);
    add("calendar", "📅", "Next up", t12(nx.start), "", mins <= 0 ? "NOW" : mins <= 120 ? "in " + (mins < 60 ? mins + " min" : Math.round(mins / 6) / 10 + " h") : "", mins <= 60 ? "old" : "", nx.title);
  } else add("calendar", "📅", "Next up", "Clear", "", "", "", te.length ? te.length + " all-day item" + (te.length > 1 ? "s" : "") + " today" : "nothing else today");
  // Systems: "All up" only when nothing at all is wrong - red alerts, a bot down, a silent server, the app not
  // running (the same things What needs you flags); a quiet PC is amber, the server's own report when the PC is off.
  const on = serverOn(), pc = h.pc || {}, sv = h.server || {};
  const bots = Object.values(on ? obj(sv13().bots) : obj(sv.bots)), up = bots.filter(x => x === true).length, down = bots.length - up;
  const fails = on ? svAlerts(sv13()).filter(x => x.severity === "FAIL").length : healthAlerts().shown.filter(x => x.severity === "FAIL").length;
  const silent = !on && sv.alive === false, appOff = !on && pc.active === false, n = fails + down + (silent ? 1 : 0) + (appOff ? 1 : 0);
  const probs = [fails ? fails + " red alert" + (fails > 1 ? "s" : "") : "", down ? down + " bot" + (down > 1 ? "s" : "") + " down" : "",
    silent ? "server silent" : "", appOff ? "app not running" : ""].filter(Boolean).join(" · ");
  const mark = v => v === true ? "✓" : v === false ? "✗" : "?";
  const okLine = "PC " + mark(pc.active) + " · server " + (on ? "✓" : mark(sv.alive)) + " · " + up + "/" + bots.length + " bots";
  if (on) add("health", "🩺", "Systems", "PC off", "", n ? "FIX" : "SERVER", n ? "neg" : "old", probs || "server report · " + up + "/" + bots.length + " bots", n ? "bad" : "warn");
  else if (pcStale()) add("health", "🩺", "Systems", "PC quiet", "", "STALE", "old", "last report " + ago(ageMin(m.generated_at)), "warn");
  else add("health", "🩺", "Systems", n ? String(n) : "All up", n ? (n > 1 ? "problems" : "problem") : "", n ? "FIX" : "OK", n ? "neg" : "pos", probs || okLine, n ? "bad" : "");
  const DT = dateEvents(), d0 = DT[0], bday = d0 && dateIn(d0) === 0, dwk = DT.filter(e => dateIn(e) <= 7).length;      // v20
  const far = CAL && Array.isArray(CAL.birthdays);          // relay v7 sends 12 months; an older relay only 7 days
  add("dates", "🎂", "Birthdays", d0 ? dateDay(d0) : "None", "", bday ? "TODAY" : "", bday ? "old" : "",
      CAL && !CAL.ok ? "calendar can't be read" : d0 ? dateWho(d0) + (dateIn(d0) > 1 ? " · in " + dateIn(d0) + " days" : "") + (dwk > 1 ? " · +" + (dwk - 1) + " more this week" : "")
        : CAL && CAL.birthdays_error ? "birthdays can't be read"
        : far && CAL.birthdays_from && CAL.birthdays_from.contacts === false ? "Contacts birthdays not found"
        : far ? "none saved in the next 12 months" : CAL && CAL.more ? "calendar list cut short - may be missing some" : "none in the next 7 days", bday ? "warn" : "");
  const ideaWait = ideasUnsent().length;     // v23
  add("claude", "🤖", "Claude", pcStale() ? "PC off" : "PC on", "", ideaWait ? ideaWait + " TO SEND" : "", ideaWait ? "old" : "", "talk to Claude · save an idea", "");
  const vw = viewData();     // v24: one square per site
  VIEW_SITES.forEach(([s, name, icon]) => {
    const d = vw[s];
    add("views", icon, name, d ? nViews(obj(d.today).views) : "-", d ? "views today" : "", "", "", d ? nViews(obj(d.month).views) + " this month · " + nViews(obj(d.total).views) + " all time" : "no count yet", "");
  });
  if (ap().enabled) {
    const w = apWaiting(), ready = fx().enabled ? fxList().filter(f => f.status === "fix_ready").length : 0;
    add("approvals", "🗳️", "Approvals", String(w.length), "waiting", ready ? ready + " FIX READY" : w.length ? "YOUR CALL" : "", ready ? "pos" : w.length ? "old" : "",
        w.length ? w[0].id + " " + w[0].ask : "nothing waiting", w.length ? "warn" : "");
  }
  if (umHave()) {
    const U = um(), n = Number(U.waiting) || 0, late = Number(U.over_24h) || 0, it = umItems()[0], age = umAge(), old = age != null && age > UM_STALE_MIN;
    add("usemart", "🛒", "UseMart", String(n), "waiting", late ? late + " OVER 24 H" : old ? "OLD" : "", late ? "neg" : old ? "old" : "",
        old ? "last update " + ago(age) : it ? it.name + ": " + it.topic : "all answered", late ? "bad" : n || old ? "warn" : "");
  }
  add("bets", "📆", "Last 7 days", units(wk.units), "", wk.win_pct != null ? wk.win_pct + "%" : "", pill(wk.units), wk.record || "");
  add("bets", "⭐", "Top 5", t5.wins != null ? t5.wins + "-" + t5.losses + "-" + t5.pushes : "-", "", t5.units != null ? units(t5.units) : "", pill(t5.units), t5.since ? "since " + dayName(t5.since) : "");
  const pg = arr(obj(m.pages).pages).filter(p => p && typeof p === "object"), pend = pg.reduce((s, p) => s + (Number(p.pending) || 0), 0);
  const best = pg.filter(p => obj(p.today).record && p.today.record !== "0-0").sort((a, z) => Number(z.today.units || 0) - Number(a.today.units || 0))[0];
  add("pages", "📊", "Pages", String(pend), "pending", "", "", best ? "best today: " + String(best.page || "").replace(/_/g, " ") + " " + best.today.record : pg.length + " pages");
  const em = d.email || {}, dead = arr(em.inboxes).filter(i => i.status && i.status !== "ok").length;
  add("email", "📧", "Email", String(em.important_count ?? "-"), "important", dead ? dead + " INBOX OFF" : "", dead ? "old" : "",
      (em.recruiter_count || 0) + " recruiter" + (em.recruiter_count === 1 ? "" : "s") + " · " + (em.job_alerts || 0) + " job alerts");
  const adRows = [].concat(...arr((d.ads || {}).sections).filter(s => /^ADS/i.test(s.title)).map(s => arr(s.rows))), adBad = adRows.filter(r => r.state === "FAILED").length;
  add("ads", "📣", "Ads", adRows.length ? (adRows.length - adBad) + "/" + adRows.length : "-", "ran", adRows.length ? adBad ? adBad + " FAILED" : "ALL RAN" : "", adBad ? "neg" : "pos", "yesterday's posting");
  const bz = d.business || {}, fn = bz.funnel || {}, dc = obj(obj(bz.followers).discord).count, bk = arr(bz.books)[0];
  const sl = arr(obj(em.sales).rows).filter(r => r.date >= addDays(todayCT(), -2)).length;
  add("business", "📈", "Business", String(fn.whop_active ?? "-"), "Whop", sl ? sl + " NEW SALE" + (sl > 1 ? "S" : "") : "", sl ? "pos" : "",
      [dc != null ? "Discord " + dc : "", bk && bk.rank ? "book #" + Number(bk.rank).toLocaleString() : ""].filter(Boolean).join(" · "));
  const c = d.cmmg || {};
  add("cmmg", "🏢", "CMMG", c.company ? money(c.scott_share) : "-", "", "", "",       // always here: the sheet also holds the posted record
      c.company ? "your 50%" + (isYmd(c.last_reconciled) ? " · books " + dayName(c.last_reconciled) : "") : "posted record");
  const hl = m.hot_list || {}, first = arr(hl.top)[0];
  add("todo", "✅", "To-do", String(hl.open_total ?? "-"), "open", "", "", first ? String(first.title).replace(/^[^A-Za-z0-9]+/u, "").replace(/\s*\(you.*$/i, "") : "");
  add("hublooks", "✨", "New looks", HUB_LOOKS.filter(h => store.get(h[0] + ".look") === "tiles").length + " of " + HUB_LOOKS.length, "on", "", "", "in my other Hubs");
  return T;
}
const TL_FIXED = 6;      // Today, Games, Till payday, Next up, Systems, Birthdays
function renderTiles() {
  const g = $("#tiles");
  if (!g || !tilesOn()) return;
  try {       // a malformed row shows here; it never stops load() / the refresh behind it
    const u = loadJ(K_USE, {}), all = tileList(), fixed = all.slice(0, TL_FIXED);
    const rest = all.slice(TL_FIXED).map((t, i) => ({ t, i, n: useCount(u, t.open) }));
    if (rest.reduce((s, x) => s + x.n, 0) >= LEARN_AFTER) rest.sort((a, z) => z.n - a.n || a.i - z.i);
    g.innerHTML = fixed.concat(rest.map(x => x.t)).map(t =>
      `<div class="tl-t${t.alarm ? " " + t.alarm : ""}" data-open="${esc(t.open)}" role="button" tabindex="0">` +
      `<div class="tl-k"><span>${t.icon}</span>${esc(t.title)}</div>` +
      `<div class="tl-v">${esc(t.value)}${t.unit ? `<small>${esc(t.unit)}</small>` : ""}</div>` +
      (t.chip ? `<span class="tl-c ${esc(t.tone || "")}">${esc(t.chip)}</span>` : "") +
      (t.sub ? `<div class="tl-s">${esc(t.sub)}</div>` : "") + `</div>`).join("");
  } catch (e) { g.innerHTML = `<div class="tl-t warn">Tiles hit a snag: ${esc(e.message || e)} - Classic still has everything.</div>`; }
}
function setLook(look) {
  store.set(K_LOOK, look);
  learnEvent("view", { key: "look|" + look, open: "look" + look });     // relay v6: open must be a-z only, 12 max
  render();
  if (look === "tiles") loadWeather();
  window.scrollTo(0, 0);
}
async function savePlace(q) {
  PLACE_TYPED = q; PLACE_MSG = "Looking up " + q + "…"; PLACE_EDIT = true; renderTlHero();
  let P = null;
  try { P = await findPlace(q); } catch (e) { /* offline */ }
  if (!P) { PLACE_MSG = "Couldn't find \"" + q + "\" - try a 5-digit ZIP"; renderTlHero(); return; }     // the typed text stays to fix
  store.set(K_PLACE, JSON.stringify({ lat: Math.round(P.lat * 100) / 100, lon: Math.round(P.lon * 100) / 100, label: P.label }));
  PLACE_EDIT = false; PLACE_MSG = ""; PLACE_TYPED = null; WX = null;
  renderTlHero();
  await loadWeather(true);
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
  const sz = e.target.closest("[data-snooze]"), dn = e.target.closest("[data-done]"), uh = e.target.closest("[data-unhide]");
  if (sz || dn || uh) {     // v17: Not now / Done / Bring back - handled before the card's own tap
    const how = sz ? "snooze" : dn ? "done" : "unhide";
    hideCard((sz || dn || uh).dataset[sz ? "snooze" : dn ? "done" : "unhide"], how);
    renderNeeds();
    return;
  }
  const o = e.target.closest("[data-open]");
  if (o) {
    if (o.dataset.key) hideCard(o.dataset.key, "open");   // v17: opening a card says it matters
    recordUse(o.dataset.open);
    $("#sheet").dataset.key = o.dataset.open; openSheet(o.dataset.open); return;
  }
  const a = e.target.closest("[data-act]");
  if (a && a.dataset.act === "close") { $("#sheet").classList.add("hidden"); $("#sheet").dataset.key = ""; }
  if (a && a.dataset.act === "refresh") { $("#fresh").textContent = "refreshing…"; load(); }
  if (a && a.dataset.act === "update") applyUpdate();     // v21
  if (a && a.dataset.act === "hublook") {                 // v22
    const k = a.dataset.hub + ".look";
    store.set(k, store.get(k) === "tiles" ? "classic" : "tiles");
    openSheet("hublooks"); renderTiles();
  }
  if (a && a.dataset.act === "needs-more") { NEEDS_ALL = !NEEDS_ALL; renderNeeds(); }
  if (a && (a.dataset.act === "look-tiles" || a.dataset.act === "look-classic")) setLook(a.dataset.act.slice(5));    // v19
  if (a && a.dataset.act === "place-edit") { $("#sheet").classList.add("hidden"); $("#sheet").dataset.key = ""; PLACE_EDIT = true; PLACE_MSG = ""; PLACE_TYPED = null; renderTlHero(); }
  if (a && a.dataset.act === "place-cancel") {          // blur first: on iPhone the text box keeps focus and the redraw would wait
    if (document.activeElement) document.activeElement.blur();
    PLACE_EDIT = false; PLACE_MSG = ""; PLACE_TYPED = null; renderTlHero();
  }
  if (e.target.id === "sheet") { $("#sheet").classList.add("hidden"); $("#sheet").dataset.key = ""; }
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") $("#sheet").classList.add("hidden");
  if (e.key === "Enter" && e.target.dataset && (e.target.dataset.open || e.target.dataset.act)) e.target.click();
});
document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });
document.addEventListener("input", e => {           // v23: a half-typed idea survives a refresh or a closed app
  if (e.target.closest && e.target.closest("[data-ideaform]")) store.set(K_IDEADRAFT, e.target.value);
});
document.addEventListener("submit", e => {          // v23: the idea box
  const f = e.target.closest("[data-ideaform]");
  if (!f) return;
  e.preventDefault();
  if (saveIdea(f.elements.idea.value)) { openSheet("claude"); renderTiles(); }
});
document.addEventListener("submit", e => {          // v19: the town for weather
  const f = e.target.closest("[data-placeform]");
  if (!f) return;
  e.preventDefault();
  const q = String(f.elements.q.value || "").trim();
  if (document.activeElement) document.activeElement.blur();
  if (q) savePlace(q);
});

const LOOK_Q = new URLSearchParams(location.search).get("look");      // v19: ?look=tiles|classic from a link
if (LOOK_Q === "tiles" || LOOK_Q === "classic") { store.set(K_LOOK, LOOK_Q); history.replaceState(null, "", location.pathname + location.hash); }
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
