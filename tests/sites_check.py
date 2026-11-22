# sites_check.py - C:\MarvelApps\scotthub\tests\sites_check.py
# Scott Hub v42 check (Scott 11/22 via Desktop: "Yes, build it i want a few more graphs at top and the square devided by improtance nd
# group they blong in"). Serves Scott Hub on this PC, answers the relay with Desktop's REAL scott_hub_desktop.json (no relay call, no
# password), and checks: the Sites & services band (groups in Desktop's order, 3 sizes by importance, colours, trouble line), the top
# graphs (sites up, page speed, visitors by site), the sheet, a stale warning when the checks are old, nothing drawn without the key,
# both looks, no page errors. Screenshots -> tests\shots\v42_*.png.   Run:  python tests\sites_check.py
import copy, datetime, functools, http.server, json, socketserver, sys, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / "tests" / "shots"
SHOTS.mkdir(parents=True, exist_ok=True)
DESK = json.loads(Path(r"C:\MarvelDesktop\data\scott_hub_desktop.json").read_text(encoding="utf-8"))
ok, bad = [], []
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


def check(name, cond, extra=""):
    (ok if cond else bad).append(name)
    print(("PASS " if cond else "FAIL ") + name + (f"  ({extra})" if extra else ""), flush=True)


class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


Q.extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript"}
httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(Q, directory=str(ROOT)))
httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
APP = f"http://127.0.0.1:{httpd.server_address[1]}/index.html"
TRAFFIC = {"on": True, "totals": {"today": {"uniques": 41, "views": 90}, "yesterday": {"uniques": 37}, "live_now": 2,
           "days": [{"views": v} for v in (30, 44, 51, 38, 60, 72, 90)], "sites_down": []},
           "sites": [{"site": "usemart.net", "today": {"uniques": 22}}, {"site": "hubs", "today": {"uniques": 11}},
                     {"site": "marvelmagic", "today": {"uniques": 6}}, {"site": "photohub", "today": {"uniques": 2}}]}


def page_for(b, desk, look="classic"):
    ctx = b.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2, is_mobile=True, has_touch=True)
    ctx.add_init_script(f"localStorage.setItem('scotthub.k', 'test-pass'); localStorage.setItem('scotthub.look', '{look}');")
    body = json.dumps({"ok": True, "parts": {"desktop": {"data": desk, "at": datetime.datetime.now().isoformat()}, "masterhub": {"data": {}}}})
    ctx.route("https://script.google.com/**", lambda r: r.fulfill(status=200, content_type="application/json", body=body))
    ctx.route("https://usemart.net/api/traffic*", lambda r: r.fulfill(status=200, content_type="application/json", body=json.dumps(TRAFFIC)))
    ctx.route("https://usemart.net/api/visits*", lambda r: r.fulfill(status=200, content_type="application/json", body="{}"))
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(APP)
    pg.wait_for_timeout(2500)
    return ctx, pg, errs


fresh = copy.deepcopy(DESK)
fresh["sites"]["at"] = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
S = fresh["sites"]
n_all = sum(len(g["boxes"]) for g in S["groups"])
n_up = sum(1 for g in S["groups"] for b in g["boxes"] if b["s"] == "GREEN")
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx, pg, errs = page_for(b, fresh)
    head = pg.locator("#stBand .dc-head").inner_text() if pg.locator("#stBand .dc-head").count() else ""
    check("Sites & services band shows N of M up", f"{n_up} of {n_all} up" in head, head)
    titles = pg.evaluate("[...document.querySelectorAll('#stBand .st-gt b')].map(b => b.textContent)")
    check("groups in Desktop's order", titles == [g["title"] for g in S["groups"]], str(titles))
    boxes = pg.locator("#stBand .st-b").count()
    check("every site has a box", boxes == n_all, f"{boxes} of {n_all}")
    sizes = pg.evaluate("[1,2,3].map(i => document.querySelectorAll('#stBand .st-c' + i + ' .st-b').length)")
    want = [sum(1 for g in S["groups"] for x in g["boxes"] if x["i"] == i) for i in (1, 2, 3)]
    check("boxes split by importance (critical / important / good to know)", sizes == want, f"{sizes} vs {want}")
    h1 = pg.evaluate("document.querySelector('#stBand .st-c1 .st-b').getBoundingClientRect().height")
    h3 = pg.evaluate("document.querySelector('#stBand .st-c3 .st-b').getBoundingClientRect().height")
    w1 = pg.evaluate("document.querySelector('#stBand .st-c1 .st-b').getBoundingClientRect().width")
    w3 = pg.evaluate("document.querySelector('#stBand .st-c3 .st-b').getBoundingClientRect().width")
    check("critical boxes are bigger than good-to-know ones", h1 > h3 and w1 > w3 * 1.5, f"{w1:.0f}x{h1:.0f} vs {w3:.0f}x{h3:.0f}")
    amber = [x["n"] for g in S["groups"] for x in g["boxes"] if x["s"] == "AMBER"]
    if amber:
        check("an amber site is amber and named in the trouble line", pg.locator("#stBand .st-b.dc-amber").count() == len(amber)
              and all(a in pg.locator("#stBand .st-trouble").inner_text() for a in amber), str(amber))
    check("green boxes are green", pg.locator("#stBand .st-b.dc-green").count() == n_up)
    check("no stale warning on fresh checks", pg.locator("#stBand .st-stale").count() == 0)
    # top graphs
    cards = pg.evaluate("[...document.querySelectorAll('#gxBand .gx-c .gx-h b')].map(b => b.textContent)")
    check("top graphs: Sites up, Page speed, Visitors today", cards == ["Sites up", "Page speed", "Visitors today"], str(cards))
    check("Sites up card shows the count", f"{n_up} of {n_all}" in pg.locator("#gxBand .gx-wide .gx-h").inner_text())
    check("page speed draws one line per site", pg.locator("#gxBand polyline").count() == len([k for k, v in S["graphs"]["speed_ms"].items() if v]))
    check("page speed lists the latest ms", "UseMart" in pg.locator("#gxBand .gx-key").inner_text() and "ms" in pg.locator("#gxBand .gx-key").inner_text())
    check("visitors by site: UseMart first", pg.locator("#gxBand .gx-bar span").first.inner_text() == "UseMart")
    check("the traffic row is still on top", pg.locator("#trBand .tr-row").count() == 1)
    pg.screenshot(path=str(SHOTS / "v42_classic_top.png"))
    pg.locator("#stBand").screenshot(path=str(SHOTS / "v42_sites_band.png"))
    pg.locator("#stBand .dc-head").click()
    pg.wait_for_timeout(500)
    sheet = pg.locator("#sheetBody").inner_text()
    check("tap opens the Sites & services sheet with every group", "Sites" in pg.locator("#sheetTitle").inner_text() and all(g["title"].lower() in sheet.lower() for g in S["groups"]), pg.locator("#sheetTitle").inner_text())
    check("the sheet has the 24 h graphs", pg.locator("#sheetBody .gx-big").count() >= 1)
    pg.locator("#sheetBody").screenshot(path=str(SHOTS / "v42_sheet.png"))
    check("classic look: no page errors", not errs, str(errs[:3]))
    ctx.close()

    # tiles look
    ctx, pg, errs = page_for(b, fresh, "tiles")
    check("tiles look shows the band and the graphs too", pg.locator("#stBand .st-b").count() == n_all and pg.locator("#gxBand .gx-c").count() == 3)
    pg.screenshot(path=str(SHOTS / "v42_tiles_top.png"))
    check("tiles look: no page errors", not errs, str(errs[:3]))
    ctx.close()

    # stale checks + a red site
    stale = copy.deepcopy(fresh)
    stale["sites"]["at"] = (datetime.datetime.now() - datetime.timedelta(hours=3)).strftime("%Y-%m-%dT%H:%M:%S")
    stale["sites"]["groups"][0]["boxes"][0]["s"] = "RED"
    stale["sites"]["groups"][0]["boxes"][0]["l"] = "no answer twice"
    ctx, pg, errs = page_for(b, stale)
    check("old checks say so (the PC may be off)", pg.locator("#stBand .st-stale").count() == 1)
    check("a red site is red and listed as down", pg.locator("#stBand .st-b.dc-red").count() == 1 and "✗" in pg.locator("#stBand .st-trouble").inner_text())
    check("the Sites up card names the site that is down", "down:" in pg.locator("#gxBand .gx-wide").inner_text())
    ctx.close()

    # no sites key at all -> nothing drawn, nothing broken
    none = copy.deepcopy(fresh)
    none.pop("sites")
    ctx, pg, errs = page_for(b, none)
    check("no sites key -> no band", pg.locator("#stBand").inner_html().strip() == "")
    check("no sites key -> only the visitors graph", pg.locator("#gxBand .gx-c").count() == 1)
    check("no sites key: no page errors", not errs, str(errs[:3]))
    ctx.close()
    b.close()
print(f"\n{len(ok)} passed, {len(bad)} failed")
sys.exit(1 if bad else 0)
