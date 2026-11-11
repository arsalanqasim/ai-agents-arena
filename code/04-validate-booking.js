const d = $input.first().json;
const cfg = d.config;
function stop(status, response, extra = {}) {
  return [{ json: { ...d, decision: 'STOP', result_status: status, response, ...extra } }];
}
if (d.conflict) return stop('NEEDS_INFO', 'Some details in your form and message do not match. Please tell me which is correct, then resend your complete request with a new request ID.');
const missing = [];
if (!d.owner_name) missing.push('your name');
if (!d.email || !String(d.email).includes('@')) missing.push('a valid email');
if (!d.pet_name) missing.push('pet name');
if (!d.species) missing.push('species (dog, cat, rabbit or bird)');
if (!d.service_id) missing.push('service (Wellness Exam, Routine Follow-up or Exotic Exam)');
if (!d.date) missing.push('the exact date');
if (!d.time) missing.push('the exact start time');
if (missing.length) return stop('NEEDS_INFO', 'I can book that once I have: ' + missing.join(', ') + '. Please resend your complete request with a new request ID including these details.');
const sid = String(d.service_id).toUpperCase();
const speciesList = String(cfg[sid + '_species'] || '').split(',').map(s => s.trim().toLowerCase());
const provider = cfg[sid + '_provider'];
const serviceName = cfg[sid + '_name'];
const duration = parseInt(cfg[sid + '_duration_min'] || '30', 10);
if (!provider) return stop('HANDOFF', 'That service is not one we offer. I have flagged this for our staff, who will help you.', { reason: 'unsupported_service' });
if (!speciesList.includes(String(d.species).toLowerCase())) return stop('HANDOFF', 'We cannot book a ' + serviceName + ' for a ' + d.species + ' — that service covers ' + speciesList.join(' and ') + '. I have flagged this for our staff, who will help you.', { reason: 'unsupported_species' });
// date/time math — Phoenix is fixed UTC-07:00 (no DST)
const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const [Y, M, DD] = String(d.date).split('-').map(Number);
const [hh, mm] = String(d.time).split(':').map(Number);
const startMin = hh * 60 + mm;
const endMin = startMin + duration;
const wd = days[new Date(Date.UTC(Y, M - 1, DD)).getUTCDay()];
const toMin = t => { const [a,b] = String(t).split(':').map(Number); return a*60 + b; };
const open = toMin(cfg.open_time || '09:00'), close = toMin(cfg.close_time || '17:00');
const lunchS = toMin(cfg.lunch_start || '12:00'), lunchE = toMin(cfg.lunch_end || '13:00');
const grid = parseInt(cfg.grid_minutes || '15', 10);
const startMs = Date.parse(d.date + 'T' + d.time + ':00-07:00');
const arenaMs = Date.parse((cfg.arena_now || '2026-11-11T09:00') + ':00-07:00');
const lead = parseInt(cfg.lead_minutes || '60', 10);
if (String(cfg.holiday_dates || '').split(',').map(s=>s.trim()).includes(d.date)) return stop('UNAVAILABLE', 'The clinic is closed on ' + d.date + ' for a holiday. Please choose another date.');
if (!String(cfg.clinic_days || '').split(',').map(s=>s.trim()).includes(wd)) return stop('UNAVAILABLE', 'The clinic is closed on ' + wd + 's. We are open Monday to Friday, 09:00–17:00. Please choose a weekday.');
if (d.date > (cfg.last_date || '2026-11-25')) return stop('UNAVAILABLE', 'We are only booking through ' + (cfg.last_date || '2026-11-25') + ' right now. Please choose a date on or before then.');
if (startMs < arenaMs + lead * 60000) return stop('UNAVAILABLE', 'Appointments need at least ' + lead + ' minutes of lead time. The earliest bookable start is 60 minutes from 09:00 on 11 November. Please choose a later time.');
if (mm % grid !== 0) return stop('UNAVAILABLE', 'Appointment starts run on a 15-minute grid (:00, :15, :30, :45). Please pick a start time on the grid.');
const provDays = String(cfg[provider + '_days'] || cfg.clinic_days || '').split(',').map(s=>s.trim());
if (!provDays.includes(wd)) return stop('UNAVAILABLE', provider + ' does not see patients on ' + wd + 's. Please choose a day when ' + provider + ' is in.');
if (startMin < open || endMin > close) return stop('UNAVAILABLE', 'That appointment would fall outside clinic hours (09:00–17:00). It needs ' + duration + ' minutes inside those hours. Please choose another time.');
if (startMin < lunchE && endMin > lunchS) return stop('UNAVAILABLE', 'That time overlaps the lunch break (12:00–13:00). Please choose a time outside lunch.');
const fmt = mins => String(Math.floor(mins/60)).padStart(2,'0') + ':' + String(mins%60).padStart(2,'0');
const reference = 'MMVH-' + Math.floor(10000 + Math.random() * 89999);
return [{ json: { ...d, decision: 'PROCEED', provider, service_id: sid, service_name: serviceName, duration_min: duration,
  start_local: d.date + ' ' + d.time, end_local: d.date + ' ' + fmt(endMin),
  startISO: d.date + 'T' + d.time + ':00-07:00', endISO: d.date + 'T' + fmt(endMin) + ':00-07:00',
  weekday: wd, reference } }];
