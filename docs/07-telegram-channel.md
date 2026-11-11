# Extra — Telegram channel for the front desk (separate workflow, production untouched)

## The one experiment everything depends on (10 min, do FIRST)
The production entry is an n8n Form. Test whether it accepts a programmatic POST:
- Scratch workflow: Manual Trigger → HTTP Request: POST http://localhost:5678/form/mmvh,
  Body Content Type = Form Urlencoded, fields: request_id=BRIDGE-01, message="Book a wellness
  exam for my dog Milo on 16 November 2026 at 10:00", owner_name="Bridge Test",
  email="test@example.com", pet_name="Milo", species="dog", service="Wellness Exam".
- PASS = the response HTML contains "Booked. Reference" (then cancel BRIDGE-01's booking
  via the normal form so the board stays clean). FAIL = stop; Telegram falls back to
  replying with the form link (see below).

## Telegram workflow (build only if the bridge passes)
Prereq: Arsalan creates the bot — Telegram → @BotFather → /newbot → name "MMVH Front Desk",
username e.g. mmvh_frontdesk_bot → token to Codex (token goes ONLY into the n8n credential).

Nodes:
1. **Telegram Trigger** — credential = bot token, Update = message.
2. **Build Submission** (Code):
   const m = $input.first().json.message || {};
   const chatId = (m.chat && m.chat.id) || '';
   return [{ json: { chat_id: chatId,
     request_id: 'TG-' + chatId + '-' + (m.message_id || Date.now()),
     message: m.text || '', owner_name: '', email: '', pet_name: '', species: '', service: '', requested: '', reference: '' } }];
   (Guard: if message text is empty or starts with /start, reply with instructions instead —
   a Set/IF on message text is fine.)
3. **Submit to Front Desk** — HTTP Request POST http://localhost:5678/form/mmvh, Form
   Urlencoded body = the fields above, response as text.
4. **Extract Reply** — Code node, contents = extras/telegram-extract.js.
5. **Send Reply** — Telegram node, operation Send Message, Chat ID = {{ $json.chat_id }}
   (carry it via the Extract output: simplest — in Extract, spread the Build Submission json:
   change its first line usage to merge $('Build Submission').first().json into the output),
   Text = {{ $json.reply }}.

Fallback if the bridge FAILS: nodes 3–4 are replaced by a fixed reply: "Use our front desk
form: http://localhost:5678/form/mmvh (on the clinic desk network)" — still a working
channel presence, zero risk.

## Voice (stretch, only if Telegram lands early)
Telegram voice notes arrive as a file_id on the trigger. Path: Telegram node (Get File) →
HTTP Request to Groq https://api.groq.com/openai/v1/audio/transcriptions
(model whisper-large-v3-turbo, multipart with the file) → transcript text becomes
`message` in Build Submission → same bridge. If any step resists for >10 min, drop voice —
text Telegram already proves the multi-channel story.

## QR code (3-min test, after dashboard)
Only if the laptop is reachable on the venue LAN: Codex opens http://<laptop-LAN-IP>:5678/form/mmvh
from Arsalan's phone browser (same Wi-Fi). If it loads, generate a QR for that URL and show it
on the dashboard tab. If not, drop silently — localhost on the desk laptop still satisfies the statement.
