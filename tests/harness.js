// Local harness: runs the exact repo code/*.js under stubbed n8n APIs.
const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');
const CODE = path.join(__dirname, '..', 'repo-push', 'code');
const load = (f) => fs.readFileSync(path.join(CODE, f), 'utf8');

function runNode(file, store, inputJson, inputAll) {
  const $ = (name) => ({
    first: () => ({ json: store[name] }),
    all: () => (store[name + '__all'] || []).map((j) => ({ json: j })),
  });
  const $input = {
    first: () => ({ json: inputJson }),
    all: () => (inputAll || []).map((j) => ({ json: j })),
  };
  const fn = new Function('$', '$input', 'DateTime', load(file));
  const out = fn($, $input, DateTime);
  return out[0].json;
}

// --- Config rows exactly as the Sheet returns them (all strings) ---
const cfgRows = [
  ['setting', 'value'], ['clinic_name', 'Meow Meow Veterinary Hospital'], ['timezone', 'America/Phoenix'],
  ['arena_now', '2026-11-11T09:00'], ['open_time', '09:00'], ['close_time', '17:00'],
  ['lunch_start', '12:00'], ['lunch_end', '13:00'],
  ['clinic_days', 'Mon,Tue,Wed,Thu,Fri'], ['holiday_dates', '2026-11-19'],
  ['lead_minutes', '60'], ['last_date', '2026-11-25'], ['grid_minutes', '15'],
  ['S1_name', 'Wellness Exam'], ['S1_species', 'dog,cat'], ['S1_provider', 'Mr Saanp'], ['S1_duration_min', '30'],
  ['S2_name', 'Routine Follow-up'], ['S2_species', 'dog,cat'], ['S2_provider', 'Mr Saanp'], ['S2_duration_min', '30'],
  ['S3_name', 'Exotic Exam'], ['S3_species', 'rabbit,bird'], ['S3_provider', 'Miss Loomri'], ['S3_duration_min', '45'],
  ['Mr Saanp_days', 'Mon,Tue,Wed,Thu,Fri'], ['Miss Loomri_days', 'Mon,Wed,Fri'],
  ['Mr Saanp_calendar', 'MMVH-Mr Saanp'], ['Miss Loomri_calendar', 'MMVH-Miss Loomri'],
].map(([setting, value]) => ({ setting, value }));

const form = { request_id: 'H-1', message: 'test', owner_name: '', email: '', pet_name: '', species: '', service: '', date: '', time: '', reference: '' };
const ctx = runNode('01-build-context.js', { 'Judge Form': form }, {}, cfgRows);

let pass = 0, fail = 0;
function check(id, cond, label, extra) {
  if (cond) { pass++; console.log(`PASS ${id} ${label}`); }
  else { fail++; console.log(`FAIL ${id} ${label}${extra ? ' :: ' + extra : ''}`); }
}
const base = { intent: 'BOOK', owner_name: 'Alex Khan', email: 'test@example.com', pet_name: 'Milo', species: 'dog', service_id: 'S1', date: '2026-11-16', time: '10:00', reference: null, reason: '', conflicts: [] };
function validate(over) {
  const p = { ...ctx, ...base, ...over };
  return runNode('04-validate-booking.js', { 'Build Context': ctx, 'Parse + Safety': p }, p, []);
}

let v;
v = validate({}); check('V1', v.decision === 'PROCEED' && v.provider === 'Mr Saanp' && v.endISO === '2026-11-16T10:30:00-07:00', 'S1 Mon 16 Nov 10:00 proceeds, ends 10:30', JSON.stringify(v));
v = validate({ date: '2026-11-19' }); check('V2', v.decision === 'STOP' && /holiday/.test(v.response), 'holiday 19 Nov blocked', v.response);
v = validate({ date: '2026-11-14' }); check('V3', v.decision === 'STOP' && /closed/.test(v.response), 'Saturday blocked', v.response);
v = validate({ service_id: 'S3', species: 'rabbit', date: '2026-11-17' }); check('V4', v.decision === 'STOP' && /does not see patients/.test(v.response), 'Loomri Tuesday blocked', v.response);
v = validate({ time: '12:15' }); check('V5', v.decision === 'STOP' && /lunch/.test(v.response), 'lunch overlap blocked', v.response);
v = validate({ time: '10:07' }); check('V6', v.decision === 'STOP' && /15-minute/.test(v.response), 'off-grid blocked', v.response);
v = validate({ date: '2026-11-11', time: '09:30' }); check('V7', v.decision === 'STOP' && /60 minutes/.test(v.response), 'lead time blocked', v.response);
v = validate({ date: '2026-11-26' }); check('V8', v.decision === 'STOP' && /booking through 2026-11-25/.test(v.response), 'past horizon blocked', v.response);
v = validate({ service_id: 'S3', species: 'bird', date: '2026-11-20', time: '16:30' }); check('V9', v.decision === 'STOP' && /outside clinic hours/.test(v.response), 'S3 16:30 ends after close blocked', v.response);
v = validate({ species: 'rabbit' }); check('V10', v.decision === 'STOP' && v.reason === 'unsupported_species', 'S1 rabbit species blocked', v.response);
v = validate({ email: null }); check('V11', v.result_status === 'NEEDS_INFO' && /email/.test(v.response), 'missing email -> NEED_INFO', v.response);
v = validate({ service_id: 'S9' }); check('V12', v.decision === 'STOP', 'unknown service blocked', v.response);
v = validate({ service_id: 'S3', species: 'rabbit', date: '2026-11-18', time: '10:00' }); check('V13', v.decision === 'PROCEED' && v.endISO === '2026-11-18T10:45:00-07:00', 'S3 Wed proceeds, 45 min', JSON.stringify(v));
v = validate({ date: '2026-11-25' }); check('V14', v.decision === 'PROCEED', 'last date 25 Nov proceeds', JSON.stringify(v));
v = validate({ date: '2026-11-11', time: '10:00' }); check('V15', v.decision === 'PROCEED', 'exactly +60min lead proceeds', JSON.stringify(v));
v = validate({ date: '2026-11-16', time: '16:30' }); check('V16', v.decision === 'PROCEED', 'S1 16:30 ends exactly 17:00 proceeds', JSON.stringify(v));
v = validate({ date: '2026-11-16', time: '11:30' }); check('V17', v.decision === 'PROCEED', 'S1 11:30 ends exactly at lunch start proceeds', JSON.stringify(v));
v = validate({ date: '2026-11-16', time: '13:00' }); check('V18', v.decision === 'PROCEED', 'start exactly at lunch end proceeds', JSON.stringify(v));

function conflict(parsed, valOver, events) {
  const p = { ...ctx, ...base, ...parsed };
  const store = { 'Build Context': ctx, 'Parse + Safety': p };
  const val = runNode('04-validate-booking.js', store, p, []);
  Object.assign(val, valOver || {});
  store['Validate Booking'] = val;
  return runNode('05-conflict-alternatives.js', store, val, events);
}
const ev = (s, e) => ({ summary: 'Busy', start: { dateTime: s }, end: { dateTime: e } });
let c;
c = conflict({}, {}, [ev('2026-11-16T10:00:00-07:00', '2026-11-16T10:30:00-07:00')]);
check('C1', c.decision === 'STOP' && c.result_status === 'UNAVAILABLE' && c.response.includes('2026-11-16 at 10:30'), 'overlap -> UNAVAILABLE + first alternative 10:30', c.response);
c = conflict({ time: '10:30' }, {}, [ev('2026-11-16T10:00:00-07:00', '2026-11-16T10:30:00-07:00')]);
check('C2', c.decision === 'PROCEED', 'back-to-back allowed', c.decision + ' ' + (c.response||''));
c = conflict({}, {}, [{ summary: 'Closed', start: { date: '2026-11-16' }, end: { date: '2026-11-17' } }]);
check('C3', c.decision === 'STOP' && !c.response.includes('2026-11-16 at') && c.response.includes('2026-11-17 at'), 'all-day block: alternatives move to 17 Nov', c.response);
c = conflict({}, {}, []);
check('C4', c.decision === 'PROCEED', 'empty calendar -> proceeds', c.decision);

// Parse + Safety: medical and injection phrases
function parseMsg(msg, llm) {
  const store = { 'Build Context': { ...ctx, message: msg } };
  return runNode('02-parse-safety.js', store, { choices: [{ message: { content: JSON.stringify(llm) } }] }, []);
}
let pm = parseMsg('x', { ...base, intent: 'HANDOFF', reason: 'medical question' });
check('P1', pm.intent === 'HANDOFF', 'LLM handoff passes through', JSON.stringify(pm));
let pm2 = parseMsg('x', { ...base, intent: 'BOOK' });
check('P2', pm2.intent === 'BOOK' && pm2.species === 'dog', 'clean booking passes', JSON.stringify(pm2));
// medical text where LLM wrongly says BOOK: message comes via ctx? Parse reads input message only from llm json; safety scans llm fields + reason. simulate via reason containing symptom word:
let pm3 = parseMsg('my cat is vomiting and not eating', { ...base, intent: 'BOOK' });
check('P3', pm3.intent === 'HANDOFF' && pm3.reason === 'medical_or_urgent', 'medical keyword in fields forces HANDOFF', JSON.stringify(pm3));

// Find Booking: wrong email vs unknown ref must give identical text
const apptRow = { reference: 'MMVH-10001', owner_name: 'Alex Khan', email: 'Test@Example.com', pet_name: 'Milo', species: 'dog', service_id: 'S1', provider: 'Mr Saanp', start_local: '2026-11-16 10:00', end_local: '2026-11-16 10:30', event_id: 'evt123', status: 'ACTIVE' };
function find(ref, email) {
  const p = { ...ctx, ...base, intent: 'CANCEL', reference: ref, email };
  return runNode('06-find-booking.js', { 'Parse + Safety': p }, p, [apptRow]);
}
const f1 = find('MMVH-10001', 'wrong@example.com');
const f2 = find('MMVH-99999', 'test@example.com');
check('F1', f1.result_status === 'VERIFICATION_FAILED' && f2.result_status === 'VERIFICATION_FAILED' && f1.response === f2.response, 'cancel failures identical text', f1.response + ' || ' + f2.response);
const f3 = find('MMVH-10001', 'test@example.com');
check('F2', f3.decision === 'PROCEED' && f3.event_id === 'evt123', 'cancel match is case-insensitive on email', JSON.stringify(f3));

// Replay check
const priorLog = [{ request_id: 'H-1', result_status: 'BOOKED', response: 'Booked. Reference MMVH-10001.', reference: 'MMVH-10001' }];
const rp = runNode('03-replay-check.js', { 'Parse + Safety': { ...ctx, ...base, request_id: 'H-1' } }, {}, priorLog);
check('R1', rp.replay === true && rp.result_status === 'BOOKED', 'replay returns prior result', JSON.stringify(rp));
const rp2 = runNode('03-replay-check.js', { 'Parse + Safety': { ...ctx, ...base, request_id: 'NEW-9' } }, {}, priorLog);
check('R2', rp2.replay === false, 'new request_id is not a replay', JSON.stringify(rp2));

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
