# Import notes — workflow/mmvh-front-desk.json (built + validated by Muse on a VM n8n 2.47, 2026-11-11 ~12:35 PKT)

The workflow (30 nodes) was generated from `code/*.js` + `docs/` and accepted by a real
n8n server with no node errors. Import it (Workflows → Import from File) instead of
hand-building; then finish the account-specific wiring below.

## Already wired to real assets (Muse created them on arsalanqasim400@gmail.com)
- Spreadsheet **MMVH Records** id `1jpMCBJ6WPg6YjQSSqdfUdIZg52WUkqYPdze0FvldFHQ` — Config (29 rows), Appointments + CallLog headers already written. All Sheets nodes point at this ID.
- Calendars **MMVH-Mr Saanp** `bfde539ee26e92ad1afe60ecd1eb43e64aba84f02fe145fd74c9fe78893ed25e@group.calendar.google.com` and **MMVH-Miss Loomri** `bd4bf70bb096946768ef1627065f0c5d55ca725a4ed47011f83548de30db6670@group.calendar.google.com` — Fetch/Create/Delete nodes point at these IDs.

## You must finish (in order)
1. Create the Google OAuth credential in this n8n (per CODEX-SETUP-PROMPT Step 2) and assign it to ALL Google Sheets + Google Calendar nodes (10 nodes). After assigning, open one Sheets node and one Calendar node and confirm the document/calendar pickers show the assets above; if a sheet name shows unresolved, re-pick the tab by name (Config / Appointments / CallLog).
2. LLM Extract node: replace `PASTE_GROQ_KEY_HERE` in the Authorization header with the real Groq key (from Arsalan).
3. Activate the workflow. Production form URL: http://localhost:5678/form/mmvh
4. Run docs/03 tests in order, starting T1. Report each as T<n> PASS/FAIL to Arsalan.

## Design notes
- Every branch converges on **Finalize → Log CallLog → Form Ending**, so every request (including replays and rejections) is logged, and the form shows the item's `response`.
- Read CallLog / Read Appointments / Fetch-events nodes have **Always Output Data** on: an empty sheet/calendar still emits one item so downstream Code nodes run on first use.
- Known simplification vs docs/02: if Create Calendar Event itself errors, the run errors visibly (no NEEDS_ATTENTION compensation branch yet). Add only if the core matrix is green and time remains.
- Node names are load-bearing (Code nodes reference $('Validate Booking') etc.) — do not rename.
