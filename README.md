# SportsStats Academy

A responsive React + Express statistics learning app with 12 interactive topics, transparent calculations, sourced historical NBA data, guided practice, a server-side optional AI adapter, and SQLite progress. The initial course-to-practice journey works without subscriptions or API keys.

## Run

Requires Node 24.5+ (tested on 24.19.0) and npm. Use the existing checkout; no worktree is needed.

```sh
cd /workspace/Stat_Learning_App
npm ci --cache /tmp/sports-npm
npm run dev
```

The server listens on port 3000. In a local installation, open the application using your local development tooling. `/api/health` returns `{"status":"ok"}`. Vite is integrated into Express; there is only one server to start. Fonts are bundled, with system-font fallbacks; there is no Google Fonts network dependency.

## Try the student journey

1. Choose **Build my learning roadmap**. Enter a course name and optionally university/course number. Paste syllabus text or load a local `.txt` / `.md` file under 30 KB. PDF is not supported; paste its text.
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

## Optional AI model

Without a key, the app uses a deterministic topic-aware guide, **not generative AI**. It provides hints, sample/population explanations, alternate examples and course connections; its language understanding is intentionally limited.

Copy `.env.example` to `.env` and enter `OPENAI_API_KEY` securely on your server, or inject it through your hosting secret manager. Never expose it with a `VITE_` prefix. `OPENAI_MODEL` defaults to `gpt-4.1-mini`. Restart the server after changing environment variables. Node loads `.env` for npm dev/start and respects HTTPS proxy configuration via `--use-env-proxy`. The adapter calls the OpenAI Responses API. Live model access was not tested because no key is present; request construction, context and response parsing are tested with a mock.

The AI receives the student's saved course, confirmed topics, chosen sport, explanation level, topic-specific attempt counts and deterministic worked example. Syllabus text is not retained or sent. The tutor is instructed to guide rather than solve practice exercises. Generative text is not independently fact-checked at runtime; numerical grading always runs through the deterministic engine. The offline guide remains available when a model request fails.

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
- `server/data.js`: normalized sports dataset contract, bundled adapter and MLB adapter.
- `server/app.js`: input validation, SQLite profiles/attempts and optional model-backed tutoring.
- `data/warriors.json`: attributed, verified historical extract.
- `tests/`: formula, API, provider failure, tutor contract, student journey and responsive UI tests.

## Development roadmap

1. Add secure accounts, access controls, deletion/export and privacy review before public multiuser use.
2. Add vetted course catalogs, explicit confidence handling, and local PDF extraction with consent.
3. Add licensed league/team/player discovery and caching; retain source, season, retrieval time and scope on every dataset. See [provider evaluation](docs/DATA_PROVIDERS.md).
4. Expand the question bank to multi-step quizzes and adaptive recommendations. Current completion is one correct response, not a validated mastery model.
5. Add bootstrap simulations, Student-t intervals for unknown variance, residual diagnostics, held-out model evaluation and instructor assignments.
6. Evaluate live-model tutoring for numerical faithfulness, prompt injection and hint/answer boundaries before claiming production AI reliability.
