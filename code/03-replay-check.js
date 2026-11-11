const d = $('Parse + Safety').first().json;
const rows = $input.all().map(i => i.json);
const prior = rows.find(r => String(r.request_id) === String(d.request_id) && ['BOOKED','CANCELED'].includes(String(r.result_status || '').toUpperCase()));
if (prior) {
  return [{ json: { ...d, replay: true, result_status: prior.result_status, response: prior.response, reference: prior.reference || '' } }];
}
return [{ json: { ...d, replay: false } }];
