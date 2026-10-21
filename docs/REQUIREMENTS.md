# Requirements audit

| Requested capability | MVP status and limits |
|---|---|
| Dashboard, course, explorer, learning, tutor, progress sections | Implemented, navigable and responsive |
| Complete course → sport → lesson → practice → saved progress journey | Implemented and browser tested, including wrong-answer retry and reload |
| University/course search | Name/number entry and topic matching implemented; **no verified institution catalog lookup**. Unknown names require syllabus/topic input |
| Syllabus upload | Local `.txt`/`.md` loading and topic detection; no document retained. **PDF and image OCR not implemented** |
| Personalized pathway | Student confirms topics; ordered roadmap and next unpracticed recommendation. No AI claim of verified requirements |
| Favorite sport/team/player | Five sports selectable; free-text team/player preference saved. **No broad team/player catalog or player-level data filtering** |
| NBA/WNBA/NCAA/NFL/MLB/soccer/NHL coverage | Authentic NBA bundle and one historical MLB adapter. Other sports synthetic; **WNBA/NCAA and league-wide data not integrated** |
| Real data/source/season/date/scope | Verified Warriors 2015 Finals extract with attribution, dates, units, scope and license; original observations shown |
| Multiple provider layer | Independent normalized bundled/MLB adapters, timeout and visible fallback. No subscription required |
| 5+ fully interactive lessons | **12** topics, each with worked math, numerical practice, hint and deterministic grading |
| Mean, median, mode; range, variance, SD | Implemented; mode ties handled and range shown; full deviation audit table for spread |
| Quartiles/percentiles; probability/conditional probability | Implemented with R type-7 interpolation and conditional denominator explanation |
| Normal distribution/z-scores; sampling/SE | Implemented; normal model labeled hypothetical; sample SE assumptions explicit |
| Confidence intervals, hypothesis/p-values/significance | Known-σ normal-model teaching examples; limitations explicit. Student-t and robust methods are future work |
| Correlation/regression/prediction | Synthetic paired data, line fit, r and prediction. No real-world prediction validity claimed; held-out validation is discussed, not implemented |
| Editable datasets/visualization | Explorer area/bar switch and accessible numeric table; most worked lessons allow custom values. No arbitrary paired data editor yet |
| Sample vs population, descriptive vs inferential | Explained and sample/population spread toggle implemented |
| Guided learning and skill levels | Hints before answer, retry feedback, three saved levels used in tutor context. No autonomous validated student ability model |
| AI tutor | Contextual offline guide works; secure Gemini adapter, tool execution, history, opt-in and mocked contract tests implemented. **Live generative model not tested or connected without a key** |
| Numerical reliability | Pure engine with unit tests; grading never delegates arithmetic to a model. AI prose is not fully numerically verified at runtime |
| Progress/quiz/review | Topic practice, attempt accuracy, incorrect-attempt hints, next unpracticed recommendation and persisted history. One question per topic; no broad quiz bank, streak or unearned mastery claims |
| Private student data | No syllabus retention, no stored chats. SQLite profile/attempt storage; **production authentication/access controls absent** |
| Offline/provider unavailable | Bundled data and guide usable; API and UI fallback tests pass |
| Mobile/tablet/desktop | Responsive CSS, browser navigation and overflow checks; visual inspection at desktop and mobile widths |
| Install/run/test/deploy/roadmap | README, Dockerfile and provider/validation docs included. Docker recipe unexecuted |

No betting or gambling examples are used. The application is a functional local learning MVP, not a fully integrated multi-institution or multi-league production service.

## Static GitHub Pages edition

The Actions deployment adds a separately labeled browser-only edition. Course confirmation, practice grading, attributed datasets, offline tutoring, and browser-local progress work without Express. Server accounts/SQLite and model-backed AI are not hosted by Pages. See README for Source selection, workflow deployment and local static tests.

## Optional Gemini service

Pages can connect to a separate Cloudflare Worker with server-only `GEMINI_API_KEY`. Live provider access is pending secure account/key configuration, not claimed completed. AI syllabus suggestions are opt-in and evidence-checked; user confirmation is still required. Durable usage caps protect the demo allowance without replacing production authentication. The setup guide explicitly describes free-tier eligibility and public/fictional-data-only use.
