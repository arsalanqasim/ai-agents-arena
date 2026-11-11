# Extra (beyond the statement) — MMVH Live Dashboard workflow
A separate, tiny workflow. It never touches the production front-desk workflow.
Purpose: during evaluation, judges watch bookings/handoffs/refusals appear live on a
clinic "front desk screen" — Demo + Innovation surface, zero risk to the core.

Nodes (in order):
1. **Dashboard Webhook** — Webhook node, GET, path `mmvh-dashboard`, Response Mode = "Using 'Respond to Webhook' node".
2. **Read Appointments** — Google Sheets read, spreadsheet = MMVH Records (canonical ID in workflow/IMPORT-NOTES.md), sheet Appointments, Always Output Data ON, same Google credential as production.
3. **Read CallLog** — Google Sheets read, sheet CallLog, Always Output Data ON. (NOTE: name it exactly "Read CallLog" — production already uses that name in its own workflow; names only need to be unique within THIS workflow. The Dashboard Build code also references $('Read Appointments').)
4. **Dashboard Build** — Code node, contents = `extras/dashboard-build.js` from the repo.
5. **Respond** — Respond to Webhook node: Respond With = Text, Response Body = `={{ $json.html }}`, Response Content-Type = `text/html`.

Activate it. URL: http://localhost:5678/webhook/mmvh-dashboard
Verify: open it — you should see stat cards + upcoming appointments + recent activity, refreshing every 15s. Keep this tab open on the desk during evaluation next to the form.
