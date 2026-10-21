# Validation and mathematical conventions

## Executed checks

- `npm test`: 32 passing tests covering deterministic formulas, every lesson's worked/practice contract, invalid numeric data, unknown course handling, complete API journey, persistence, student ID separation, provider fixtures/failures and tutor fallback.
- `npm run test:ui`: 6 passing Chromium scenarios covering full student journey and saved progress after reload; provider-unavailable interface plus tutor hint; mobile navigation and lesson overflow at 390 px; all 12 worked examples and graded responses; local syllabus upload and explicit topic confirmation.
- Clean `npm ci --cache /tmp/sports-npm` and `npm run build`: installation and production Vite build passed. Recharts creates a large JavaScript bundle; code splitting is a future performance improvement.
- Actual historical dataset retrieval succeeded through GitHub; source hash and extraction documented separately.
- Direct MLB and Basketball Reference requests returned proxy 403. MLB success is fixture-tested; current live availability is **not** verified.
- Gemini integration is mocked-contract tested; no Gemini key is configured and no live AI response is claimed.
- Production `npm start` was exercised after clean installation: HTML, health and six-game attributed dataset passed HTTP smoke checks; all five browser scenarios also passed against the production server.
- Docker build was not run.

## Formula references and conventions

Standard definitions align with the NIST/SEMATECH e-Handbook descriptions of [measures of location](https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm), [scale](https://www.itl.nist.gov/div898/handbook/eda/section3/eda356.htm), and the [normal distribution](https://www.itl.nist.gov/div898/handbook/eda/section3/eda3661.htm). Quartile convention is explicitly R type 7 ([R quantile documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/quantile.html)). These are reference links, not claims of a live reference-site retrieval.

Tests use independently calculable values: data [2,4,4,4,5,5,7,9] has μ=5, population variance=4 and sample variance=32/7; exact straight-line paired observations give slope=2, intercept=1 and r=1. Normal CDF is compared to conventional normal tables at z=0, 1 and ±1.96, to absolute tolerance 1e-6. The CDF uses Abramowitz & Stegun 7.1.26's erf approximation (maximum absolute erf error approximately 1.5e-7).

- Sample variance divides by n−1; population variance divides by n. Sample SD itself is not claimed unbiased.
- Quartiles use linear interpolation at (n−1)p. Other courses may prescribe other conventions.
- SE assumes independent identically distributed sampling; sample s estimates σ where marked.
- Confidence and hypothesis lessons explicitly assume **known σ=12**, normal observations or sufficient-sample normal approximation, and valid independent sampling. Selected sports windows are illustrative, not evidence those assumptions hold. With unknown σ, a t procedure is appropriate under its assumptions and is planned.
- Two-sided p = 2[1−Φ(|z|)]. A p-value does not give P(H₀ true).
- Regression is ordinary least squares with paired data and nonzero variance in both coordinates. Association is not causation. Demonstration predictions are not a validated model.
- Numerical grading permits absolute error up to 0.0050001, so rounding to 2–3 decimal places is accepted; blank/nonfinite answers are rejected. Displayed worked values are rounded to 3 decimals; calculations retain full precision.
- Practice uses small synthetic datasets to avoid invented sports records. Correct answers are displayed only after submission succeeds.

## Remaining quality work

Production identity/privacy/security controls, accessibility audit with assistive technology, broader device matrix, live-provider and model smoke tests with configured access, additional question banks, held-out model validation and performance/code splitting remain future work. Browser tests exercise one complete lesson journey plus every lesson's mathematical contract in unit tests; they do not assert that every possible learning interaction is exhaustive.

## GitHub Pages addition

The browser-only Pages adapter has four unit tests for persistence/reload, separate student IDs, conservative course identification, grading retry, offline hints, provider fallback and invalid/storage-error handling. Two additional Chromium scenarios verify the built static site beneath `/Stat_Learning_App/`, with no `/api` calls, no missing assets, no uncaught application errors, saved profile/attempts after reload and a mobile provider outage. `npm run build:pages` and `npm run test:pages` passed.

The workflow builds from `main` with Pages-provided base paths and deploys only the static artifact. GitHub Pages must have **Source: GitHub Actions** selected. GitHub API and the public Pages host return proxy Forbidden from this development environment, so live workflow completion/availability could not be checked here. Browser-only progress is not server SQLite progress; AI credentials remain server-only and are never bundled.

## Gemini integration addition

- `npm test`: **32 passing** tests, including Gemini function-call roundtrips with preserved thought signatures, deterministic tool answers, evidence filtering, quota/provider/safety fallback, consent-aware browser client, Worker CORS, durable reservations and input bounds.
- `npm run test:ui`: **6 passing** browser scenarios; the added case checks opt-in for tutoring and syllabus AI, explicit Gemini labeling, quoted evidence and private-preference filtering. Provider responses are mocked.
- `npm run test:pages`: **2 passing** static-hosting scenarios with AI unconfigured; all core learning and progress work without a gateway.
- `XDG_CONFIG_HOME=/tmp/sportsstats-cloudflare npm run check:ai`: actual Wrangler bundle/dry-run passed.
- `npm run dev:ai` under a writable XDG config: actual local Workerd/SQLite Durable Object runtime started. HTTP checks verified health, origin headers, honest no-key status, four offline hints followed by HTTP 429 on the fifth request.
- No real Cloudflare account was deployed from this environment, no Gemini key was supplied, and no provider charge or live model response is claimed. Public deployment and free-tier model eligibility remain dependent on account configuration.

Official Gemini SDK README and types were inspected from https://github.com/googleapis/js-genai for `generateContent`, function declarations, JSON schema configuration and response handling. The model alias follows its example, but real model access must be verified in the user's own AI Studio account. Free-tier data-use/privacy and account limits require review before submitting any non-demo data.

## Configuration diagnostics

`npm test` now passes 34 tests, including separate Gemini-secret/quota-binding checks and client handling of missing URLs, invalid responses, HTTP 404 and network failures. Six browser scenarios and the actual Wrangler dry-run also pass. Diagnostics expose only binding-presence booleans, not key values.
