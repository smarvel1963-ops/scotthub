"""
SAVE AS: test_issue_list.py   LOCATION: C:/MarvelApps/scotthub/tests/test_issue_list.py
v46 ISSUE LIST (Scott 11/25: "you hit a square there is issue on it opens list of the data in issue you should be able to click that and go
to where you can fix or see issue"). FAKE relay data only (no relay call, no pass): a tile with a problem opens "What's wrong" with one row
per problem; each row opens the right sheet with that item lit up (Fix it card, Yes / No, the row) or UseMart's Reply link built from the
checked id; See everything opens the old sheet; a tile with nothing wrong opens its sheet straight away; no page errors.
RUN: python tests/test_issue_list.py   Exit 0 = all passed.
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
today_ct = (now - datetime.timedelta(hours=6)).strftime("%Y-%m-%d")
UM1, UM2 = "0f3c2a10-1111-4a2b-9c3d-aaaaaaaaaaaa", "0f3c2a10-2222-4a2b-9c3d-bbbbbbbbbbbb"

MH_BAD = {
    "generated_at": iso(now),
    "bets": {"today": {"record": "2-1", "units": 1.2}, "week": {}, "top5": {},
             "slate": [{"sport": "NBA", "game": "Lakers @ Celtics", "bet": "Under 221.5", "start": iso(now - datetime.timedelta(hours=7)), "result": ""},
                       {"sport": "NHL", "game": "Stars @ Blues", "bet": "Over 6", "start": iso(now - datetime.timedelta(hours=9)), "result": "WIN"},
                       {"sport": "NBA", "game": "Bulls @ Heat", "bet": "Over 230", "start": iso(now + datetime.timedelta(hours=3)), "result": ""}]},   # v47: a game still to come
    "health": {"pc": {"active": True, "heartbeat_age_min": 1},
               "server": {"alive": True, "heartbeat_age_min": 2, "bots": {"athena_bot": True, "professor_bot": False}},
               "alerts": [{"title": "Odds pool dry", "severity": "FAIL", "detail": "no credits left"},
                          {"title": "Grader late", "severity": "FAIL", "detail": "last grade 3 h ago"},
                          {"title": "Small thing", "severity": "WARN"}]},
    "repairs": {"enabled": True, "fixable": [{"id": "F-001", "sig": "s1", "title": "Odds pool dry", "severity": "FAIL", "status": "open"}]},
    "approvals": {"enabled": True, "open": [{"id": "A-101", "sig": "q1", "ask": "Turn on the new card?", "rec": "yes"}]},
    "ad_counts": {"read": today_ct, "total": {"today": 3, "week": 10, "month": 40}},
}
DK_BAD = {
    "generated_at": iso(now),
    "finance": {"reconciled_day": today_ct, "next_payday": today_ct, "till_payday": {"total": -120.5, "accounts": []},
                "chase": [{"title": "Venmo refund", "detail": "$40 from the shop"}]},
    "email": {"important_count": 2, "inboxes": [{"inbox": "work box", "status": "error", "error": "login refused", "provider": "gmail"},
                                                 {"inbox": "home box", "status": "ok", "unread": 3, "provider": "gmail"}]},
    "ads": {"report_day": today_ct, "sections": [{"title": "ADS - UseMart", "rows": [{"task": "UseMart FB post", "state": "FAILED", "detail": "token expired"},
                                                                                     {"task": "UseMart IG post", "state": "OK"}]}]},
}
UM_BAD = {"waiting": 3, "over_24h": 1, "newest": [
    {"id": UM2, "ref": "S-2", "name": "Lee", "topic": "Listing help", "age_min": 30, "over_24h": False},
    {"id": UM1, "ref": "S-1", "name": "Pat", "topic": "Refund", "age_min": 1600, "over_24h": True},
    {"id": "javascript:alert(1)", "ref": "S-3", "name": "Bad", "topic": "Sneaky", "age_min": 5}]}
CAL = {"ok": True, "events": [{"title": "Mom's birthday", "start": today_ct, "allDay": True, "cal": "Family"}]}

MH_OK = {"generated_at": iso(now), "bets": {"today": {"record": "1-0", "units": 1}, "week": {}, "top5": {}, "slate": []},
         "health": {"pc": {"active": True, "heartbeat_age_min": 1}, "server": {"alive": True, "heartbeat_age_min": 2, "bots": {"athena_bot": True}}, "alerts": []}}
DK_OK = {"generated_at": iso(now), "email": {"important_count": 0, "inboxes": [{"inbox": "home box", "status": "ok", "unread": 0, "provider": "gmail"}]},
         "ads": {"sections": [{"title": "ADS - UseMart", "rows": [{"task": "UseMart FB post", "state": "OK"}]}]}}


def page_for(b, mhd, dkd, um=None, cal=None):
    ctx = b.new_context(viewport={"width": 412, "height": 915}, is_mobile=True, has_touch=True)
    ctx.add_init_script("localStorage.setItem('scotthub.k', 'test-pass'); localStorage.setItem('scotthub.d', 'test-dec'); localStorage.setItem('scotthub.look', 'tiles');")
    parts = {"masterhub": {"data": mhd}, "desktop": {"data": dkd}}
    if um is not None:
        parts["usemart"] = {"data": um, "received_at": iso(now)}
    body = json.dumps({"ok": True, "parts": parts, "calendar": cal or {"ok": True, "events": []}, "decisions": []})
    ctx.route("https://script.google.com/**", lambda r: r.fulfill(status=200, content_type="application/json", body=body))
    ctx.route("https://usemart.net/**", lambda r: r.fulfill(status=200, content_type="application/json", body="{}"))
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(APP)
    pg.wait_for_timeout(2000)
    return ctx, pg, errs


def tile(pg, open_key, text=None):
    loc = pg.locator(f"#tiles .tl-t[data-open={open_key}]")
    return loc.filter(has_text=text).first if text else loc.first


def close(pg):
    pg.click("[data-act=close]")
    pg.wait_for_timeout(150)


def title(pg):
    return pg.inner_text("#sheetTitle")


def rows(pg):
    return pg.evaluate("[...document.querySelectorAll('#sheetBody .iss-row')].map(r => r.innerText.replace(/\\n/g, ' | '))")


def lit(pg):
    return pg.evaluate("(() => { const e = document.querySelector('#sheetBody .iss-hl'); return e ? e.innerText : ''; })()")


def row_click(pg, text):
    pg.locator("#sheetBody .iss-row", has_text=text).first.click()
    pg.wait_for_timeout(250)


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx, pg, errs = page_for(b, MH_BAD, DK_BAD, UM_BAD, CAL)

    # Systems
    check("Systems tile is marked as having issues", tile(pg, "health").get_attribute("data-issue") == "1")
    tile(pg, "health").click(); pg.wait_for_timeout(250)
    r = rows(pg)
    check("Systems -> What's wrong list", "What's wrong" in title(pg) and "Systems" in title(pg), title(pg))
    check("Systems rows: each red alert, the bot that is down (no yellow alert)",
          len(r) == 3 and "Odds pool dry" in r[0] and "Fix it" in r[0] and "Grader late" in r[1] and "professor_bot" in r[2]
          and not any("Small thing" in x for x in r), str(r))
    check("list has See everything", pg.locator("#sheetBody [data-issall=health]").count() == 1)
    row_click(pg, "Odds pool dry")
    check("fixable alert -> Health sheet, the Fix it card lit up", "Health" in title(pg) and "F-001" in lit(pg)
          and pg.locator("#sheetBody .iss-hl [data-ap=F-001]").count() == 1, lit(pg)[:80])
    check("sheet key is the real sheet (refresh / Fix it taps stay here)", pg.evaluate("document.querySelector('#sheet').dataset.key") == "health")
    close(pg)
    tile(pg, "health").click(); pg.wait_for_timeout(200)
    row_click(pg, "Grader late")
    check("plain red alert -> its row under Alerts", "Grader late" in lit(pg) and "FAIL" in lit(pg), lit(pg))
    close(pg)
    tile(pg, "health").click(); pg.wait_for_timeout(200)
    row_click(pg, "professor_bot")
    check("bot down -> its DOWN row on Health", "professor_bot" in lit(pg) and "DOWN" in lit(pg), lit(pg))
    close(pg)
    tile(pg, "health").click(); pg.wait_for_timeout(200)
    pg.click("#sheetBody [data-issall=health]"); pg.wait_for_timeout(200)
    check("See everything -> the old full Health sheet", title(pg) == "🩺 Health" and pg.locator("#sheetBody .iss-row").count() == 0, title(pg))
    close(pg)

    # Server
    tile(pg, "server").click(); pg.wait_for_timeout(200)
    check("Server tile lists the failing check", any("Bots good" in x for x in rows(pg)), str(rows(pg)))
    row_click(pg, "Bots good")
    check("failing check -> Server sheet, that check lit up", "Server" in title(pg) and "Bots good" in lit(pg), lit(pg))
    close(pg)

    # Approvals
    tile(pg, "approvals").click(); pg.wait_for_timeout(200)
    check("Approvals lists each question waiting", rows(pg) and "A-101" in rows(pg)[0] and "Yes / No" in rows(pg)[0], str(rows(pg)))
    row_click(pg, "A-101")
    check("approval -> Approvals sheet, its Yes / No lit up", "Approvals" in title(pg) and pg.locator("#sheetBody .iss-hl [data-ap=A-101]").count() == 2)
    close(pg)

    # UseMart
    tile(pg, "usemart").click(); pg.wait_for_timeout(200)
    hrefs = pg.evaluate("[...document.querySelectorAll('#sheetBody a.iss-row')].map(a => a.getAttribute('href'))")
    check("UseMart: one Reply row per checked item, over 24 h first", hrefs == ["https://usemart.net/#admin-support/" + UM1, "https://usemart.net/#admin-support/" + UM2], str(hrefs))
    check("UseMart: an item with a bad id is never a link", not any("Sneaky" in x for x in rows(pg)) and not any("javascript" in (h or "") for h in hrefs))
    check("UseMart rows say name, topic and age", "Pat · Refund" in rows(pg)[0] and "waiting 27 h" in rows(pg)[0] and "over 24 h" in rows(pg)[0], rows(pg)[0])
    close(pg)

    # Money
    tile(pg, "money").click(); pg.wait_for_timeout(200)
    r = rows(pg)
    check("Money lists the shortfall + each thing to chase", len(r) == 2 and "Short $120.50" in r[0] and "Venmo refund" in r[1], str(r))
    row_click(pg, "Short $120.50")
    check("shortfall -> Money sheet, Till payday lit up", "Money" in title(pg) and "till payday" in lit(pg).lower(), lit(pg))
    close(pg)
    tile(pg, "money").click(); pg.wait_for_timeout(200)
    row_click(pg, "Venmo refund")
    check("chase item -> its row under Things to chase", "Venmo refund" in lit(pg), lit(pg))
    close(pg)

    # Games
    check("v47: a game waiting on a grade turns Games amber even with another game next", "TO GRADE" in tile(pg, "games").inner_text(), tile(pg, "games").inner_text())
    tile(pg, "games").click(); pg.wait_for_timeout(200)
    r = rows(pg)
    check("Games lists only the game waiting on a grade", len(r) == 1 and "Lakers @ Celtics" in r[0], str(r))
    row_click(pg, "Lakers @ Celtics")
    check("game -> Games sheet, its row lit up", "Games" in title(pg) and "Lakers @ Celtics" in lit(pg), lit(pg))
    close(pg)

    # Email
    check("Email tile with an inbox off is marked", tile(pg, "email").get_attribute("data-issue") == "1")
    tile(pg, "email").click(); pg.wait_for_timeout(200)
    r = rows(pg)
    check("Email lists only the inbox that is off", len(r) == 1 and "work box" in r[0], str(r))
    row_click(pg, "work box")
    check("inbox -> Email sheet, its NOT READ row lit up", "work box" in lit(pg) and "NOT READ" in lit(pg), lit(pg))
    close(pg)

    # Ads
    check("Ads posted tile has no issue mark", tile(pg, "ads", "Ads posted").get_attribute("data-issue") is None)
    tile(pg, "ads", "ran").click(); pg.wait_for_timeout(200)
    r = rows(pg)
    check("Ads lists each failed post", len(r) == 1 and "UseMart FB post" in r[0] and "token expired" in r[0], str(r))
    row_click(pg, "UseMart FB post")
    check("failed ad -> Ads sheet, that row lit up", "Ads" in title(pg) and "UseMart FB post" in lit(pg) and "FAILED" in lit(pg), lit(pg))
    close(pg)

    # Birthdays
    tile(pg, "dates").click(); pg.wait_for_timeout(200)
    r = rows(pg)
    check("Birthdays lists today's birthday", len(r) == 1 and "Mom" in r[0], str(r))
    row_click(pg, "Mom")
    check("birthday -> Birthdays sheet, its row lit up", "Birthdays" in title(pg) and "Mom's birthday" in lit(pg), lit(pg))
    close(pg)

    # no-issue tile on the same screen
    t = tile(pg, "bets", "Today")
    check("Today tile has no issue mark", t.get_attribute("data-issue") is None)
    t.click(); pg.wait_for_timeout(200)
    check("no-issue tile opens its sheet directly", title(pg) == "🎯 Bets" and pg.locator("#sheetBody .iss-row").count() == 0, title(pg))
    close(pg)
    check("issue screen: no page errors", not errs, str(errs[:3]))
    ctx.close()

    # everything fine -> every tile opens its sheet as before
    ctx, pg, errs = page_for(b, MH_OK, DK_OK)
    check("all clear: no tile is marked", pg.locator("#tiles [data-issue]").count() == 0, str(pg.locator("#tiles [data-issue]").count()))
    tile(pg, "health").click(); pg.wait_for_timeout(200)
    check("all clear: Systems opens Health directly", title(pg) == "🩺 Health", title(pg))
    close(pg)
    tile(pg, "email").click(); pg.wait_for_timeout(200)
    check("all clear: Email opens Email directly", title(pg) == "📧 Email", title(pg))
    close(pg)
    check("all-clear screen: no page errors", not errs, str(errs[:3]))
    ctx.close()
    b.close()
httpd.shutdown()
print(f"\nIssue list: {OK} pass, {FAIL} fail")
sys.exit(1 if FAIL else 0)
