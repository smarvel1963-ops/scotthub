/* SAVE AS: aiprojects.js · LOCATION: C:/MarvelApps/scotthub/aiprojects.js
 * v43 CLAUDE'S LIST (Scott 11/24: "should that list be from my person scott hub app?" -> "yes build it it and move my list to scott hub
 * that app shouls communicate with ai all the time"). Scott's private build list for Claude, MOVED here from Day Hub (Day Hub is a
 * product customers get, so it no longer carries it). Same cloud list as before - nothing was copied or lost:
 *   Cloudflare Worker hub-ai-projects (C:/MarvelApps/hubai/cloud). Only Scott's Google sign-in (Firebase project day-hub-510322,
 *   OWNER_EMAIL only) and Claude's PC key (C:/MarvelApps/hubai/tools/ai_projects.py) reach it.
 *   - Scott adds a project here (title + details). Claude reads it on the PC, marks it "being built", then ticks it done with a
 *     one-line note, which shows under it here. Scott can tick one done himself or take a waiting one off.
 *   - "All the time": the list re-reads every 2 minutes while Scott Hub is on screen and every time it comes back to the front.
 *     The Claude tile on the front screen shows waiting / being built / done today.
 * v45 WORKS WITH DAY HUB (Scott 11/24: "did you look at all the todo list items ... from day hub" -> "i would like them to work together"):
 *   Scott Hub and Day Hub share one web address, so on the same phone + browser Scott Hub reads Day Hub's own saved data (dayhub.v1).
 *   - "Your Day Hub to-dos": every open one-time to-do, each with 🤖 Send, plus Send all. One to-do = one job (the list never adds the
 *     same todoId twice).
 *   - When Claude finishes a job that came from a Day Hub to-do, the to-do is ticked in Day Hub too (the note is kept on it; Scott Hub shows it), and Day Hub's
 *     backup is marked to run on its next open. A to-do Scott ticks in Day Hub marks its job done on the list.
 *   - Repeating to-dos (meds, trash night) are never offered. Day Hub's code is not changed; only its saved to-dos are read/ticked.
 * Every value from the cloud is escaped where it's drawn (esc from app.js). Tests: window.__AIP_FAKE = { user, token } skips Google,
 * window.AIP_URL points elsewhere.
 */
"use strict";
const AIP_URL = () => window.AIP_URL || "https://hub-ai-projects.photohub-cloud.workers.dev";
const AIP_SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
const AIP_FB = { apiKey: "AIzaSyCnLXutctuOrDHc2fKuy6c0rdOmUR62e7Y", authDomain: "day-hub-510322.firebaseapp.com", projectId: "day-hub-510322",
  appId: "1:750311262064:web:d3119089f8c4249f77f1b5" };   // public IDs (the same ones Day Hub / Family Hub use)
const AIP_EVERY = 2 * 60000, K_AIP = "scotthub.aip";      // last good list kept on this phone, so no signal still shows it
const AIP = { items: [], loaded: false, err: "", msg: "", user: null, ready: false, busy: false, at: 0 };
let AIP_AUTH = null;
try { const c = JSON.parse(localStorage.getItem(K_AIP) || "null"); if (c && Array.isArray(c.items)) { AIP.items = c.items; AIP.at = c.at || 0; } } catch (e) { /* private mode */ }

// ---------------------------------------------------------------- sign-in (Google, once per phone)
async function aipAuth() {
  if (window.__AIP_FAKE) return null;
  if (AIP_AUTH) return AIP_AUTH;
  const load = src => new Promise((ok, no) => { const s = document.createElement("script"); s.src = AIP_SDK + src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  if (!window.firebase || !firebase.auth) { await load("firebase-app-compat.js"); await load("firebase-auth-compat.js"); }
  const app = firebase.apps.find(a => a.name === "aiprojects") || firebase.initializeApp(AIP_FB, "aiprojects");
  const auth = app.auth();
  try { await auth.getRedirectResult(); } catch (e) { /* no redirect pending */ }
  await new Promise(ok => { const u = auth.onAuthStateChanged(() => { u(); ok(); }); });
  AIP_AUTH = auth;
  return auth;
}
async function aipUser() {
  if (window.__AIP_FAKE) return window.__AIP_FAKE.user || null;
  const a = await aipAuth();
  const u = a.currentUser;
  return u && !u.isAnonymous ? { email: u.email, name: u.displayName || "" } : null;
}
async function aipToken() {
  if (window.__AIP_FAKE) return window.__AIP_FAKE.user ? window.__AIP_FAKE.token : "";
  const a = await aipAuth();
  return a.currentUser ? a.currentUser.getIdToken() : "";
}
async function aipSignIn() {
  try {
    if (window.__AIP_FAKE) window.__AIP_FAKE.user = window.__AIP_FAKE.signInAs || { email: "owner@example.com" };
    else {
      const a = await aipAuth(), p = new firebase.auth.GoogleAuthProvider();
      try { await a.signInWithPopup(p); }
      catch (e) { if (e && /popup/i.test(e.code || "")) { await a.signInWithRedirect(p); return; } throw e; }   // an installed app may block pop-ups
    }
    await aipPull();
  } catch (e) { AIP.msg = "Sign-in didn't finish - try again"; aipRedraw(); }
}

// ---------------------------------------------------------------- the cloud list
async function aipCall(method, path, body) {
  const tok = await aipToken();
  if (!tok) throw new Error("Sign in first");
  const r = await fetch(AIP_URL() + path, { method, headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Claude's list answered ${r.status}`);
  return j;
}
async function aipPull() {
  if (AIP.busy) return;
  AIP.busy = true;
  try {
    AIP.user = await aipUser();
    AIP.ready = true;
    if (!AIP.user) { AIP.loaded = false; return; }
    const j = await aipCall("GET", "/v1/projects");
    AIP.items = Array.isArray(j.items) ? j.items : [];
    AIP.loaded = true; AIP.err = ""; AIP.at = Date.now();
    try { localStorage.setItem(K_AIP, JSON.stringify({ items: AIP.items, at: AIP.at })); } catch (e) { /* full */ }
    await dhSync();
  } catch (e) {
    AIP.ready = true;
    AIP.err = (e && e.message) || String(e);
  } finally {
    AIP.busy = false;
    aipRedraw();
  }
}

// ---------------------------------------------------------------- v45 Day Hub bridge (same phone, same browser)
const DH_KEY = "dayhub.v1";
const dhDay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };   // Day Hub's own "today" (local)
function dhRead() { try { const raw = localStorage.getItem(DH_KEY); if (!raw) return null; const S = JSON.parse(raw); return S && Array.isArray(S.todos) ? S : null; } catch (e) { return null; } }
function dhWrite(S) { try { S.updatedAt = new Date().toISOString(); if (S.sync && S.sync.on) S.sync.dirty = true; localStorage.setItem(DH_KEY, JSON.stringify(S)); return true; } catch (e) { return false; } }
const dhRep = t => t.rep && t.rep !== "none";
/** Open one-time Day Hub to-dos not on Claude's list yet. null = no Day Hub in this browser. */
function dhOpen() {
  const S = dhRead(); if (!S) return null;
  const on = new Set(AIP.items.map(x => x.todoId).filter(Boolean));
  return S.todos.filter(t => t && t.id && t.title && !dhRep(t) && !t.done && !on.has(t.id));
}
/** Claude done -> tick the Day Hub to-do (+ note). Scott ticked it in Day Hub -> the job is done on the list. */
async function dhSync() {
  const S = dhRead(); if (!S) return;
  let changed = false;
  for (const it of AIP.items) {
    if (!it.todoId) continue;
    const t = S.todos.find(x => x && x.id === it.todoId); if (!t || dhRep(t)) continue;
    if (t.aiId !== it.id) { t.aiId = it.id; changed = true; }
    if ((it.reply || "") !== (t.aiReply || "")) { t.aiReply = it.reply || ""; changed = true; }
    if (it.status === "done" && !t.done) { t.done = true; t.doneDay = dhDay(); changed = true; }
    else if (t.done && (it.status === "waiting" || it.status === "working")) {
      try { const r = await aipCall("PATCH", `/v1/projects/${it.id}`, { status: "done" }); Object.assign(it, r.item || {}); } catch (e) { /* next time */ }
    }
  }
  if (changed) dhWrite(S);
}
async function dhSend(ids) {
  const S = dhRead(); if (!S) return 0;
  let n = 0;
  for (const id of ids) {
    const t = S.todos.find(x => x && x.id === id); if (!t) continue;
    try { await aipCall("POST", "/v1/projects", { title: String(t.title).slice(0, 200), notes: "From Day Hub", todoId: t.id }); n++; } catch (e) { AIP.msg = (e && e.message) || "Couldn't reach Claude's list"; break; }
  }
  return n;
}
function dhSection() {
  const open = dhOpen();
  if (open === null) return `<p class="note">📥 Day Hub to-dos: no Day Hub found in this browser on this phone. Open Day Hub once in this same browser and its to-dos show here.</p>`;
  if (!open.length) return `<p class="note">📥 Day Hub to-dos: nothing new to send - every open one-time to-do is already on the list.</p>`;
  return `<details class="dh-box"${AIP.dhOpen ? " open" : ""}><summary data-dhtoggle="1">📥 Your Day Hub to-dos (${open.length}) - send to Claude</summary>
    <button class="pay" data-dhall="1">🤖 Send all ${open.length}</button>
    <ul class="aip-list">${open.slice(0, 60).map(t => `<li class="aip-row"><span class="aip-main"><b>${esc(t.title)}</b></span><span class="aip-acts"><button class="chip" data-dhsend="${esc(t.id)}">🤖 Send</button></span></li>`).join("")}</ul>
    <p class="note">When Claude finishes one, it's ticked in Day Hub too. Claude's note shows here.</p></details>`;
}

// ---------------------------------------------------------------- counts (front-screen tile)
const aipDay = ms => new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
function aipCounts() {
  const it = AIP.items, td = aipDay(Date.now());
  return { waiting: it.filter(x => x.status === "waiting").length, working: it.filter(x => x.status === "working").length,
    doneToday: it.filter(x => x.status === "done" && x.doneAt && aipDay(x.doneAt) === td).length, any: it.length > 0 };
}

// ---------------------------------------------------------------- drawing (the Claude sheet)
const aipWhen = ms => ms ? new Date(ms).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" }) : "";
function aipRow(x) {
  const mark = x.status === "done" ? "✅" : x.status === "working" ? "🛠️" : "⬜";
  const from = x.todoId ? "from Day Hub" : x.by === "claude" ? "added by Claude" : "from you";
  const acts = x.status === "waiting" || x.status === "working"
    ? `<span class="aip-acts"><button class="chip" data-aipdone="${esc(x.id)}">✓ Done</button>${x.status === "waiting" ? ` <button class="chip" data-aipdrop="${esc(x.id)}" aria-label="Take it off the list">✕</button>` : ""}</span>` : "";
  return `<li class="aip-row ${esc(x.status)}"><span class="aip-mark" aria-hidden="true">${mark}</span><span class="aip-main"><b>${esc(x.title)}</b>
    <small>${esc(from)} · ${esc(aipWhen(x.created))}${x.status === "done" && x.doneAt ? " · done " + esc(aipWhen(x.doneAt)) : ""}</small>
    ${x.notes ? `<small class="aip-notes">${esc(x.notes)}</small>` : ""}
    ${x.reply ? `<span class="aip-reply">🤖 ${esc(x.reply)}</span>` : ""}${acts}</span></li>`;
}
function aipSection() {
  let h = `<div class="sec">📋 Claude's list</div>`;
  if (!AIP.ready) { aipPull(); return h + `<p class="note">Opening your list…</p>`; }
  if (!AIP.user) return h + `<p class="note">Anything you add here goes on Claude's build list. Claude marks it being built, then ticks it done with a note, and you see it here.</p>
    <p class="note">Sign in with Google once on this phone so the list knows it's you. Only you and Claude can see it.</p>
    ${AIP.msg ? `<p class="note warn">${esc(AIP.msg)}</p>` : ""}<button class="pay" data-aip="signin">Sign in with Google</button>`;
  const it = AIP.items, c = aipCounts();
  const working = it.filter(x => x.status === "working"), waiting = it.filter(x => x.status === "waiting");
  const done = it.filter(x => x.status === "done").sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0)).slice(0, 30);
  h += `<p class="aip-sum"><b>${c.waiting}</b> waiting · <b>${c.working}</b> being built · <b>${c.doneToday}</b> done today</p>`;
  if (AIP.err) h += `<p class="note warn">${esc(AIP.err)}${AIP.at ? " - showing the list from " + esc(aipWhen(AIP.at)) : ""}</p>`;
  if (AIP.msg) h += `<p class="note">${esc(AIP.msg)}</p>`;
  h += `<form class="aip-new" data-aipform="1"><input name="t" placeholder="New job for Claude" maxlength="200" autocomplete="off" required aria-label="New job for Claude">
    <textarea name="n" rows="2" maxlength="2000" placeholder="Details (optional)" aria-label="Details"></textarea><button class="pay" type="submit">＋ Add for Claude</button></form>` + dhSection();
  if (working.length) h += `<h4 class="aip-h">Being built</h4><ul class="aip-list">${working.map(aipRow).join("")}</ul>`;
  if (waiting.length) h += `<h4 class="aip-h">Waiting for Claude</h4><ul class="aip-list">${waiting.map(aipRow).join("")}</ul>`;
  if (done.length) h += `<h4 class="aip-h">Done</h4><ul class="aip-list">${done.map(aipRow).join("")}</ul>`;
  if (!it.length) h += `<p class="note">Nothing on the list yet. Add one above.</p>`;
  return h + `<p class="note">Checks every 2 minutes while Scott Hub is open${AIP.at ? " · updated " + esc(aipWhen(AIP.at)) : ""} · <button class="chip" data-aip="refresh">Refresh</button></p>`;
}
function aipRedraw() {
  const s = document.querySelector("#sheet");
  if (s && s.dataset.key === "claude" && !s.classList.contains("hidden") && typeof openSheet === "function") {
    const ae = document.activeElement, typing = ae && ae.closest && ae.closest("[data-aipform]");
    if (!typing) openSheet("claude");     // never wipe a half-typed job
  }
  if (typeof renderTiles === "function") renderTiles();
}

// ---------------------------------------------------------------- taps
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-aip],[data-aipdone],[data-aipdrop]");
  if (!b) return;
  AIP.msg = "";
  if (b.dataset.aip === "signin") { aipSignIn(); return; }
  if (b.dataset.aip === "refresh") { aipPull(); return; }
  const id = b.dataset.aipdone || b.dataset.aipdrop;
  if (b.dataset.armed !== "1") { b.dataset.armed = "1"; b.textContent = b.dataset.aipdone ? "Tap again" : "Remove?"; b.classList.add("armed"); return; }   // two taps, like Approvals
  b.disabled = true;
  try { await aipCall("PATCH", `/v1/projects/${id}`, { status: b.dataset.aipdone ? "done" : "dropped" }); await aipPull(); }
  catch (er) { AIP.msg = "Couldn't reach Claude's list - try again"; aipRedraw(); }
});
document.addEventListener("click", async e => {     // v45 Day Hub to-dos
  const b = e.target.closest("[data-dhsend],[data-dhall],[data-dhtoggle]");
  if (!b) return;
  if (b.dataset.dhtoggle) { AIP.dhOpen = !AIP.dhOpen; return; }
  AIP.msg = ""; b.disabled = true;
  const ids = b.dataset.dhall ? (dhOpen() || []).map(t => t.id) : [b.dataset.dhsend];
  const n = await dhSend(ids);
  if (n) AIP.msg = `🤖 ${n} Day Hub to-do${n === 1 ? "" : "s"} on Claude's list ✓`;
  await aipPull();
});
document.addEventListener("submit", async e => {
  const f = e.target.closest("[data-aipform]");
  if (!f) return;
  e.preventDefault();
  const t = f.t.value.trim(), n = f.n.value.trim();
  if (!t) return;
  const btn = f.querySelector("button"); btn.disabled = true;
  try {
    const r = await aipCall("POST", "/v1/projects", { title: t, notes: n });
    AIP.items.push(r.item); AIP.msg = "🤖 On Claude's list ✓";
    f.reset(); if (document.activeElement) document.activeElement.blur();
    await aipPull();
  } catch (er) { AIP.msg = (er && er.message) || "Couldn't reach Claude's list"; btn.disabled = false; aipRedraw(); }
});

// ---------------------------------------------------------------- keep up, all the time
setInterval(() => { if (document.visibilityState === "visible") aipPull(); }, AIP_EVERY);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") aipPull(); });
aipPull();
