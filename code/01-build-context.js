const form = $('Judge Form').first().json;
const cfg = {};
for (const item of $input.all()) {
  const r = item.json;
  if (r.setting) cfg[String(r.setting).trim()] = String(r.value ?? '').trim();
}
return [{ json: {
  request_id: form.request_id || '',
  message: form.message || '',
  f_owner: form.owner_name || '',
  f_email: form.email || '',
  f_pet: form.pet_name || '',
  f_species: form.species || '',
  f_service: form.service || '',
  f_requested: form.requested || '',
  config: cfg
}}];
