const d = $('Validate Booking').first().json;
const cfg = d.config;
const startMs = Date.parse(d.startISO), endMs = Date.parse(d.endISO);
const events = $input.all().map(i => i.json).map(ev => {
  const s = (ev.start && (ev.start.dateTime || ev.start.date)) || ev.start;
  const e = (ev.end && (ev.end.dateTime || ev.end.date)) || ev.end;
  if (!s) return null;
  const allDay = typeof s === 'string' && s.length === 10;
  const sMs = allDay ? Date.parse(s + 'T00:00:00-07:00') : Date.parse(s);
  const eMs = allDay ? Date.parse(s + 'T23:59:59-07:00') : Date.parse(e);
  return { sMs, eMs };
}).filter(Boolean);
const overlaps = (a, b) => events.some(ev => ev.sMs < b && ev.eMs > a);
if (!overlaps(startMs, endMs)) {
  return [{ json: { ...d, decision: 'PROCEED' } }];
}
// E1 alternatives: scan from requested start, then next working days, up to 2 more working days
const dur = d.duration_min, grid = parseInt(cfg.grid_minutes || '15', 10);
const toMin = t => { const [a,b] = String(t).split(':').map(Number); return a*60 + b; };
const open = toMin(cfg.open_time || '09:00'), close = toMin(cfg.close_time || '17:00');
const lunchS = toMin(cfg.lunch_start || '12:00'), lunchE = toMin(cfg.lunch_end || '13:00');
const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const provDays = String(cfg[d.provider + '_days'] || cfg.clinic_days || '').split(',').map(s=>s.trim());
const holidays = String(cfg.holiday_dates || '').split(',').map(s=>s.trim());
const alts = [];
let dayMs = Date.parse(d.date + 'T00:00:00-07:00');
let workingSeen = 0;
for (let dayOffset = 0; dayOffset < 7 && workingSeen < 3 && alts.length < 3; dayOffset++) {
  const cur = new Date(dayMs + dayOffset * 86400000);
  const dateStr = cur.toISOString().slice(0, 10);
  const wd = days[new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate())).getUTCDay()];
  const isClinicDay = String(cfg.clinic_days || '').split(',').map(s=>s.trim()).includes(wd);
  if (!isClinicDay || holidays.includes(dateStr) || !provDays.includes(wd)) continue;
  workingSeen++;
  const firstMin = (dayOffset === 0) ? (Math.floor((d.time.split(':').map(Number)[0]*60 + d.time.split(':').map(Number)[1]) / grid) + 1) * grid : open;
  for (let m = Math.max(firstMin, open); m + dur <= close && alts.length < 3; m += grid) {
    if (m < lunchE && m + dur > lunchS) continue;
    const sMs = Date.parse(dateStr + 'T' + String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0') + ':00-07:00');
    if (sMs < Date.parse((cfg.arena_now || '2026-11-11T09:00') + ':00-07:00') + parseInt(cfg.lead_minutes || '60', 10) * 60000) continue;
    if (dateStr > (cfg.last_date || '2026-11-25')) continue;
    if (!overlaps(sMs, sMs + dur * 60000)) {
      alts.push(dateStr + ' at ' + String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0'));
    }
  }
}
const altText = alts.length ? ' The next available starts with ' + d.provider + ' are: ' + alts.join('; ') + '. Reply with a new request ID choosing one of these, or tell me another time.' : ' Please ask for another time.';
return [{ json: { ...d, decision: 'STOP', result_status: 'UNAVAILABLE',
  response: 'Sorry — ' + d.provider + ' is already booked at ' + d.time + ' on ' + d.date + ', so that slot is unavailable.' + altText } }];
