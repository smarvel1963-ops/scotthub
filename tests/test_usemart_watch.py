"""
SAVE AS: test_usemart_watch.py   LOCATION: C:/MarvelApps/scotthub/tests/test_usemart_watch.py
v48 USEMART.NET WATCH (Scott 11/26: "Yes, set it up" - a phone alert when usemart.net is down 10+ min - "should be one of watchers on
Scott Hub"). FAKE relay data only (no relay call, no pass): relay v11's parts.watch.usemart shows on the Server sheet ("usemart.net
alert": on / site DOWN / can't check / not on yet), a down site puts a red card in What needs you, turns the UseMart tile red SITE DOWN,
and the tile's What's wrong list leads to the lit alert row. An old relay (no usemart field) and an old check (40 min) show "not on yet".
RUN: python tests/test_usemart_watch.py   Exit 0 = all passed.
"""
import datetime, functools, http.server, json, socketserver, sys, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass
OK = FAIL = 0


def check(name, cond, extra=""):
    global OK, FAIL
    OK, FAIL = (OK + 1, FAIL) if cond else (OK, FAIL + 1)
    print(("  PASS  " if cond else "  FAIL  ") + name + (f"  ({extra})" if extra else ""), flush=True)


class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


Q.extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript"}
httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(Q, directory=str(ROOT)))
httpd.daemon_threads = True
threading.Thread(target=httpd.serve_forever, daemon=True).start()
APP = f"http://127.0.0.1:{httpd.server_address[1]}/index.html"

now = datetime.datetime.now(datetime.timezone.utc)
iso = lambda d: d.strftime("%Y-%m-%dT%H:%M:%S.000Z")
ago = lambda m: iso(now - datetime.timedelta(minutes=m))

MH = {"generated_at": iso(now), "bets": {"today": {"record": "1-0", "units": 1}, "week": {}, "top5": {}, "slate": []},
      "health": {"pc": {"active": True, "heartbeat_age_min": 1}, "server": {"alive": True, "heartbeat_age_min": 2, "bots": {"athena_bot": True}}, "alerts": []}}
DK = {"generated_at": iso(now), "email": {"important_count": 0, "inboxes": [{"inbox": "home box", "status": "ok", "unread": 0, "provider": "gmail"}]}}
UM = {"waiting": 0, "over_24h": 0, "newest": []}
SERVER_WATCH = {"state": "up", "since": None, "why": None, "checked_at": ago(3)}
WHY = "usemart.net answers 502: nothing is running behind Cloudflare (the UseMart program or its database stopped)"


def page_for(b, usemart_watch, look="tiles"):
    ctx = b.new_context(viewport={"width": 412, "height": 915}, is_mobile=True, has_touch=True)
    ctx.add_init_script("localStorage.setItem('scotthub.k', 'test-pass'); localStorage.setItem('scotthub.look', '" + look + "');")
    watch = dict(SERVER_WATCH)
    if usemart_watch is not None:
        watch["usemart"] = usemart_watch
    parts = {"masterhub": {"data": MH}, "desktop": {"data": DK}, "usemart": {"data": UM, "received_at": ago(1)}, "watch": watch}
    body = json.dumps({"ok": True, "parts": parts, "calendar": {"ok": True, "events": []}, "decisions": []})
    ctx.route("https://script.google.com/**", lambda r: r.fulfill(status=200, content_type="application/json", body=body))
    ctx.route("https://usemart.net/**", lambda r: r.fulfill(status=200, content_type="application/json", body="{}"))
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(APP)
    pg.wait_for_timeout(2000)
    return ctx, pg, errs


def server_sheet(pg):
    pg.evaluate("openSheet('server')")
    pg.wait_for_timeout(250)
    return pg.inner_text("#sheetBody")


def alert_row(pg):
    return pg.evaluate("(() => { const r = [...document.querySelectorAll('#sheetBody .row')].find(x => x.textContent.includes('usemart.net alert')); return r ? r.innerText.replace(/\\n/g, ' | ') : ''; })()")


def needs(pg):
    return pg.inner_text("#needs")


def um_tile(pg):
    return pg.locator("#tiles .tl-t[data-open=usemart]").first


with sync_playwright() as p:
    b = p.chromium.launch()

    # 1. an old relay (no usemart field): "not on yet", no red card, tile normal
    ctx, pg, errs = page_for(b, None)
    t = um_tile(pg).inner_text()
    check("old relay: UseMart tile has no SITE DOWN", "SITE DOWN" not in t, t.replace("\n", " | "))
    check("old relay: no 'usemart.net is DOWN' card", "usemart.net is DOWN" not in needs(pg))
    server_sheet(pg)
    check("old relay: Server sheet says the usemart.net alert is not on yet", "not on yet" in alert_row(pg), alert_row(pg))
    check("old relay: no page errors", not errs, "; ".join(errs))
    ctx.close()

    # 2. watch running, site up
    ctx, pg, errs = page_for(b, {"state": "up", "since": None, "why": None, "checked_at": ago(4), "code": 200, "note": None})
    server_sheet(pg)
    r = alert_row(pg)
    check("site up: alert row says on, last check, emails your Gmail", " on" in (" " + r) and "emails your Gmail" in r and "checked" in r, r)
    check("site up: the Server sheet has its own 'Alert if usemart.net goes down' section",
          "Alert if usemart.net goes down" in pg.evaluate("[...document.querySelectorAll('#sheetBody .sec')].map(s => s.textContent).join('|')"))
    check("site up: no page errors", not errs, "; ".join(errs))
    ctx.close()

    # 3. site DOWN for 40 min
    ctx, pg, errs = page_for(b, {"state": "down", "since": ago(40), "why": WHY, "checked_at": ago(2), "code": 502, "note": None})
    n = needs(pg)
    check("site down: red card in What needs you", "usemart.net is DOWN" in n and "502" in n, n[:300].replace("\n", " | "))
    tl = um_tile(pg)
    check("site down: UseMart tile shows SITE DOWN", "SITE DOWN" in tl.inner_text(), tl.inner_text().replace("\n", " | "))
    check("site down: UseMart tile marked as having an issue", tl.get_attribute("data-issue") == "1", str(tl.get_attribute("data-issue")))
    tl.click(); pg.wait_for_timeout(300)
    rows = pg.evaluate("[...document.querySelectorAll('#sheetBody .iss-row')].map(r => r.innerText.replace(/\\n/g, ' | '))")
    check("site down: tile opens What's wrong with the DOWN row first", rows and "usemart.net is DOWN" in rows[0], str(rows))
    pg.locator("#sheetBody .iss-row", has_text="usemart.net is DOWN").first.click(); pg.wait_for_timeout(300)
    lit = pg.evaluate("(() => { const e = document.querySelector('#sheetBody .iss-hl'); return e ? e.innerText : ''; })()")
    check("site down: the row opens the Server sheet with the alert row lit", "Server" in pg.inner_text("#sheetTitle") and "usemart.net alert" in lit and "site DOWN" in lit, lit.replace("\n", " | "))
    check("site down: alert row says since when + why", "down since" in lit and "502" in lit, lit.replace("\n", " | "))
    check("site down: no page errors", not errs, "; ".join(errs))
    ctx.close()

    # 3b. the same in the list look (the card is the first thing he sees)
    ctx, pg, errs = page_for(b, {"state": "down", "since": ago(40), "why": WHY, "checked_at": ago(2), "code": 502, "note": None}, look="list")
    check("list look: the DOWN card shows too", "usemart.net is DOWN" in needs(pg))
    check("list look: no page errors", not errs, "; ".join(errs))
    ctx.close()

    # 4. watch turned away (403): "can't check", never "on"
    ctx, pg, errs = page_for(b, {"state": "up", "since": None, "why": None, "checked_at": ago(3), "code": 403,
                                 "note": "usemart.net turned the watch away (403), so it can't tell from here"})
    server_sheet(pg)
    r = alert_row(pg)
    check("403: alert row says can't check + why", "can't check" in r and "403" in r, r)
    check("403: no DOWN card", "usemart.net is DOWN" not in needs(pg))
    ctx.close()

    # 5. last check 40 min ago (trigger stopped): not trusted
    ctx, pg, errs = page_for(b, {"state": "down", "since": ago(90), "why": WHY, "checked_at": ago(40), "code": 502, "note": None})
    check("old check: no DOWN card off a stale watch", "usemart.net is DOWN" not in needs(pg))
    server_sheet(pg)
    check("old check: alert row says not on yet", "not on yet" in alert_row(pg), alert_row(pg))
    ctx.close()
    b.close()

print(f"\n{OK} passed, {FAIL} failed")
sys.exit(1 if FAIL else 0)
