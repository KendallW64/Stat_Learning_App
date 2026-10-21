# Sports data evaluation and provenance

Evaluated October 21, 2026. Availability and licensing must be rechecked before expanding or deploying commercially.

| Source | Evidence inspected | Strengths | Limits / MVP decision |
|---|---|---|---|
| FiveThirtyEight NBA Elo CSV | Downloaded the published 17 MB CSV from `raw.githubusercontent.com/fivethirtyeight/data/master/nba-elo/nbaallelo.csv` and filtered Warriors 2015 playoff games; final six rows are the Finals | Attributed, reproducible historical dataset; no key; usable offline | Historical archive, not live. Selected team-game window, not player data. Bundled six-score extract with CC BY 4.0 attribution |
| MLB Stats API | Inspected [MLB-StatsAPI wrapper README](https://github.com/toddrob99/MLB-StatsAPI) and attempted a public schedule request | Public team/game endpoints, structured scores, no key in the implemented schedule call | Direct endpoint access returned proxy HTTP 403 in this environment. Adapter implemented with timeout and validated schema; fixtures and failure path tested. No live retrieval success claimed. MLB data terms apply separately from wrapper code |
| NBA.com through `nba_api` | Inspected [upstream README](https://github.com/swar/nba_api), which documents official stats and live endpoints, player career data, static team/player data, proxy/timeouts | Rich NBA endpoint coverage and existing community client documentation | Python client does not fit this Node MVP directly; endpoints and network access require validation; client license is not a data license. Deferred; use bundled archive initially |

The adapter contract is `{id, sport, league, team, player, title, unit, kind, season, source, url, scope, rows:[{date,label,value}]}`. A provider must return finite values, explicit units, valid dates where historical, and scoped attribution. Missing data produces a visible warning and `kind: Synthetic`, never fictitious professional results. Additional adapters can implement this contract independently of statistics and UI modules.

## Bundled NBA verification

- Original CSV SHA-256 at retrieval: `d46ed3540ee8d9eca31b3e94cc8c777e0be5156173d814ebf65b8195e8d616bc`.
- Filter: `year_id == 2015`, `team_id == GSW`, `is_playoffs == 1`; take the final six chronological records.
- Game dates: June 4, 7, 9, 11, 14 and 16, 2015.
- Warriors points: **108, 93, 91, 103, 104, 105**, including overtime where applicable.
- Opponent: Cleveland (`CLE`) in all six records.
- Source repository: https://github.com/fivethirtyeight/data/tree/master/nba-elo . FiveThirtyEight attributes the game results to Basketball Reference. Data is provided under CC BY 4.0: https://creativecommons.org/licenses/by/4.0/ . This application extracts and reformats six rows.
- No player scoring records are inferred from team totals. Favorite team/player preferences do not imply matching source coverage.

For Baseball, Football, Soccer and Hockey, bundled values are generated teaching examples with no professional team, season, player, or outcome claim. Regression/prediction use explicitly synthetic paired basketball drill observations even if another favorite sport is selected.

## Network destinations

Core learning works offline after install. npm installation requires `registry.npmjs.org`. Optional MLB retrieval requires `statsapi.mlb.com`; optional model tutoring requires `api.openai.com`. Historical data is already bundled; refreshing provenance uses `raw.githubusercontent.com`. No network allowlist was broadened during implementation. The provider blockage does not block the local learning workflow.

## Expanded ESPN integration

`shared/sports-provider.js` implements ten fixed-path league adapters behind the Worker/Node `/api/sports` endpoint. Inputs cannot supply arbitrary remote hosts. Catalogs, rosters, completed schedules and box scores are parsed as separate schemas. The public-provider workflow verified representative completed 2025 team observations in all ten leagues and NBA player observations. Subsequent live Worker requests verified batting, passing and hockey examples as well. See `RELIABILITY_AUDIT.md` for exact boundaries.

ESPN endpoints are a public integration, not an official licensed commercial API contract or uptime guarantee. No license to redistribute all provider content is claimed. Attribution and direct source URLs are retained. Current rosters are an explicitly labeled fallback when the requested historical roster is absent. Soccer uses match-roster statistics and baseball hitting uses only batting tables.
