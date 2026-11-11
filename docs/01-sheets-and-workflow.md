# MMVH Build Pack 01 — Sheets + Workflow Map + LLM Prompt
Delivered 2026-11-11 ~11:55 PKT. Stack: n8n Cloud. All times America/Phoenix.

## SHEET "MMVH Records" — tabs + headers (row 1, exact)
Config:      setting | value | notes
Appointments: reference | owner_name | email | pet_name | species | service_id | provider | start_local | end_local | event_id | status
CallLog:     request_id | timestamp | message | interpreted_intent | result_status | response | reference

## Config rows (setting | value)
clinic_name | Meow Meow Veterinary Hospital
timezone | America/Phoenix
arena_now | 2026-11-11T09:00
open_time | 09:00
close_time | 17:00
lunch_start | 12:00
lunch_end | 13:00
clinic_days | Mon,Tue,Wed,Thu,Fri
holiday_dates | 2026-11-19
lead_minutes | 60
last_date | 2026-11-25
grid_minutes | 15
S1_name | Wellness Exam
S1_species | dog,cat
S1_provider | Mr Saanp
S1_duration_min | 30
S2_name | Routine Follow-up
S2_species | dog,cat
S2_provider | Mr Saanp
S2_duration_min | 30
S3_name | Exotic Exam
S3_species | rabbit,bird
S3_provider | Miss Loomri
S3_duration_min | 45
Mr Saanp_days | Mon,Tue,Wed,Thu,Fri
Miss Loomri_days | Mon,Wed,Fri
Mr Saanp_calendar | MMVH-Mr Saanp
Miss Loomri_calendar | MMVH-Miss Loomri

## WORKFLOW NODES (build in this order, these names)
1. Judge Form (Form Trigger): fields — request_id (required), message (required, long text), owner_name, email, pet_name, species, service, requested (text; e.g. "16 November 2026 at 10:00") — all optional except first two.
2. Read Config (Google Sheets → MMVH Records / Config, all rows)
3. Build Context (Code): form fields + config dict in one item.
4. LLM Extract (HTTP Request → Groq chat completions, JSON mode, system prompt below). Output JSON merged in next Code node.
5. Parse + Safety (Code): parse LLM JSON; deterministic overrides — medical keyword list forces intent=HANDOFF; injection patterns ("ignore the rules", "list other clients", "i am the manager") force HANDOFF with reason prompt_injection (never reveal records).
6. Read CallLog (Google Sheets, all rows) → Replay Check (Code): same request_id with prior result BOOKED/CANCELED → return stored response; branch ends (log a fresh CallLog row first, allowed by E3).
7. Route (Switch on intent): BOOK / CANCEL / HANDOFF / NEEDS_INFO.
BOOK:
8. Validate Booking (Code — pack 02): missing fields → NEEDS_INFO; unsupported service/species → HANDOFF; slot rule violations → UNAVAILABLE with reason. Generates reference MMVH-#####.
9. Fetch Calendar (Google Calendar Get Many, provider calendar, requested day 00:00 → +4 days 23:59 Phoenix).
10. Conflict + Alternatives (Code — pack 02): overlap incl. all-day block → UNAVAILABLE + up to 3 alternatives (E1); free → continue.
11. Create Event (Google Calendar, provider calendar; summary "S1 Wellness Exam — Milo (dog)"; description ref/owner/email; tz America/Phoenix).
12. Save Appointment (Sheets Append Appointments, status ACTIVE, event_id from 11).
13. Finish BOOKED (Set response text) → Log CallLog → Form Ending (show response).
CANCEL:
14. Find Booking (Sheets Read Appointments → Code): match reference; email compare case-insensitive; not found OR mismatch → generic verification failure text (IDENTICAL both cases), log VERIFICATION_FAILED.
15. Delete Event (Google Calendar Delete, calendar from row provider, event_id from row). Only on success →
16. Mark Canceled (Sheets Update Appointments, match on reference, status=CANCELED) → response → Log CallLog (CANCELED).
HANDOFF: response text (staff will help; no diagnosis) → Log CallLog HANDOFF + reason.
NEEDS_INFO: response lists exactly what is missing → Log CallLog NEEDS_INFO.
Every branch ends: Log CallLog (append: request_id, real timestamp, message, intent, result_status, response, reference) → Form Ending node showing the response text. (Spec also accepts the CallLog response column as the visible response.)

## LLM EXTRACTION SYSTEM PROMPT (paste into HTTP node body, model message)
See chat message — same text.
