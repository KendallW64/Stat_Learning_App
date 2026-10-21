# SportsStats Academy implementation plan

## Architecture and experience
React + Vite frontend, Express API, Node's built-in SQLite database, a pure statistical calculation module, replaceable sports adapters, and a server-only tutoring adapter. Six navigation sections share a persistent course and sport context. The core journey is course topic confirmation → sport selection → roadmap → worked lesson → hinted practice → recorded mastery.

## Database and privacy
A random browser student ID identifies local profiles. SQLite stores profiles (course, confirmed topics, sport, team, level) and attempts (topic, answer, correctness, timestamp). No login is claimed; this is a single-machine MVP, not suitable for sensitive student records on a public multiuser deployment. Syllabus text is parsed in the browser and never uploaded or retained. PDF extraction, institutional catalogs, authentication, encryption-at-rest, and cross-device accounts are future services.

## Integrations
Bundled historical data: Golden State Warriors scores in the six 2015 NBA Finals games, retrieved and checked against FiveThirtyEight’s NBA Elo CSV, with dates and Basketball Reference attribution. Other sports use explicitly synthetic teaching data, never player records. MLB Stats API is a public, keyless integration for final regular-season team scores. Provider requests have timeouts and fall back with a visible explanation. Optional OpenAI Responses API uses OPENAI_API_KEY only on the server; without a key the tutor uses a clearly labeled deterministic teaching guide.

## Phases and validation
1. Pure math engine and 12 topic definitions with worked calculations, assumptions, practice and hints.
2. Server persistence, validation, data provider and tutoring.
3. Responsive dashboard, onboarding, explorer, lessons, tutor, progress.
4. Formula tests, API/student journey tests, production build and HTTP smoke checks.

## Immediate vs external
Immediately functional: manual/name/syllabus-text topic identification with confirmation, preferences, all lessons, adjustable datasets, charts, hints, grading, persistence, offline tutoring, source attribution, public MLB fetch with fallback.
External services: generative tutoring requires a model API key; verified institutional course lookup needs a catalog provider; production accounts need an authentication service. Additional leagues need vetted licensed providers. These are not represented as completed integrations.
