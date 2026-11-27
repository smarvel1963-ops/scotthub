/* SAVE AS: relay_usemart_watch_check.js · LOCATION: C:/MarvelApps/scotthub/tests/relay_usemart_watch_check.js
 * Relay v11 USEMART SITE WATCH (Scott 11/26: "Yes, set it up" - a phone alert when usemart.net is down 10+ minutes,
 * "should be one of watchers on Scott Hub"). Runs relay/Code.gs in Node with FAKE Google services (properties, mail,
 * a fake clock, fake usemart.net answers) - nothing real is called, no email is sent.
 * RUN: node tests/relay_usemart_watch_check.js    Exit 0 = all passed.
 */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const SRC = fs.readFileSync(path.join(__dirname, "..", "relay", "Code.gs"), "utf8");
let OK = 0, FAIL = 0;
function check(name, cond, extra) {
  if (cond) OK++; else FAIL++;
  console.log((cond ? "  PASS  " : "  FAIL  ") + name + (extra ? "  (" + extra + ")" : ""));
}

function world(opts) {
  opts = opts || {};
  let now = Date.parse("2026-11-27T03:00:00Z");
  const store = {}, mails = [], logs = [];
  let answers = { health: [200, '{"ok":true,"build":"2026-11-25b"}'], traffic: [200, '{"item_views":{}}'] };
  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...a) { super(...(a.length ? a : [now])); }
    static now() { return now; }
  }
  const P = {
    getProperty: k => (k in store ? store[k] : null),
    setProperty: (k, v) => { if (opts.throwOn && opts.throwOn === k) throw new Error("store refused " + k); store[k] = String(v); },
    deleteProperty: k => { delete store[k]; },
    getProperties: () => Object.assign({}, store),
  };
  const ctx = {
    Date: FakeDate, JSON, Math, Number, String, Array, Object, Error,
    PropertiesService: { getScriptProperties: () => P },
    UrlFetchApp: {
      fetch: (url) => {
        const a = /\/api\/traffic/.test(url) ? answers.traffic : answers.health;
        if (a === "throw") throw new Error("Address unavailable: " + url);
        return { getResponseCode: () => a[0], getContentText: () => a[1] };
      },
    },
    MailApp: { sendEmail: (to, subject, body) => mails.push({ to, subject, body }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => "owner@example.test" }) },
    Logger: { log: s => logs.push(s) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => ({ timeBased: () => ({ everyMinutes: () => ({ create() {} }) }) }) },
    ContentService: { createTextOutput: s => ({ setMimeType() { return this; }, s }), MimeType: { JSON: "json" } },
    CalendarApp: { getAllCalendars: () => [], getCalendarById: () => null },
    CacheService: { getScriptCache: () => ({ get: () => null, put() {} }) },
    Utilities: { formatDate: (d, tz) => {     // enough of Apps Script's formatDate for "h:mm a EEE MMM d"
      const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", weekday: "short", month: "short", day: "numeric" });
      const o = Object.fromEntries(f.formatToParts(d).map(x => [x.type, x.value]));
      return `${o.hour}:${o.minute} ${o.dayPeriod} ${o.weekday} ${o.month} ${o.day}`;
    } },
  };
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  return {
    ctx, store, mails, logs, P,
    at(min) { now = Date.parse("2026-11-27T03:00:00Z") + min * 60000; },
    answer(health, traffic) { answers = { health, traffic: traffic || [200, "{}"] }; },
    run() { return vm.runInContext("checkServer()", ctx); },
    info() { return JSON.parse(JSON.stringify(vm.runInContext("watchInfo(PropertiesService.getScriptProperties())", ctx))); },
  };
}

// 1. healthy site: up, no mail, info says up
{
  const w = world();
  w.at(0); w.run();
  const i = w.info().usemart;
  check("healthy site: no email", w.mails.length === 0, JSON.stringify(w.mails));
  check("healthy site: watch info up, code 200, checked now", i.state === "up" && i.code === 200 && i.checked_at === "2026-11-27T03:00:00.000Z", JSON.stringify(i));
  check("server watch still runs (server state logged next to usemart)", w.logs.length === 1 && /"server"/.test(w.logs[0]) && /"usemart"/.test(w.logs[0]), w.logs[0]);
}

// 2. 502 outage like 11/25: one bad check = no mail; still bad 10 min later = ONE down email; stays down = no more; back = one back email
{
  const w = world();
  w.answer([502, "error code: 502"]);
  w.at(0); w.run();
  check("first bad check: no email yet (a blip never mails)", w.mails.length === 0);
  check("first bad check: still shows up", w.info().usemart.state === "up");
  w.at(10); w.run();
  check("bad again 10 min later: one DOWN email", w.mails.length === 1 && /usemart\.net is DOWN/.test(w.mails[0].subject), JSON.stringify(w.mails.map(m => m.subject)));
  check("down email says 502 + what to do + the address", /502/.test(w.mails[0].body) && /UseMart Claude window/.test(w.mails[0].body) && /93\.127\.143\.55:1097/.test(w.mails[0].body), w.mails[0].body);
  check("down email goes to the script's own Gmail", w.mails[0].to === "owner@example.test");
  check("down email shows Central time, not computer time", /since 9:00 PM Thu Nov 26 CT/.test(w.mails[0].body) && !/T03:00/.test(w.mails[0].body), w.mails[0].body.split("\n")[2]);
  const i = w.info().usemart;
  check("watch info: down since the FIRST bad check", i.state === "down" && i.since === "2026-11-27T03:00:00.000Z" && i.code === 502 && /502/.test(i.why), JSON.stringify(i));
  w.at(20); w.run(); w.at(30); w.run();
  check("still down: no more emails", w.mails.length === 1);
  w.answer([200, '{"ok":true,"build":"2026-11-27a"}']);
  w.at(40); w.run();
  check("back: one BACK email with minutes down + build", w.mails.length === 2 && /usemart\.net is back/.test(w.mails[1].subject) && /40 min/.test(w.mails[1].body) && /2026-11-27a/.test(w.mails[1].body), w.mails[1] && w.mails[1].body);
  check("back: watch info up, why cleared", w.info().usemart.state === "up" && w.info().usemart.why === null);
  w.at(50); w.run();
  check("stays up: no more emails", w.mails.length === 2);
}

// 3. two bad checks a minute apart (a hand run right after the trigger) = no email
{
  const w = world();
  w.answer([502, "x"]);
  w.at(0); w.run(); w.at(1); w.run();
  check("two bad checks 1 min apart: no email", w.mails.length === 0);
  w.at(9); w.run();
  check("still bad 9 min after the first: email", w.mails.length === 1);
}

// 4. bad, then good, then bad = the clock starts again (no email off two separate blips)
{
  const w = world();
  w.answer([502, "x"]); w.at(0); w.run();
  w.answer([200, '{"ok":true}']); w.at(10); w.run();
  w.answer([502, "x"]); w.at(20); w.run();
  check("blip, good, blip: no email", w.mails.length === 0);
  w.at(30); w.run();
  check("then bad on the next check too: email", w.mails.length === 1);
}

// 5. site answers but the database doesn't (like Postgres stopped while the program stayed up)
{
  const w = world();
  w.answer([200, '{"ok":true,"build":"b"}'], [500, '{"error":"db"}']);
  w.at(0); w.run(); w.at(10); w.run();
  check("database not answering: DOWN email naming the database", w.mails.length === 1 && /database/.test(w.mails[0].body), w.mails[0] && w.mails[0].body);
  check("database down: code 500 in watch info", w.info().usemart.code === 500);
}

// 6. a 404 from /api/traffic is not a database outage (route changed): stays up
{
  const w = world();
  w.answer([200, '{"ok":true}'], [404, "nope"]);
  w.at(0); w.run(); w.at(10); w.run();
  check("traffic 404 alone: no email", w.mails.length === 0 && w.info().usemart.state === "up");
}

// 7. no answer at all (DNS / connection error): counts as down
{
  const w = world();
  w.answer("throw");
  w.at(0); w.run(); w.at(10); w.run();
  check("no answer at all: DOWN email 'did not answer'", w.mails.length === 1 && /did not answer/.test(w.mails[0].body), w.mails[0] && w.mails[0].body);
}

// 8. Cloudflare page instead of JSON with a 200 (or health without ok) = bad
{
  const w = world();
  w.answer([200, "<html>Just a moment...</html>"]);
  w.at(0); w.run(); w.at(10); w.run();
  check("200 but not the health answer: DOWN", w.mails.length === 1);
}

// 9. 403 / 429 = can't check: never a strike, never 'up' claims, note shown; a real outage after it still mails
{
  const w = world();
  w.answer([403, "blocked"]);
  w.at(0); w.run(); w.at(10); w.run(); w.at(20); w.run();
  const i = w.info().usemart;
  check("403: no email", w.mails.length === 0);
  check("403: note says it can't check, code 403", /can't tell/.test(i.note || "") && i.code === 403, JSON.stringify(i));
  w.answer([200, '{"ok":true}']); w.at(30); w.run();
  check("a good answer clears the note", w.info().usemart.note === null);
  w.answer([429, "slow down"]); w.at(40); w.run();
  w.answer([502, "x"]); w.at(50); w.run();
  check("429 in between is not a strike (only one bad so far): no email", w.mails.length === 0);
  w.at(60); w.run();
  check("then bad again: email", w.mails.length === 1);
}

// 10. the UseMart check blowing up never stops the server watch
{
  const w = world({ throwOn: "um_checked_at" });
  let threw = false;
  try { w.run(); } catch (e) { threw = true; }
  check("UseMart check error: checkServer does not throw", !threw);
  check("UseMart check error: the server watch still ran (watch_checked_at set)", !!w.store.watch_checked_at);
  check("UseMart check error: note says the watch failed", /watch itself failed/.test(w.store.um_note || ""), w.store.um_note);
}

// 11. "get" carries parts.watch.usemart (the phone reads it there)
{
  const w = world();
  w.store.SCOTT_HUB = JSON.stringify({ write: "w-key-123", read: "r-pass-456" });
  w.at(0); w.run();
  const res = vm.runInContext("doPost({ postData: { contents: JSON.stringify({ task: 'get', pass: 'r-pass-456' }) } })", w.ctx);
  const j = JSON.parse(res.s);
  check("get: parts.watch.usemart present", j.ok && j.parts && j.parts.watch && j.parts.watch.usemart && j.parts.watch.usemart.state === "up", res.s.slice(0, 200));
  check("get: the old server watch fields are unchanged", j.parts.watch.state === "up" && "checked_at" in j.parts.watch && "since" in j.parts.watch);
}

// 12. the server watch itself is unchanged: nothing ever reported = not down, no email
{
  const w = world();
  w.at(0); w.run(); w.at(10); w.run();
  check("server watch with no reports: no server email", !w.mails.some(m => /CMMG server/.test(m.subject)));
}

console.log(`\n${OK} passed, ${FAIL} failed`);
process.exit(FAIL ? 1 : 0);
