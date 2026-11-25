"""
SAVE AS: test_claude_list.py   LOCATION: C:/MarvelApps/scotthub/tests/test_claude_list.py
v43 CLAUDE'S LIST (Scott 11/24: "move my list to scott hub"): aiprojects.js against a FAKE copy of the list (the live list is never
touched). Signed out -> Sign in button; signed in -> rows + counts; add a job; two-tap Done; the front Claude tile counts; every call
carries the sign-in token; no page errors. RUN: python tests/test_claude_list.py (prints each check).
"""
import os, sys, json, threading, http.server, functools, time
from playwright.sync_api import sync_playwright
web = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); out = os.path.join(web, "tests", "shots")
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 8767), functools.partial(Q, directory=web)); threading.Thread(target=srv.serve_forever, daemon=True).start()
now = int(time.time()*1000)
items = [{"id":"aaaa0001","title":"Photo Hub closed test: send for review","notes":"","by":"claude","created":now-3600e3,"status":"waiting","reply":"","doneAt":0},
         {"id":"aaaa0002","title":"Day Hub: AI Projects list","notes":"","by":"claude","created":now-86400e3,"status":"done","reply":"Built: Day Hub 1.76. Live now.","doneAt":now-600e3}]
calls = []
def api(route):
    r = route.request; calls.append((r.method, r.url, r.headers.get("authorization")))
    if r.method == "OPTIONS": return route.fulfill(status=204)
    if r.method == "GET": return route.fulfill(status=200, content_type="application/json", body=json.dumps({"items": items, "rev": 1}))
    if r.method == "POST":
        b = json.loads(r.post_data or "{}"); it = {"id":"bbbb%04d" % len(items),"title":b["title"],"notes":b.get("notes",""),"by":"scott","created":now,"status":"waiting","reply":"","doneAt":0}
        items.append(it); return route.fulfill(status=200, content_type="application/json", body=json.dumps({"item": it, "rev": 2}))
    if r.method == "PATCH":
        i = r.url.rsplit("/",1)[1]; b = json.loads(r.post_data or "{}")
        for it in items:
            if it["id"] == i: it["status"] = b["status"]; it["doneAt"] = now if b["status"]=="done" else 0
        return route.fulfill(status=200, content_type="application/json", body=json.dumps({"item": {}, "rev": 3}))
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2)
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("window.__AIP_FAKE = { user: null, token: 'tok123' }; window.AIP_URL = 'https://aip.test';")
    pg.route("https://aip.test/**", api)
    pg.goto("http://127.0.0.1:8767/index.html"); pg.wait_for_timeout(1500)
    pg.evaluate("document.querySelector('#setup').remove(); document.querySelector('#sheet').dataset.key='claude'; openSheet('claude')"); pg.wait_for_timeout(500)
    print("signed-out has sign-in btn:", pg.is_visible("[data-aip=signin]"))
    pg.click("[data-aip=signin]"); pg.wait_for_timeout(800)
    print("rows after sign-in:", pg.locator(".aip-row").count(), "| sum:", pg.inner_text(".aip-sum"))
    pg.fill("[data-aipform] input[name=t]", "Fix the appraiser mic on iPhone"); pg.fill("[data-aipform] textarea", "test details")
    pg.click("[data-aipform] button"); pg.wait_for_timeout(800)
    print("rows after add:", pg.locator(".aip-row").count(), "| msg shown:", "On Claude's list" in pg.inner_text("#sheetBody"))
    btn = pg.locator("[data-aipdone=aaaa0001]"); btn.click(); pg.wait_for_timeout(200)
    print("first tap arms:", pg.inner_text("[data-aipdone=aaaa0001]"))
    pg.click("[data-aipdone=aaaa0001]"); pg.wait_for_timeout(800)
    print("sum after done:", pg.inner_text(".aip-sum"))
    pg.screenshot(path=f"{out}/sh_claude.png", full_page=False)
    pg.evaluate("document.querySelector('[data-act=close]').click()"); pg.wait_for_timeout(300)
    t = pg.locator(".tl-grid [data-open=claude], .tl-grid [data-key=claude]").first
    print("tile:", t.inner_text().replace("\n"," | ") if t.count() else "tile not found")
    print("auth header sent:", all(c[2] == "Bearer tok123" for c in calls if c[0] != "OPTIONS"), "| calls:", len(calls), "| errors:", errs[:3])
    pg.screenshot(path=f"{out}/sh_front.png")
    b.close()
srv.shutdown()
