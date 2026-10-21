# Functional audit and data boundaries

## Implemented and exercised

- **Question deletion:** each question has a Delete button. Its paired reply is removed, deleted turns are excluded from future requests, and deleting an in-flight question aborts the browser request and prevents a late reply from restoring it. Clear conversation resets the chat. Deletion does not revoke content already sent to a provider.
- **Ten league adapters:** NBA, WNBA, NCAA men’s basketball, NCAA women’s basketball, MLB, NFL, NCAA football, Premier League, MLS and NHL. The public provider smoke workflow fetched real completed 2025 team-game observations for a representative team in every league. This is representative validation, not a claim of exhaustive coverage of all teams/years.
- **Real selectors:** sport, league, team, season, player and statistic. Selecting new filters does not silently relabel old data: the user loads a selection explicitly. Failed selections show an error and identify that the prior displayed dataset remains.
- **Player observations:** box-score values, not model-generated records. Basketball points/rebounds/assists; baseball batting hits/home runs/runs; football passing/rushing/receiving yards; soccer goals/assists/shots; hockey goals/assists/shots. Availability varies by player/season. Six recent completed team games are requested; unavailable/DNP observations are excluded, not zero-filled. Baseball pitching “hits allowed” are never misrepresented as batting hits.
- **Rosters:** historical roster requests are tried first. If empty, current roster choices are explicitly labeled as such. Historical game observations still come from the selected season’s actual box scores. A traded or newly joined player may have no observations in that historical window.
- **Sources:** original schedule URL, per-game box-score links, season, units, sample scope, observation dates and response preparation time accompany data. Provider responses may be cached for five minutes. Team data is capped at the last 100 returned completed games; this is not a promise of a full-season census.
- **Connected lessons:** the Explorer’s active observations feed the worked lesson and charts. Selection descriptors persist locally and are reloaded from the source after a page refresh. Gemini tutor requests re-fetch selected provider data on the server, so browser-supplied numbers are not treated as verified records.
- **Statistics:** all 12 topic calculation/practice contracts remain tested. Descriptive vs inferential and sample vs population distinctions remain explicit. Practice uses labeled synthetic data. Regression and prediction currently use labeled synthetic paired drills, not a validated sports prediction model.
- **Course input:** manual topic confirmation, conservative text topic matching, local text/Markdown/PDF extraction, opt-in syllabus topic suggestions with quoted evidence, and a separate Gemini public-course research action. A school/course number never automatically proves its curriculum.
- **PDF:** text-based PDF under 5 MB, first 30 pages / 29,000 characters maximum with truncation disclosure. Scanned-image OCR is unavailable; the app requests pasted text instead. Parsing runs locally, and Gemini receives extracted text only with separate opt-in.
- **Gemini research:** optional Google Search grounding returns HTTPS citations; a result without grounding links is not shown as a sourced AI answer. If Gemini search is unavailable, a reviewed reference guide is visibly labeled as curated content, not a fresh search or generated answer. Course research that cannot be verified asks for a syllabus/clarification.
- **AI response display:** Markdown tables and mathematical notation render safely; untrusted raw HTML is not executed. AI prose still needs checking against original observations and verified calculations.

## Current verification

- **44 unit/API/Worker/formula tests** pass.
- **11 browser scenarios** cover the original journey plus deletion, pending-request deletion, player selection → chart → worked lesson → refresh, cited research/math rendering, course confirmation and local PDF extraction.
- **Two static Pages scenarios** verify the subdirectory deployment and offline/provider-unavailable path.
- The separate public-provider workflow verified completed team data in all ten leagues and real NBA player observations. Live Worker requests also verified examples for Stephen Curry (points), Aaron Judge (hits), Patrick Mahomes (passing yards) and David Pastrnak (goals).
- Live Gemini worked previously, but recent test requests returned a Google Search quota error and a transient provider error. Those are not represented as successful new AI answers. The app reports the distinction, retries only transient server errors once within its deadline, and retains functional sourced data/calculations/reference fallback. Paid upgrades are not assumed.

## Limits that remain

No model can guarantee every claim is correct. Linked source pages do not automatically establish a student’s current institutional requirements. ESPN is a public, unofficially integrated endpoint with no SLA assumed by this app; terms and coverage must be reviewed before commercial distribution. Gemini search availability, generation quotas and regional access depend on the user’s account/model. Forty shared model requests per UTC day and four AI submissions per minute per client IP protect the demonstration allowance; they are not authentication or a dollar budget.

This remains a local/browser learning MVP. Production accounts, cross-device synchronization, private student-record handling, scanned-image OCR, exhaustive institution catalogs, all historical players, and validated held-out predictive modeling are not claimed implemented.
