// Dashboard Build — Code node for the MMVH Live Dashboard workflow.
// Reads all Appointments + CallLog rows via $('...') and returns one item { html }.
const appts = $('Read Appointments').all().map(i => i.json);
const logs = $('Read CallLog').all().map(i => i.json);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const count = (rows, key, val) => rows.filter(r => String(r[key] || '').toUpperCase() === val).length;
const stats = {
  total: logs.length,
  booked: count(logs, 'result_status', 'BOOKED'),
  canceled: count(logs, 'result_status', 'CANCELED'),
  rescheduled: count(logs, 'result_status', 'RESCHEDULED'),
  unavailable: count(logs, 'result_status', 'UNAVAILABLE'),
  handoff: count(logs, 'result_status', 'HANDOFF'),
  needsInfo: count(logs, 'result_status', 'NEEDS_INFO'),
  active: appts.filter(r => String(r.status || '').toUpperCase() === 'ACTIVE').length,
};
const upcoming = appts.filter(r => String(r.status || '').toUpperCase() === 'ACTIVE')
  .sort((a, b) => String(a.start_local).localeCompare(String(b.start_local)));
const recent = [...logs].reverse().slice(0, 12);
const nowStr = new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix', dateStyle: 'medium', timeStyle: 'medium' });
const card = (label, val, color) => `<div style="flex:1;min-width:130px;background:#fff;border-radius:14px;padding:16px 18px;box-shadow:0 2px 10px rgba(0,0,0,.08)"><div style="font-size:30px;font-weight:800;color:${color}">${val}</div><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#667">${label}</div></div>`;
const apptRows = upcoming.map(r => `<tr><td>${esc(r.start_local)}</td><td>${esc(r.pet_name)} (${esc(r.species)})</td><td>${esc(r.service_id)}</td><td>${esc(r.provider)}</td><td>${esc(r.owner_name)}</td><td><code>${esc(r.reference)}</code></td></tr>`).join('');
const logRows = recent.map(r => `<tr><td>${esc(String(r.timestamp || '').slice(0, 19).replace('T', ' '))}</td><td>${esc(r.interpreted_intent)}</td><td><b>${esc(r.result_status)}</b></td><td>${esc(String(r.message || '').slice(0, 90))}</td><td><code>${esc(r.reference || '')}</code></td></tr>`).join('');
const html = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="15">
<title>MMVH — Live Front Desk</title></head>
<body style="margin:0;font-family:system-ui,Segoe UI,Arial;background:#f2f5f9;color:#123">
<div style="max-width:1060px;margin:0 auto;padding:22px">
<div style="display:flex;align-items:baseline;gap:12px"><h1 style="margin:0;font-size:26px">🐾 Meow Meow Veterinary Hospital</h1><span style="color:#567">Live Front Desk — auto-refresh 15s · ${esc(nowStr)} (Phoenix)</span></div>
<div style="display:flex;gap:12px;flex-wrap:wrap;margin:18px 0">
${card('Requests handled', stats.total, '#1450a0')}${card('Booked', stats.booked, '#1a8f4a')}${card('Active appointments', stats.active, '#1a8f4a')}${card('Canceled', stats.canceled, '#b06000')}${card('Rescheduled', stats.rescheduled, '#6a3fb5')}${card('Turned away (slot/rules)', stats.unavailable, '#b06000')}${card('Handed to staff', stats.handoff, '#c0392b')}${card('Asked for info', stats.needsInfo, '#567')}
</div>
<h2 style="font-size:18px;margin:20px 0 8px">Upcoming appointments</h2>
<table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.06)">
<tr style="background:#1450a0;color:#fff;text-align:left"><th style="padding:9px">When (Phoenix)</th><th>Pet</th><th>Service</th><th>Provider</th><th>Owner</th><th>Reference</th></tr>
${apptRows || '<tr><td colspan="6" style="padding:12px">No active appointments.</td></tr>'}
</table>
<h2 style="font-size:18px;margin:22px 0 8px">Recent front-desk activity</h2>
<table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.06)">
<tr style="background:#33475b;color:#fff;text-align:left"><th style="padding:9px">Time (UTC)</th><th>Intent</th><th>Result</th><th>Message</th><th>Reference</th></tr>
${logRows || '<tr><td colspan="5" style="padding:12px">No requests yet.</td></tr>'}
</table>
<p style="color:#789;font-size:12px;margin-top:14px">Every request — including refusals, handoffs and attacks — is logged. Nothing is silently dropped.</p>
</div></body></html>`;
return [{ json: { html } }];
