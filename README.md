# SportsStats Academy

Repository: `KendallW64/Stat_Learning_App`.

A responsive React + Express statistics learning app with 12 interactive topics, transparent calculations, sourced historical NBA data, guided practice, a server-side optional AI adapter, and SQLite progress. The initial course-to-practice journey works without subscriptions or API keys.

## Current working features

- Load original team or player observations with functional sport/league/team/season/player/statistic selectors. Ten league adapters cover professional and collegiate basketball, football, baseball, soccer and hockey. Each dataset includes provider URLs, season, dates, units and scope. Player history and roster gaps are disclosed instead of inventing numbers.
- Use the selected data in charts and transparent worked lessons; saved selection descriptors reload from the provider after refresh. Practice grading and progress remain deterministic.
- Delete individual AI questions with their replies, including pending questions; clear a conversation; deleted turns are excluded from future context.
- Opt into Gemini tutoring or cited web research. Search/provider quota failures show an explicit reference/offline fallback, never a fabricated record or a false “verified” course requirement.
- Upload a text-based PDF, text or Markdown syllabus locally; confirm extracted topics, or research public course sources with Gemini. Scanned PDFs require pasted text.

See [the functional audit](docs/RELIABILITY_AUDIT.md) for verification and remaining limits.

## Run

Requires Node 24.5+ (tested on 24.19.0) and npm. Use the existing checkout; no worktree is needed.

```sh
cd /workspace/Stat_Learning_App
npm ci --cache /tmp/sports-npm
npm run dev
```

The server listens on port 3000. In a local installation, open the application using your local development tooling. `/api/health` returns `{"status":"ok"}`. Vite is integrated into Express; there is only one server to start. Fonts are bundled, with system-font fallbacks; there is no Google Fonts network dependency.

## Try the student journey

1. Choose **Build my learning roadmap**. Enter a course name and optionally university/course number. Paste syllabus text or load a local `.txt` / `.md` file under 30 KB or text-based PDF under 5 MB. The app discloses page/text limits; scanned PDFs require pasted text.
2. Select **Find topics**. A name without recognized topic words triggers a request for more information. Confirm topic checkboxes yourself, choose a sport/team preference and explanation level, then save.
3. Start a lesson, open **Worked example**, inspect the original observations, provenance, formula, and calculation steps. In the spread lesson, switch sample/population denominators. Most data-based lessons allow custom values; custom values are explicitly labeled.
4. Open **Practice**, attempt the problem, request an optional hint, and retry. Correct answers mark a topic practiced. Both incorrect and correct attempts are retained for review.
5. Open **Progress & Practice**, then reload. Your browser student identifier reconnects to persisted SQLite records. Losing local storage or changing browsers creates a different workspace.
6. Explore the historical NBA dataset and public MLB adapter. If the provider is unavailable, a visible warning accompanies synthetic data. Ask the tutor for a hint; offline guidance is explicitly labeled.

## Test

```sh
npm test
# If no system Chromium is installed:
npx playwright install chromium
npm run test:ui
npm run build
```

Browser tests automatically use `/usr/bin/chromium` if present, or Playwright Chromium otherwise. Set `CHROMIUM_PATH` to override. Browser tests launch the dev server unless one is already running. Unit/API tests use isolated in-memory SQLite. Browser tests create independent random student IDs but write test profiles/attempts into the running server's SQLite database.

See [validation](docs/VALIDATION.md) for executed results, assumptions and limits; [requirements audit](docs/REQUIREMENTS.md) for feature status.

## GitHub Pages deployment (GitHub Actions)

The repository includes `.github/workflows/pages.yml`. Pushes to `main` automatically test, build, upload and deploy the **Pages edition**. It uses `actions/configure-pages`, `actions/upload-pages-artifact` and `actions/deploy-pages`, with scoped `pages: write` and `id-token: write` permissions for deployment. The Vite asset base comes from Pages metadata, so project-site files are served beneath `/Stat_Learning_App/` rather than the domain root.

**One-time repository setup:**

1. Open https://github.com/KendallW64/Stat_Learning_App/settings/pages .
2. Under **Build and deployment → Source**, choose **GitHub Actions**. If Pages is unavailable for the repository's visibility/plan, GitHub will show that restriction here.
3. Open **Actions → Deploy SportsStats Academy to GitHub Pages → Run workflow**, choose `main`, and run it (or push another commit).
4. Wait for both **build** and **deploy** jobs to turn green. Open the `github-pages` environment URL in the deployment job: **https://kendallw64.github.io/Stat_Learning_App/** .

An Actions log or downloaded `index.html` artifact is not the published website. A 404 before the first successful deployment is expected; a persistent 404 means checking Source, workflow status and the exact project URL. Do not set Pages to “Deploy from a branch” for this workflow. If an environment approval is required by repository rules, approve the pending `github-pages` deployment.

Pages serves static files and **cannot execute Express, SQLite or server-side AI requests**. The Pages edition implements course topic confirmation, sourced bundled data, all 12 calculations/practice lessons, hints and progress persistence entirely in the browser. It visibly labels browser-only storage and offline tutoring. Browser progress does not synchronize to the server, other devices or browsers, and clearing site data removes it. No API credentials belong in Pages build variables. Optional direct public MLB requests may fail because of network/CORS restrictions and fall back transparently. Pages can optionally call a separately hosted Gemini Worker, configured through `AI_API_URL`; local progress still stays in the browser. The existing Node/SQLite deployment remains available for server-based storage.

To reproduce and test the static site locally:

```sh
npm ci
npm run test:pages
# Or build and keep a static preview running:
npm run build:pages
npm run preview:pages
```

`test:pages` runs two real-browser checks against a static preview under the project subdirectory: complete course/practice/reload/tutor journey with no API requests or missing assets, and mobile provider-failure handling. Use the same Chromium installation instructions as the normal browser suite. Build output is `dist-pages/`; the workflow builds its deployable artifact into `dist/`. For a different repository name or a custom domain, the workflow's Pages metadata supplies the production base path; adjust local preview/test paths accordingly.

Git push access is distinct from GitHub API/Pages administration. Deployment settings and live Actions status could not be queried from the development environment (proxy Forbidden). Local static deployment tests pass; the public deployment must be confirmed by the green deploy job.

## Gemini AI (optional free-tier demo)

AI tutoring, conversational follow-up, guided numerical tools and syllabus-topic suggestions are implemented through a secure backend. The browser never receives a model key. See **[the Gemini + Cloudflare setup guide](docs/GEMINI_SETUP.md)** for exact Actions secrets, Worker secret, public URL variable and deployment steps.

The Pages workflow uses **`https://stat-learning-app.ansfwatson4.workers.dev`** by default. The repository **Actions variable `AI_API_URL`** can override that public Worker URL. It does not read model secrets. The separate **Deploy Gemini AI Worker** workflow is manually triggered after you securely configure `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Add **`GEMINI_API_KEY` as an encrypted Worker secret in Cloudflare**, not as a Vite variable. No paid services are assumed; use a provider project/model eligible for free quota with paid billing disabled.

AI is explicitly opt-in in the tutor and syllabus form. Tutor context includes the confirmed course/topics, sport, level, aggregate attempts and recent messages; no raw syllabus or personal team/player preference is included. Syllabus text is sent only when the separate syllabus AI checkbox is enabled. Use public/fictional examples: free-tier Gemini data-use terms may allow submitted content to improve services.

The Gemini adapter handles function calls through the deterministic statistics engine and returns validated calculation results to the model. Practice grading stays deterministic. It uses the Gemini `generateContent` API and a configurable model (`gemini-flash-latest` by default). Live Gemini availability is **not verified** without a configured key. Mock tests cover tool roundtrips, thought signatures, structured syllabus evidence, secret boundaries and provider/quota failure fallback. The bundled offline guide remains available with no key or when a service fails.

For the Node version, set `GEMINI_API_KEY` in the ignored server `.env` or host secret manager, optionally set `GEMINI_MODEL`, and restart. The previous OpenAI-specific adapter has been replaced with Gemini for this demo. Connection status reports Worker configuration; only a successfully labeled Gemini response verifies real model access.

## Production run and deployment

```sh
npm ci --cache /tmp/sports-npm
npm run build
PORT=3000 DB_PATH=.runtime/academy.sqlite npm start
```

Host as a persistent Node service, with HTTPS at a reverse proxy and a persistent writable volume for `.runtime` (or the `DB_PATH` parent directory). The API serves the built frontend and uses the same origin. The service must restart after machine restoration; processes are not part of a reusable filesystem snapshot.

A Dockerfile is included for deployment: `docker build -t sportsstats-academy .`, then `docker run --rm -p 3000:3000 -v sportsstats-data:/app/.runtime sportsstats-academy`. Inject optional secrets through the host secret manager. Docker build/run is documented but was not executed in this environment.

This MVP has no accounts or authentication. Its random browser ID is a convenience identifier, not an authorization boundary. Do not deploy it with real sensitive student information on a public shared service before adding authentication, per-user authorization, retention/deletion controls, abuse limits and operational security. Do not store raw syllabi in it. The app currently stores only a course name, confirmed topic IDs, preferences and attempts. Back up SQLite using SQLite-safe backup tools. A single Node process is the supported MVP topology.

## Structure

- `src/`: six responsive application sections and reusable UI.
- `shared/stats.js`: pure deterministic formulas, validation, and rounding-aware grading.
- `shared/lessons.js`: 12 concept explanations, worked calculations, practice and topic matching.
- `shared/data.js`: browser-safe normalized sports datasets and adapters; `server/data.js` re-exports them.
- `server/app.js`: input validation and SQLite profiles/attempts; `server/ai-engine.js` and `ai-routes.js`: Gemini adapter, statistics tools, origin checks and usage guards.
- `worker/` + `wrangler.toml`: Cloudflare Worker and shared durable quota, used by the Pages edition.
- `src/ai-client.js`: consent-aware AI connection and explicit offline fallback.
- `data/warriors.json`: attributed, verified historical extract.
- `src/browser-api.js`: static-hosting persistence and grading adapter; `shared/tutor.js`: common offline guide.
- `tests/`: formula, API, provider failure, tutor contract, student journey, Pages and responsive UI tests.

## Development roadmap

1. Add secure accounts, access controls, deletion/export and privacy review before public multiuser use.
2. Add vetted course catalogs, explicit confidence handling, and local PDF extraction with consent.
3. Expand provider licensing review, historical-player coverage and cache resilience; retain source, season, retrieval time and scope on every dataset. See [provider evaluation](docs/DATA_PROVIDERS.md).
4. Expand the question bank to multi-step quizzes and adaptive recommendations. Current completion is one correct response, not a validated mastery model.
5. Add bootstrap simulations, Student-t intervals for unknown variance, residual diagnostics, held-out model evaluation and instructor assignments.
6. Evaluate live-model tutoring for numerical faithfulness, prompt injection and hint/answer boundaries before claiming production AI reliability.
