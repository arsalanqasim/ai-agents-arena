# MMVH build log

- 2026-11-11 12:06 PKT — Step 0 complete. Cloned the repo at 7adc908 and read the setup guide, workflow docs, test matrix, and LLM prompt.
- 2026-11-11 12:08 PKT — Step 1 server running via npx (n8n 1.123.5, Node.js v22.15.0). Local health check returned HTTP 200. The instance already has an owner and is waiting for Arsalan to sign in.
- 2026-11-11 12:30 PKT — Step 1 complete. Local n8n owner sign-in verified and Arsalan confirmed browser access.
- 2026-11-11 12:37 PKT — Step 2 dedupe verified. Use Muse's two provider calendars and records sheet by the canonical IDs in the workflow. Renamed the second sheet MMVH Records — DUPLICATE IGNORE. Google OAuth pending.
- 2026-11-11 12:51 PKT — Calendar and Sheets APIs enabled and the localhost OAuth client created in the existing Google Cloud project. Both local n8n credential entries are saved and waiting for Arsalan to complete Google consent. Muse's 30-node workflow was pulled and its import notes were read.
- 2026-11-11 12:54 PKT — Prepared an inactive import copy for local n8n with Form Ending compatibility, form response mode, append operations, booking field retention, and cancellation calendar selection. Source workflow and node names preserved. Import and T1 pending Google sign-in.
- 2026-11-11 13:29 PKT — Step 2 complete. Both Google credentials connected after saving the test user. The canonical spreadsheet and both canonical calendar IDs are in the workflow.
- 2026-11-11 13:29 PKT — Step 3 complete. Imported Muse's 30-node workflow, bound all ten Google nodes, and activated the production form at http://localhost:5678/form/mmvh. The installed Form node runs the Form Ending completion action with the original response expression.
- 2026-11-11 13:29 PKT — Step 4 complete. T1–T20 passed in order. T1 initially failed because Groq retired the configured Llama model for this account tier. The retry passed with openai/gpt-oss-120b. T14 passed after enabling the existing Switch fallback and clarifying unsupported-species extraction. The T20 request included 10:00 to exercise the date cutoff.
- 2026-11-11 13:29 PKT — Verified an additional Loomri conflict after extending both Calendar queries through the configured last booking day. The existing 10:00 booking was found and 10:45 was offered first.
- 2026-11-11 13:29 PKT — Step 5 export prepared from the active version. The portable JSON preserves all 30 node names and uses a Groq placeholder and account-specific Google re-binding. The judge email is pending.
- 2026-11-11 13:30 PKT — Reconciled all 20 live CallLog results in order. Muse's supplemental harness passed 29 checks using the installed n8n Luxon dependency and the cloned repo's code directory.
