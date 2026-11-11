// Telegram Extract — Code node in the MMVH Telegram workflow.
// Input: the HTTP Request node's response — the n8n form completion HTML page
// (our Form Ending message is rendered inside it). Output: { reply } text to send back.
const raw = $input.first().json;
const html = typeof raw === 'string' ? raw : (raw.data || raw.body || JSON.stringify(raw));
// Layer 1: completion container commonly carries the message in a heading/div —
// grab any of our known response starters and take text from there to the end of that block.
const starters = ['Booked. Reference', 'Rescheduled. Reference', 'Canceled. Reference', 'Sorry', 'I can book that once', 'I need a bit more information', 'I cannot help with that', 'We could not verify', 'To cancel, I need', 'That service is not one we offer', 'We cannot book', 'The clinic is closed', 'Miss Loomri does not', 'Mr Saanp is already booked', 'already booked'];
const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
let reply = '';
for (const s of starters) {
  const i = text.indexOf(s);
  if (i >= 0) {
    let chunk = text.slice(i, i + 700);
    const cut = chunk.search(/<\/(div|p|h1|h2|section)>/i);
    if (cut > 40) chunk = chunk.slice(0, cut);
    reply = chunk.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
    if (reply.length > 25) break;
    reply = '';
  }
}
if (!reply) {
  reply = 'Your request was received by the Meow Meow front desk and logged. Please check with the team for the result, or use the desk form for an instant reply.';
}
return [{ json: { reply } }];
