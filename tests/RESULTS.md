# Logic harness results — 2026-11-11 ~12:20 PKT (Muse, pre-integration)

The exact `code/*.js` files were executed locally under stubbed n8n APIs
(Node 24 + Luxon) against judge-style scenarios. **29 passed, 0 failed.**

Coverage: booking validation (happy path S1/S3, holiday 2026-11-19, Saturday,
Loomri Tuesday, lunch overlap + lunch boundary starts, off-grid start, 60-min
lead incl. exact-boundary, booking horizon 2026-11-25, end-after-close,
species mismatch, missing email, unknown service, 16:30 ends exactly 17:00),
conflict + E1 alternatives (overlap offers 10:30 next, back-to-back allowed,
all-day event blocks the day and alternatives move to the next working day,
empty calendar proceeds), parse safety (medical keywords force HANDOFF even
when the LLM says BOOK, clean booking passes), cancellation (wrong email and
unknown reference return byte-identical generic failures; email match is
case-insensitive), replay E3 (same request_id returns the prior BOOKED result;
a new request_id proceeds).

Run it: `cd tests && npm i luxon && node harness.js` (expects ../code/*.js).
Note: the harness caught two of its own wiring mistakes before it caught any
product bug — final shipped code was unchanged; verdicts above are on the
exact files in `code/`.
