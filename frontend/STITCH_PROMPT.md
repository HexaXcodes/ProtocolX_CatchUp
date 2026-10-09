# Paste this into Stitch

Design a polished, responsive web application called CatchUp for the hackathon problem “What Did I Miss?” It helps people understand a busy WhatsApp conversation according to their role. The central promise is: “Back in the loop. On your terms.”

Create a professional, calm workspace using off-white surfaces, deep forest-green typography, restrained sage accents, rounded cards, generous spacing, and accessible contrast. Use a locally available system font. Design desktop first and include a practical mobile layout. Avoid a marketing landing page; the main deliverable is a working-product interface.

## Visual inspiration and layout

Take functional inspiration from QuillBot's summarizer (https://quillbot.com/summarize), Notta's organized AI notes (https://www.notta.ai/en/features/ai-notes), and the confirmed ChatGPT text summarizer (https://chatgpt.com/writing/summarizer/). Borrow an input/output writing workspace, concise length controls, structured notes, and ChatGPT's simple summarization entry point with skimmable headings and bullets. Do not copy logos, proprietary illustrations, brand wording or entire screens. These are design references, not integrations or authentication providers.

Make the visual identity distinctly WhatsApp-inspired: warm off-white conversation surfaces, deep teal-green header accents, pale green source bubbles, white neutral bubbles and small muted author/timestamp labels. Suggested accessible palette: canvas #F7F9F6, chat surface #EFEAE2, primary #075E54, action #128C7E, pale bubble #DCF8C6, text #183B37. Use brighter green sparingly as an accent, never for low-contrast body text. Treat these as design tokens, not exact brand replication. Keep CatchUp branding and an explicit “WhatsApp text import” label; do not show a fake connected account, WhatsApp logo endorsement, online status, unread counters, delivery ticks or messaging composer. This is a private imported-chat reader, not a chat client.

In source evidence, identify messages by author and timestamp. Align the selected user's messages to the right only when the author exactly matches the selected participant; all others stay left. Unknown-author plain text uses a neutral left-aligned source card. The summary panel stays clean and document-like, with restrained cards and short bullet points. Preserve the professional clarity of QuillBot/ChatGPT/Notta inside this familiar chat-inspired theme.

Use a compact top bar with CatchUp branding, a text-labelled local-processing status and Clear session. Desktop: a slim editable context sidebar, then a source/summary split workspace. Source panel holds import/paste and conversation preview. Summary panel groups actions, decisions and relevant updates. Keep source evidence close to each result, with an expandable source drawer or panel. Before import, display purposeful empty states, not fabricated conversations. On mobile stack context/import/results and use clear Source / Brief tabs if needed. Avoid an oversized hero that pushes the actual tool below the fold.

Highlight these three differentiators through the UI: **Relevant to your role**, **Verify every takeaway**, **Processed on your device**. Use short explanatory labels near the controls they describe. Clearly distinguish actual model-ready status from general privacy messaging. Do not use color alone for priority; include labels and icons.

## Purposeful motion

- Buttons, focus and tab states: 120–160 ms color/opacity transitions.
- Source evidence expansion: 180–220 ms; scroll a selected source into view and briefly tint its background. Keep keyboard focus predictable.
- Newly completed brief: a single 180–240 ms fade/4 px rise. Do not animate every word or delay reading with staggered sequences.
- Model download: display actual runtime progress text; use a subtle indeterminate indicator when percentage is unavailable. Do not invent percentages or estimated completion times.
- Processing: a restrained status indicator only while genuinely busy, with visible Cancel. Never imply work continues after cancellation.
- Respect `prefers-reduced-motion: reduce`: remove transforms, smooth scrolling, pulses and reveal animations; retain readable static status text. Avoid parallax, autoplay videos, decorative looping animations and celebratory confetti.

Motion should draw attention to a completed import, available brief, or cited evidence. Keep results immediately usable and preserve low-powered-device performance.

The MVP has local profiles, not login or authentication. Do not design passwords, Google sign-in, team administration, payment plans, or a connected WhatsApp inbox. A profile has a display name matching the imported chat, a role (Student, Developer, Project lead, Custom), editable interests, responsibilities, and brief/detailed summary length. Include an optional “Remember preferences on this device” checkbox, unchecked initially, and a separate “Forget saved profile” action. Explain that profiles personalize results and do not provide security/access permissions.

Design this complete flow:

1. A short onboarding/context panel to set the local profile. Keep it editable from the workspace.
2. Import conversation: choose a WhatsApp .txt export without media or paste conversation text. Include format selection (WhatsApp / Plain text), a 2 MB limit, date-order confirmation (DD/MM/YYYY or MM/DD/YYYY), and an import preview displaying actual message count, participants, warnings, and the first five source messages. Explain that this imports a file; it does not connect to WhatsApp. Users can choose their name from the imported participants.
3. Choose an optional “Catch up since” time based on the export timestamps. Disable time filtering for plain text, where authors and dates are unknown.
4. Offer “Enable local AI” with first-download progress, a large-download notice, and a note that compatible WebGPU hardware is required. Model downloads use the internet; chats are processed on the device. Also offer “Use extractive mode” immediately. Do not imply the model is ready before it loads.
5. A primary “Catch me up” button, processing state, and Cancel action.
6. Results organized into Your actions, Decisions, and Relevant updates. Each item has its text, priority, a short reason explaining personal relevance, optional original deadline wording, and expandable source messages with author, time and source ID. Show actual measured processing time and analyzed/selected message counts. Clearly label partial coverage and uncertainty. Do not fabricate tasks, dates, urgency, summaries or success metrics.
7. A distinct extractive state labelled “Relevant excerpts — AI summary unavailable.” This mode displays original messages matched to names/interests, and must not look like verified AI task extraction.
8. Error/empty states for malformed input, ambiguous dates, unsupported GPU, model download failure, cancelled inference, and no matching updates. Preserve actionable recovery steps.
9. “Clear session” removes chat/results and stops processing. Say saved preferences and downloaded model cache remain; provide Forget profile separately.

Include visible privacy text: “Imported chats and results stay in this browser session. Only preferences are saved if you choose.” Include a concise AI accuracy notice advising source verification. Do not claim end-to-end encryption, certified compliance, secure login, automatic deletion from operating-system memory, or live WhatsApp integration.

Use accessible labels, keyboard focus states, readable body text, and an aria-live status region. Source text is plain text, never executable HTML. Include no analytics, external fonts, chat uploads, canned sample conversations or fake summaries. Provide designs and frontend components; Gemini will connect them to an existing local TypeScript engine.
