# Gemini implementation prompt and exact integration contract

You own the CatchUp frontend in `C:/ProtocolX/frontend/`. Implement the approved Stitch design here. The backend processing engine already exists at `backend/src/`; it runs on the user's device. Do not replace it with HTTP inference, fake data, or placeholder handlers. Keep runtime chats out of logs, storage, URLs, analytics and HTTP requests.

Design direction: follow `frontend/STITCH_PROMPT.md`, updated with QuillBot, Notta, and the confirmed https://chatgpt.com/writing/summarizer/ reference. Use a WhatsApp-inspired warm chat surface, deep green/teal accents, pale green message bubbles, author/timestamp labels, and a compact source/brief workspace. Keep CatchUp branding; no fake connected inbox, delivery ticks or online presence. Align selected-user bubbles right only on an exact participant match. Add only purposeful lightweight motion (120–240 ms controls, evidence expansion and brief reveal), real progress indicators, and `prefers-reduced-motion` support. No fake processing percentages or typing effects. Keep input/results above the fold on desktop. Gemini owns this final visual implementation; the existing screen is a replaceable integration harness.

The root `package.json`, `tsconfig.json` and `vite.config.ts` are shared project configuration. Run `npm run dev`, `npm test`, and `npm run build` from `C:/ProtocolX`. Vite's root is `frontend/`; production output is root `dist/`. The Stitch export has now been integrated in `frontend/src/app.ts`, `shell.ts`, and `stitch.css`. Preserve the working engine integration when refining the design. Do not overwrite `backend/`, `tests/`, `prompt.md`, or deployment files unnecessarily.

## Endpoints

There is intentionally **no HTTP chat, summary, profile or login endpoint**. Calling cloud endpoints with chat text would violate this MVP's privacy design. Use the local functions below.

The optional Render server exposes only:

```http
GET /health
```

Local URL after `npm start`: `http://localhost:3001/health`. Production base URL is not assigned yet; do not invent one. Response:

```json
{"status":"ok","app":"catchup-local","version":"0.1.0","chatProcessing":"device-only"}
```

The UI does not need this endpoint. No authentication, API key, CORS integration or server upload is required. All other paths/methods return 404.

## Local API (imports from frontend/src)

```ts
import {
  parseChat, ChatParseError, MAX_INPUT_BYTES,
  createBrief, BrowserModel,
  loadProfile, saveProfile, forgetProfile, validateProfile,
  type Profile, type ParsedChat, type Brief,
} from '../../backend/src/index';

const profile: Profile = validateProfile({
  name: userSelectedName,
  role: selectedRole, // 'student' | 'developer' | 'lead' | 'custom'
  interests: userEnteredInterests, // string[], max 20, max 60 chars each
  responsibilities: userEnteredResponsibilities, // max 500 chars
  length: selectedLength, // 'brief' | 'detailed'
});

const chat: ParsedChat = parseChat(inputText, {
  format: 'whatsapp', // or 'plain'
  dateOrder: confirmedOrder, // 'DMY' | 'MDY' | undefined
});

// Load only after user chooses the model download. Reuse one model instance.
const model = new BrowserModel();
await model.load(progressText => setModelStatus(progressText));

const abortController = new AbortController();
const brief: Brief = await createBrief(chat.messages, profile, {
  model: modelReady ? model : undefined,
  since: selectedTime || undefined, // YYYY-MM-DDTHH:mm, export wall-clock
  signal: abortController.signal,
});

// Never put the chat or brief into localStorage.
if (rememberPreferences) saveProfile(profile);
const savedProfile = loadProfile(); // Profile | null
forgetProfile(); // explicit separate action

// Clear/cancel also invalidate pending async UI jobs to prevent stale results.
abortController.abort();
model.dispose();
```

Read `backend/src/core/types.ts` for the authoritative types:

- `ParsedChat`: `messages`, `participants`, `warnings`, `ignoredLines`.
- Message: `id`, `author`, `text`, `timestamp` (string or null).
- Brief: `mode` (`ai` or `extractive`), `items`, `warnings`, `stats`.
- Item: `category` (`actions`, `decisions`, `updates`), `text`, `sourceIds`, `priority` (`high`, `normal`), `reason`, `deadlineQuote` (exact source excerpt or null).
- Stats: `totalMessages`, `selectedMessages`, `analyzedMessages`, `elapsedMs`.

Resolve source IDs against the original `chat.messages` used for that request. Render with React text interpolation or textContent, never dangerouslySetInnerHTML. These references validate evidence existence, not the truth of every AI claim.

## Required interaction behavior

- Read .txt files with `File.text()` after checking size <= `MAX_INPUT_BYTES`; do not upload. Reject ZIP/media. Keep pasted text and results in memory.
- `ChatParseError.code`: `EMPTY`, `TOO_LARGE`, `DATE_ORDER_REQUIRED`, `INVALID_DATE`, `TOO_MANY_MESSAGES`. Present errors inline. Ask for date order when ambiguous; do not silently choose one.
- Preview the parser results and warnings before summarization. Plain mode has unknown authors/times and cannot use `since`.
- Keep the profile editable; changing role requires regenerating the brief. Suggested role defaults are normal configuration, not generated results.
- Disable duplicate loads/generations, prevent loading/replacing a model during inference, and expose cancellation. Cancelled/failed models may need reloading. No cloud fallback.
- After a parse/input change, clear obsolete results. Use request IDs or generation tokens so late file reads/model requests cannot repopulate cleared state.
- Show all brief warnings, including incomplete context coverage. Empty items do not mean no important information exists elsewhere in the chat.
- Persist preferences only when opted in; handle unavailable storage gracefully. A local profile is not sign-in.
- Clear chat/file/parsed messages/results/worker state on Clear session. Preferences and cached model artifacts are separate.
- Do not invent demo data or benchmark numbers. Use a consented real WhatsApp export supplied locally. Tests contain synthetic fixtures only.

Acceptance: root build/tests pass; keyboard-accessible flow; actual file import works; evidence expands; no source text is interpreted as HTML; role changes work; fallback is honestly labelled; cancellation and clear prevent stale results; no chat-bearing network traffic.
