# Scott Hub
Save path: C:\MarvelApps\scotthub\README.md

Scott's PRIVATE away-from-home status app (Scott 2026-10-10). Live: https://smarvel1963-ops.github.io/scotthub/

This site holds **no data**. The numbers come from Scott's own Apps Script relay (`relay/Code.gs`, project
"Scott Hub Relay" in his Google account) and only with the read pass, which reaches the phone once through a
`#k=` setup link and stays in that phone's storage.

- PC side: `C:\MasterHub\scott_hub_snapshot.py` (bets, health, HOT_LIST) + `C:\MarvelDesktop\scott_hub_snapshot.py`
  (money, business), sent by `C:\MasterHub\scott_hub_upload.py` (switch in the gitignored
  `C:\MasterHub\data\scott_hub_config.json`).
- Layout = hub family three bands: clock + scene / what needs you / bubbles.
- Not part of the sold Day Hub engine on purpose: private money screens never ride in customers' code.
- v14 UseMart support card (Scott 10/23): the UseMart server sends a fourth relay part, `usemart` (waiting count, over 24 h,
  newest 10 - ref, first name, topic, age; no emails or message text), every 5 min while its switch SCOTT_HUB_SUPPORT is on
  (`C:\MarvelApps\usemart\api\src\scotthub.ts`). It needs relay v5 (`relay/Code.gs`) redeployed and its own Script Property
  `SCOTT_HUB_USEMART` (a new random key - the same value goes in the UseMart server's .env as `USEMART_SCOTTHUB_WRITE_KEY`).
  Reply opens https://usemart.net/#admin-support/<id>.
