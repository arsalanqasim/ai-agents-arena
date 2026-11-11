const d = $('Parse + Safety').first().json;
const rows = $input.all().map(i => i.json);
if (!d.reference || !d.email) {
  return [{ json: { ...d, decision: 'STOP', result_status: 'NEEDS_INFO', response: 'To cancel, I need your booking reference and the email used for the booking. Please resend your complete request with a new request ID.' } }];
}
const GENERIC = 'We could not verify this cancellation request. Please check your booking reference and the email used for the booking, then try again.';
const row = rows.find(r => String(r.reference || '').trim() === String(d.reference).trim());
if (!row || String(row.email || '').trim().toLowerCase() !== String(d.email).trim().toLowerCase() || String(row.status || '').toUpperCase() !== 'ACTIVE') {
  return [{ json: { ...d, decision: 'STOP', result_status: 'VERIFICATION_FAILED', response: GENERIC } }];
}
return [{ json: { ...d, decision: 'PROCEED', appt: row, provider: row.provider, event_id: row.event_id, reference: row.reference,
  response: 'Canceled. Reference ' + row.reference + ' — ' + row.pet_name + ', ' + row.service_id + ' on ' + row.start_local + ' (America/Phoenix) has been canceled.' } }];
