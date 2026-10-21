# Connect a free-tier Gemini example to GitHub Pages

The app is configured to use **https://stat-learning-app.ansfwatson4.workers.dev** in GitHub Pages builds by default. An explicit repository Actions variable `AI_API_URL` overrides that default. The Wrangler deployment name is `stat-learning-app` to match this service.

The implementation is complete and mock/local-runtime tested. A real Gemini response and a public Worker deployment have **not** been verified: neither a Gemini key nor Cloudflare credentials are configured in the development environment.

## Architecture

GitHub Pages → HTTPS Cloudflare Worker → Gemini Developer API. Course/profile/progress remain in the browser. The Worker handles only AI status, consenting tutor requests and consenting syllabus-topic requests. It holds the Gemini secret and executes deterministic calculation tools. A SQLite-backed Durable Object enforces a shared quota across Worker instances. No paid services are provisioned by this repository.

For a **free-only demonstration**, keep Cloudflare on its Free plan and use a Gemini project/model with an available free quota and no paid billing enabled. Model/region/account eligibility and provider quotas change; a key by itself does not guarantee free usage. This app does not enable billing, upgrade plans, or buy credits. If a selected model is unavailable or quota is exhausted, it shows the offline guide. Check current terms in your own Cloudflare and Google accounts before deploying.

## Simplest route: create a separate Worker in the Cloudflare dashboard

This route uses Cloudflare’s Git integration, so you do **not** need to copy a Cloudflare API key or token into GitHub.

1. Open **Cloudflare → Workers & Pages → Create application → GitHub**. Authorize access to this repository if prompted.
2. Import **`KendallW64/Stat_Learning_App`**, branch **`main`**. Create a **Worker**, not a second Pages frontend.
3. Set the Worker name to exactly **`stat-learning-app`**, matching `wrangler.toml`. Leave the existing handoff app Worker unchanged.
4. Use the repository root (`/`), **build command `npm ci`**, and **deploy command `npx wrangler deploy`**. If Cloudflare has already installed dependencies automatically, the explicit build command simply repeats the locked install. Deploy from the repository root so Wrangler discovers the checked-in configuration and Durable Object migration. Use Node 24 if selecting a build runtime.
5. Deploy on the Cloudflare **Free** plan. If the account reports a requirement to upgrade, stop and check the free-plan capabilities rather than accepting a paid upgrade.
6. After deployment, add **`GEMINI_API_KEY` as an encrypted Worker secret** using step 3 below. Set GitHub’s public **`AI_API_URL`** Actions variable and rerun Pages as described in step 4 below.

The new Worker gets its own `workers.dev` address. This route does not deploy over the handoff app because the name is different. Use either Cloudflare Git builds or the manual GitHub Worker workflow as your deployment method; there is no need to configure both. Pages continues to deploy with its existing GitHub Actions workflow.

The remaining numbered steps document the alternative GitHub Actions deployment method. If you deployed directly through Cloudflare, skip steps 1–2 and continue at step 3.

## 1. Store Cloudflare deployment credentials in GitHub

Use your existing **Cloudflare API token** if it has permission to deploy Workers in the intended account. A **Global API Key is not the same as an API token** and must not be entered as `CLOUDFLARE_API_TOKEN`. If necessary, create a scoped token using Cloudflare’s **Edit Cloudflare Workers** template and restrict it to your account. This workers.dev deployment does not need access to an unrelated custom domain.

In the repository’s [Actions secrets](https://github.com/KendallW64/Stat_Learning_App/settings/secrets/actions), add:

| GitHub Actions secret | Value to enter securely |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Your scoped Cloudflare Workers API token |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID, available in the Cloudflare dashboard |

Never put token/key values in a commit, issue, chat, `wrangler.toml`, or any `VITE_` variable. GitHub stores these encrypted; the workflow uses them only for deployment. No Cloudflare credential is bundled into the site.

## 2. Deploy the Worker with GitHub Actions

Open [Deploy Gemini AI Worker](https://github.com/KendallW64/Stat_Learning_App/actions/workflows/ai-worker.yml), select **Run workflow**, and choose `main`. It installs locked dependencies, runs unit/API/Worker contract tests, and deploys `wrangler.toml` using Wrangler. This workflow is manual so an unconfigured account does not make every Pages build fail.

When it succeeds, find `stat-learning-app` under **Workers & Pages** in Cloudflare. Copy the service’s HTTPS `workers.dev` URL. No custom domain is required. The account must support SQLite-backed Durable Objects on the chosen plan; if the account reports a restriction, stop rather than upgrading to a paid plan for this demo.

## 3. Add the Gemini key as an encrypted Worker secret

Obtain a key for your free-tier demo project from [Google AI Studio](https://aistudio.google.com/apikey). Where available, restrict the key to the Generative Language API. A server key must not be restricted to a browser HTTP referrer.

In Cloudflare, open **Workers & Pages → stat-learning-app → Settings → Variables and Secrets → Add**:

- Type: **Secret**
- Name: **`GEMINI_API_KEY`**
- Value: your Gemini key, entered only in that secure field

Deploy/save the secret change. Leave the key out of GitHub Pages configuration. Cloudflare stores it encrypted and the Worker sends it to `generativelanguage.googleapis.com` in the `x-goog-api-key` header; it never returns the value to a client.

The default `GEMINI_MODEL` is `gemini-flash-latest`, the alias used in Google’s current SDK README at implementation time. **Live model availability/free eligibility was not tested.** If your AI Studio account offers a different free model, change `GEMINI_MODEL` in `wrangler.toml`, commit, and rerun the Worker workflow. Model IDs must contain only letters, numbers, dots, underscores and hyphens.

## 4. Connect Pages to the public Worker URL

In the repository’s [Actions variables](https://github.com/KendallW64/Stat_Learning_App/settings/variables/actions), add:

- Name: **`AI_API_URL`**
- Value: your Worker’s HTTPS root URL, e.g. `https://stat-learning-app.ansfwatson4.workers.dev`

This URL is public and **is not a secret**. Do not append `/api/ai` and do not enter a key here.

If `AI_API_URL` is unset, this repository already uses `https://stat-learning-app.ansfwatson4.workers.dev` by default. Remove or update an old override if it points to another service.

Rerun the [Pages deployment workflow](https://github.com/KendallW64/Stat_Learning_App/actions/workflows/pages.yml). Vite reads `VITE_AI_API_URL` at build time, so editing the variable alone does not change an already deployed website.

The Worker permits the exact browser origin `https://kendallw64.github.io` by default. That is an origin, without `/Stat_Learning_App/`. If you use a different public domain, update `AI_ALLOWED_ORIGINS` in `wrangler.toml` and redeploy. Never use `*` for a private integration.

## 5. Verify a real request

Open the published app, then **AI Statistics Tutor → Check connection**. “AI service configured · Gemini” means the Worker has the secret binding; it is **not proof that Google accepts the key**. Enable **Use AI for this conversation**, then ask a short question. A successful response is labeled **AI tutor · Gemini**. A provider error, quota failure or invalid key is visibly labeled as an offline response.

The **My Statistics Course** page separately requires **Use AI to suggest syllabus topics** before any syllabus text is sent to the Worker/Gemini. The model returns quoted evidence; the server checks quotations against the supplied text and only accepts supported topic IDs. The student still confirms the roadmap.

Free-tier provider terms may allow submitted content to improve their products. Use public or fictional examples only. Do not submit student names, IDs, grades, contact details, private syllabi or sensitive records to this demonstration. The application does not retain prompts/syllabus text and does not enable application request-body logging; provider retention/data-use policies still apply.

## Quotas and limitations

- Default: **40 Gemini model requests per UTC day**, shared across the Worker deployment. Each tool roundtrip consumes additional model requests. Tutor requests are capped at three model calls.
- Four AI submissions per minute per client IP. Only a daily hash and short-lived counters are stored in the Durable Object; no raw IP, prompt, course text or API key is stored there.
- Inputs/outputs and conversation history are bounded. Responses have token limits and 20-second provider timeouts.
- These are usage guards, **not a dollar budget, authentication, or a guarantee of a free provider plan**. Keep provider billing disabled for a free-only demo. Distributed attackers may exhaust the allowance; this is not a production identity system.
- CORS restricts browser origins but does not authenticate non-browser callers. Add account-based authorization/bot protection before broad public release.
- The Node backend uses equivalent in-memory caps; those reset on restart and are not shared across processes. The Cloudflare Worker uses durable storage instead.
- The model can still make mistakes in prose. New arithmetic can call verified server-side statistics tools; all exercise grading remains deterministic. Course suggestions are never verified institutional requirements.

## Alternative: local Node service

Copy `.env.example` to `.env`, enter `GEMINI_API_KEY` securely there, run `npm run dev`, and use the local app. Do not commit `.env`. Same-origin AI requests use Express; Pages uses the Worker URL. Neither path requires an OpenAI subscription or key.

## Local Worker commands

```sh
npm ci
npm run check:ai          # bundle/dry-run; no deployment
npm run dev:ai            # local Worker + local durable storage, no account required
npm run deploy:ai         # real deployment; requires Cloudflare authentication
```

For a local Gemini test, put `GEMINI_API_KEY` in ignored `.dev.vars`, and add your local browser origin to `AI_ALLOWED_ORIGINS` in `wrangler.toml`. Never use a real key in a checked-in fixture. In a sandbox with a read-only home, prefix Wrangler commands with `XDG_CONFIG_HOME=/tmp/sportsstats-cloudflare`.

You can also deploy from your own terminal with `npx wrangler login`, `npm run deploy:ai`, then `npx wrangler secret put GEMINI_API_KEY` (interactive secure entry). This avoids storing a Cloudflare token in GitHub, but subsequent Worker deployments are then manual unless you configure Actions.

## Diagnosing “AI not configured”

`/api/ai/status` reports only booleans and public configuration, never secret values. Current builds include `reason` and `checks`:

- `missing-key`: Cloudflare does not have a `GEMINI_API_KEY` binding on this Worker deployment. Add an encrypted secret on **stat-learning-app**, then deploy/save that version.
- `missing-quota-binding`: deploy from the repository root with Wrangler so `AI_BUDGET` and its migration are created.
- `configured`: both bindings exist; only a real successful tutor request proves Google accepts the key/model.

A response containing only `available`, `provider` and `model` is an older Worker build. Redeploy the latest main branch for precise checks. A network/CORS failure is reported separately and is not evidence of a missing Gemini secret.
