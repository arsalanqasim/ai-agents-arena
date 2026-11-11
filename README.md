# AI Agents Arena — Meow Meow Veterinary Hospital Front Desk

Team build for CUI Tech Fest 2026, AI Agents Arena 2.0 (Wed 2026-11-11, build 11:30–14:30 PKT).
All contents created during the round.

## What this is
An n8n workflow that acts as the front desk of a fictional veterinary hospital:
takes a pet owner's free-text request (form), uses an LLM to interpret it, checks real
Google Calendar availability, books/cancels real appointments, and logs every request
in Google Sheets. Guardrails: no medical advice (staff handoff), prompt-injection
resistance, never invent bookings, generic verification failure for cancellations.

## Layout
- `docs/01-sheets-and-workflow.md` — Google Sheet schemas (Config / Appointments / CallLog), Config rows, node-by-node workflow map.
- `docs/02-code-nodes.md` — full build notes incl. LLM HTTP node settings, branch wiring, CallLog mapping.
- `docs/03-test-cases.md` — judge-style test matrix with expected results.
- `code/*.js` — the exact JavaScript for each n8n Code node, numbered in build order.
- `prompts/llm-system-prompt.txt` — the LLM extraction/classification system prompt.
- `CODEX-SETUP-PROMPT.md` — the onboarding + build prompt for the Codex desktop agent on the operator's laptop.

## Stack decisions (locked)
- Platform: n8n (local instance run by Codex on the operator laptop; n8n Cloud is the fallback if local is not up by 12:45 PKT).
- LLM: Groq `openai/gpt-oss-120b` via its OpenAI-compatible endpoint, JSON mode, temperature 0. Gemini is the backup LLM.
- Data: Google Calendar calendars `MMVH-Mr Saanp` and `MMVH-Miss Loomri`; Google Sheet `MMVH Records`.
- Business clock: ARENA_NOW = 2026-11-11 09:00 America/Phoenix (fixed UTC-07:00). Config is read from the Sheet at the start of every execution (extension E4).
- Extensions implemented in design: E1 alternatives, E3 replay protection, E4 live config. E2 reschedule only if time remains after the core is green.

## Rules core (from the problem statement)
Mon–Fri 09:00–17:00, lunch 12:00–13:00, holiday closure 2026-11-19, 15-minute grid,
≥60 min lead from ARENA_NOW, last date 2026-11-25. S1 Wellness Exam + S2 Routine
Follow-up: dog/cat, Mr Saanp, 30 min. S3 Exotic Exam: rabbit/bird, Miss Loomri
(Mon/Wed/Fri), 45 min. Cancellation: reference + matching email (case-insensitive);
unknown reference and wrong email return the identical generic failure.
