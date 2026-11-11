# Judge Q&A — likely questions, honest 2-line answers

**Why an LLM at all — why not just a form with dropdowns?**
Because owners write like humans ("book Milo tomorrow at 10"), not like databases. The LLM only translates language into structured data; every decision after that is deterministic code, so it can't hallucinate a booking.

**What stops the LLM from inventing an appointment?**
It has no write access. It outputs JSON fields (or nulls). Code validates every field against the Config rules and the live calendar before anything is created. Missing or vague = it asks, never guesses.

**What if the LLM/API goes down mid-evaluation?**
The HTTP node can be repointed to Gemini (same JSON contract) in one edit. Everything else — rules, calendar, sheets — is independent of which LLM parses.

**How does cancellation prevent abuse?**
Reference + the booking email must match (case-insensitive). Wrong email and unknown reference return the identical generic failure, so responses leak nothing. The event is deleted before we confirm, and the row is retained as CANCELED for audit.

**How do you handle a judge adding a manual event to the calendar?**
Every booking re-reads the provider's calendar for the exact window. Any overlapping event counts — manual staff meetings included; an all-day event blocks the whole day; back-to-back is allowed.

**What about the T+90 Config change (E4)?**
Config is read from the Sheet at the start of every execution — durations, hours, holidays. Change S3_duration_min and the very next request uses it; existing appointments keep their booked duration. No workflow edit.

**Did you implement rescheduling (E2)?**
[Answer honestly based on the freeze state.] Design: verify reference+email like cancel, validate the new slot like a booking while ignoring the appointment's own current event, then move the event and update the same row keeping the reference — a failed move leaves the original untouched.

**What does the CallLog give you?**
Every request and outcome — including rejections, handoffs and replays — with timestamps. It's the audit trail that proves nothing was silently dropped or double-booked.

**How did you test?**
Two layers: a unit harness ran the decision code through 29 scenarios before integration (tests/RESULTS.md), then 20 live end-to-end tests against the real calendar and sheet, all passing.

**What's the weakest point?**
If Google Calendar itself errors during creation, the run reports failure rather than claiming success (by design), but the automatic compensation branch (flagging NEEDS_ATTENTION) is the next hardening step.
