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
 * Tasks (POST, body JSON):
 *   {task:"put",  key, part:"masterhub"|"desktop", data:{...}}   PC
 *   {task:"get",  pass}                                          phone
 *   {task:"ping", pass}                                          phone / setup check
 * Storage: each part as compact JSON split into <=8,000-char chunks
 * (Script Properties cap one value at ~9 KB), plus the time it arrived.
 * Only the newest copy of each part is kept.
 */
const PARTS = ["masterhub", "desktop"];
const CHUNK = 8000;
const MAX_PART = 60000;            // a part bigger than this is refused, not stored

function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const P = PropertiesService.getScriptProperties();
    const cfg = config(P);
    if (cfg.error) return out(cfg);

    if (req.task === "put") {
      if (!same(req.key, cfg.write)) return out({ error: "wrong write key" });
      if (PARTS.indexOf(req.part) < 0) return out({ error: "unknown part" });
      const s = JSON.stringify(req.data || {});
      if (s.length > MAX_PART) return out({ error: "part too big: " + s.length });
      const lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try { putPart(P, req.part, s); } finally { lock.releaseLock(); }
      return out({ ok: true, part: req.part, bytes: s.length });
    }

    if (!same(req.pass, cfg.read)) return out({ error: "wrong passphrase" });
    if (req.task === "ping") return out({ ok: true, app: "scotthub-relay" });
    if (req.task === "get") {
      const parts = {};
      PARTS.forEach(function (p) { parts[p] = getPart(P, p); });
      return out({ ok: true, now: new Date().toISOString(), parts: parts });
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
  try {
    const c = JSON.parse(raw);
    if (!c.write || !c.read) return { error: "SCOTT_HUB needs both write and read" };
    return c;
  } catch (err) {
    return { error: "SCOTT_HUB is not valid JSON - paste it again" };
  }
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

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
