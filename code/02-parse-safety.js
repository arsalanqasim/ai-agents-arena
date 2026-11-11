const ctx = $('Build Context').first().json;
const raw = $input.first().json;
let content = (raw.choices && raw.choices[0] && raw.choices[0].message && raw.choices[0].message.content) || '{}';
let p;
try { p = JSON.parse(content); } catch (e) { p = { intent: 'NEEDS_INFO', reason: 'parse_error' }; }
const msg = (ctx.message || '').toLowerCase();
const medical = ['sick','vomit','bleeding','blood','fever','not eating','limping','injur','pain','medicine','medication','dose','dosage','diagnos','symptom','emergency','urgent','breathing','seizure','poison','swollen','diarrhea','lethargic','unconscious','ate chocolate','broken'];
const injection = ['ignore the rules','ignore your instructions','ignore all instructions','list other clients','other clients','i am the manager',"i'm the manager",'i am the owner of this clinic','show me all bookings','all appointments','bypass'];
let intent = String(p.intent || 'NEEDS_INFO').toUpperCase();
let reason = p.reason || '';
if (medical.some(w => msg.includes(w))) { intent = 'HANDOFF'; reason = 'medical_or_urgent'; }
if (injection.some(w => msg.includes(w))) { intent = 'HANDOFF'; reason = 'policy_bypass_attempt'; }
// merge structured fields; conflict on same detail -> null + NEEDS_INFO
let conflict = (reason === 'conflict');
function merge(llmVal, formVal) {
  const a = (llmVal === null || llmVal === undefined || llmVal === '') ? null : String(llmVal);
  const b = (!formVal) ? null : String(formVal);
  if (a && b && a.toLowerCase() !== b.toLowerCase()) { conflict = true; return null; }
  return a || b;
}
const out = {
  ...ctx,
  intent,
  reason,
  conflict,
  owner_name: merge(p.owner_name, ctx.f_owner),
  email: merge(p.email, ctx.f_email),
  pet_name: merge(p.pet_name, ctx.f_pet),
  species: p.species ? String(p.species).toLowerCase() : (ctx.f_species ? ctx.f_species.toLowerCase() : null),
  service_id: p.service_id || null,
  date: p.date || null,
  time: p.time || null,
  reference: p.reference || null
};
if (conflict && intent === 'BOOK') { out.intent = 'NEEDS_INFO'; out.reason = 'conflicting_details'; }
return [{ json: out }];
