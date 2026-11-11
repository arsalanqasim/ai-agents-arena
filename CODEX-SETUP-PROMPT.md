# CODEX — Setup & Build Prompt (AI Agents Arena, MMVH Front Desk)
Read this whole file first. You are executing on Arsalan's laptop with computer use.
Team: Arsalan = operator/relay on site. Muse = lead architect (remote chat) who wrote
everything in this repo. You = builder-executor + reviewer. Competition clock: build
ends 14:30 PKT today, evaluation 14:30–15:30. Report blockers immediately, never
thrash on one blocker for more than 10 minutes — report it to Arsalan in one line.

## STEP 0 — Pull and read (5 min)
1. In the Arena2026 folder: `git clone https://github.com/arsalanqasim/ai-agents-arena.git` (if already cloned: `git pull`).
2. Read in this order: README.md → docs/01-sheets-and-workflow.md → docs/02-code-nodes.md → docs/03-test-cases.md → prompts/llm-system-prompt.txt. The code/*.js files are the exact contents of the n8n Code nodes, numbered in build order.
3. Confirm to Arsalan in one line: "REPO READY — building on local n8n".

## STEP 1 — Run n8n LOCALLY (deadline: working by 12:45 PKT)
- Check Node.js: `node --version` (need 18+). If present: start n8n with `npx n8n start` in a dedicated terminal and leave it running. If Node is missing but Docker Desktop is present and running, use the official n8n docker image with a named volume on port 5678. If neither works by 12:45, STOP and tell Arsalan: "LOCAL N8N BLOCKED — switch to Cloud" (the team falls back to n8n Cloud with Arsalan building manually from the same repo docs).
- Open http://localhost:5678, create the local owner account (Arsalan's email, a password Arsalan gives you — do not invent/store it anywhere in the repo).

## STEP 2 — Google assets (use Arsalan's signed-in Google account, arsalanqasim400@gmail.com)
1. Google Calendar: create two calendars named exactly `MMVH-Mr Saanp` and `MMVH-Miss Loomri`.
2. Google Sheets: create spreadsheet `MMVH Records` with tabs Config, Appointments, CallLog and the exact headers + Config rows from docs/01.
3. Google Cloud Console (console.cloud.google.com): create (or reuse) a project; enable "Google Calendar API" and "Google Sheets API"; configure the OAuth consent screen (External, Testing, add arsalanqasim400@gmail.com as test user); create an OAuth 2.0 Client ID (Web application) with redirect URI `http://localhost:5678/rest/oauth2-credential/callback`.
4. In n8n: create Google credentials (Calendar and Sheets — one shared Google OAuth2 credential is fine) using that Client ID/Secret, and complete the sign-in flow.
5. Judge sharing: Arsalan will give you the judge Google account email when he has it from the organisers. When he does: share both calendars with that account with "Make changes to events" (edit) access, and share the Sheet with view access. Until then, proceed — sharing is a final step, not a blocker.
6. SECURITY: never write any API key, client secret, or password into the repo, a commit, or a file inside this project folder (except n8n's own credential store). The Groq API key comes from Arsalan (his `arena-keys.txt` on the Desktop) — ask him for it when you reach the LLM node; it goes only into the n8n HTTP node header.

## STEP 3 — Build the workflow (docs/01 map + docs/02 wiring, exactly)
- Create the workflow in n8n following the node map in docs/01 §2 and wiring notes in docs/02. Node NAMES must match the docs character-for-character where the code references them: `Judge Form`, `Build Context`, `Parse + Safety`, `Validate Booking`, `Conflict + Alternatives` (the JS calls $('Node Name') — a renamed node breaks the chain).
- Paste each Code node's JS from code/01…06 in order. LLM node = HTTP Request per docs/02 (Groq, model llama-3.3-70b-versatile, JSON mode, temperature 0, system prompt from prompts/llm-system-prompt.txt).
- Build order: form → config read → build context → LLM → parse+safety → calllog read → replay check → route → BOOK branch (validate → provider calendar fetch → conflict → create event → save appointment) → CANCEL branch → HANDOFF/NEEDS_INFO endings → universal CallLog append → Form Ending.
- Activate the workflow and use the production Form URL for tests (test URL is fine during wiring).

## STEP 4 — Test against docs/03 (in order)
Run T1 first (happy-path booking, 16 Nov 10:00 Saanp). Verify: calendar event exists on MMVH-Mr Saanp, Appointments row ACTIVE with event_id, CallLog row BOOKED with the reference. Then run the rest in order. After each test report ONE line to Arsalan: `T<n> PASS` or `T<n> FAIL — <what differed from expected>`. Fix wiring/config yourself when the cause is obvious; if a CODE file looks wrong, do not silently rewrite it — flag it to Arsalan with the failing test id (Muse reviews and issues the corrected file via the repo; you then `git pull`).

## STEP 5 — Report + record
- Keep a running `build-log.md` in a branch named `codex/progress` (never commit to main): timestamps, what is wired, test results, blockers. Push it at each phase change.
- When all core tests pass, export the workflow JSON from n8n into `workflow/mmvh-front-desk.json` on the `codex/progress` branch and tell Arsalan: "CORE GREEN — workflow exported".
- If local n8n or Google OAuth is not fully working by 12:45 PKT, stop Step 1/2 retries and report the Cloud fallback line from Step 1. The clock outranks the platform.
