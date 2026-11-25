"""
SAVE AS: test_dayhub_bridge.py   LOCATION: C:/MarvelApps/scotthub/tests/test_dayhub_bridge.py
v45 SCOTT HUB + DAY HUB WORK TOGETHER (Scott 11/24: "i would like them to work together"). A FAKE Claude list + a fake Day Hub save
(dayhub.v1) in the same browser: open one-time to-dos are offered (repeating + done ones are not), Send all puts each on the list ONCE
with its todoId, Claude finishing one ticks it in Day Hub (with the note, backup marked), a to-do ticked in Day Hub marks its job done.
RUN: python tests/test_dayhub_bridge.py   Exit 0 = all passed.
"""
import os, sys, json, threading, http.server, functools, time
from playwright.sync_api import sync_playwright
web = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OK = FAIL = 0
def check(name, cond, extra=""):
    global OK, FAIL
    OK, FAIL = (OK + 1, FAIL) if cond else (OK, FAIL + 1)
    print(("  PASS  " if cond else "  FAIL  ") + name + (f"  {extra}" if extra else ""))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 8769), functools.partial(Q, directory=web)); threading.Thread(target=srv.serve_forever, daemon=True).start()
now = int(time.time() * 1000); items = []; posts = []; patches = []
def api(route):
    r = route.request
    if r.method == "GET": return route.fulfill(status=200, content_type="application/json", body=json.dumps({"items": items, "rev": 1}))
    if r.method == "POST":
        b = json.loads(r.post_data or "{}"); posts.append(b)
        same = next((x for x in items if b.get("todoId") and x.get("todoId") == b["todoId"]), None)
        if same: return route.fulfill(status=200, content_type="application/json", body=json.dumps({"item": same, "duplicate": True}))
        it = {"id": "%08x" % (len(items) + 1), "title": b["title"], "notes": b.get("notes", ""), "todoId": b.get("todoId", ""), "by": "scott", "created": now, "status": "waiting", "reply": "", "doneAt": 0}
        items.append(it); return route.fulfill(status=200, content_type="application/json", body=json.dumps({"item": it}))
    if r.method == "PATCH":
        i = r.url.rsplit("/", 1)[1]; b = json.loads(r.post_data or "{}"); patches.append((i, b))
        for it in items:
            if it["id"] == i: it["status"] = b["status"]
        return route.fulfill(status=200, content_type="application/json", body=json.dumps({"item": next(x for x in items if x["id"] == i)}))
DH = {"todos": [{"id": "t1", "title": "Fix Pet Hub photo", "done": False, "rep": "none"},
                {"id": "t2", "title": "Call the bank", "done": False, "rep": "none"},
                {"id": "t3", "title": "Trash night", "done": False, "rep": "weekly"},
                {"id": "t4", "title": "Old done one", "done": True, "rep": "none", "doneDay": "2026-11-01"}],
      "sync": {"on": True, "dirty": False}}
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 390, "height": 844})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("window.__AIP_FAKE = { user: {email:'o@x.test'}, token: 'tok' }; window.AIP_URL = 'https://aip.test';")
    pg.route("https://aip.test/**", api)
    pg.goto("http://127.0.0.1:8769/index.html")
    pg.evaluate(f"localStorage.setItem('dayhub.v1', {json.dumps(json.dumps(DH))})")
    pg.reload(); pg.wait_for_timeout(1500)
    pg.evaluate("document.querySelector('#setup') && document.querySelector('#setup').remove(); document.querySelector('#sheet').dataset.key='claude'; openSheet('claude')")
    pg.wait_for_timeout(600)
    txt = pg.inner_text("#sheetBody")
    check("offers the 2 open one-time to-dos", "Your Day Hub to-dos (2)" in txt, txt[:0])
    check("repeating + done to-dos not offered", "Trash night" not in txt and "Old done one" not in txt)
    pg.click("summary[data-dhtoggle]"); pg.click("[data-dhall]"); pg.wait_for_timeout(1200)
    check("Send all = 2 jobs, each with its todoId", sorted(x.get("todoId") for x in posts) == ["t1", "t2"], str(posts))
    check("section says nothing new after sending", "nothing new to send" in pg.inner_text("#sheetBody"))
    check("rows say from Day Hub", pg.inner_text("#sheetBody").count("from Day Hub") == 2)
    items[0]["status"] = "done"; items[0]["reply"] = "Fixed in Pet Hub 1.9"; items[0]["doneAt"] = now
    pg.evaluate("aipPull()"); pg.wait_for_timeout(800)
    S = json.loads(pg.evaluate("localStorage.getItem('dayhub.v1')"))
    t1 = next(t for t in S["todos"] if t["id"] == "t1")
    check("Claude done -> ticked in Day Hub with the note", t1.get("done") is True and t1.get("aiReply") == "Fixed in Pet Hub 1.9" and t1.get("doneDay"), str(t1))
    check("Day Hub backup marked to run", S["sync"]["dirty"] is True)
    check("other Day Hub fields untouched", [t["title"] for t in S["todos"]] == ["Fix Pet Hub photo", "Call the bank", "Trash night", "Old done one"])
    S["todos"][1]["done"] = True; pg.evaluate(f"localStorage.setItem('dayhub.v1', {json.dumps(json.dumps(S))})")
    pg.evaluate("aipPull()"); pg.wait_for_timeout(800)
    check("ticked in Day Hub -> job done on the list", ("00000002", {"status": "done"}) in patches, str(patches))
    pg.click("[data-dhall]") if pg.locator("[data-dhall]").count() else None
    check("never sent twice", len(posts) == 2, str(len(posts)))
    pg.evaluate("localStorage.removeItem('dayhub.v1')"); pg.evaluate("openSheet('claude')")
    check("no Day Hub in this browser -> says so", "no Day Hub found" in pg.inner_text("#sheetBody"))
    check("no page errors", not errs, str(errs[:2]))
    b.close()
srv.shutdown()
print(f"\nDay Hub bridge: {OK} pass, {FAIL} fail"); sys.exit(1 if FAIL else 0)
