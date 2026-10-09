# Gemini / Stitch handoff

Updated handoffs after directory organization:

- `frontend/STITCH_PROMPT.md`: paste into Stitch for the interface design.
- `frontend/GEMINI_CONTEXT.md`: complete implementation context, imports, types and endpoint information.
- Engine: `backend/src/`; integrated frontend controller: `frontend/src/app.ts`, markup: `shell.ts`, styles: `stitch.css`.

The supplied Stitch export has been integrated with the local TypeScript engine. Preserve the working behavior in `frontend/src/app.ts` and the `backend/src/core` and `backend/src/ai` contracts when making further visual changes.

## Main flow

1. Local profile: name, role (`student`, `developer`, `lead`, `custom`), editable interests, responsibilities, length. Say **local profile**, not signed in. Persist only with consent via `saveProfile`.
2. Import a `.txt` file via `File.text()` or paste. Never use FormData/upload endpoints. Enforce the 2 MB limit before reading.
3. `parseChat(text, {format: 'whatsapp', dateOrder: 'DMY'})`. Leave date order undefined until confirmed if unknown; handle `ChatParseError.code === 'DATE_ORDER_REQUIRED'`. Plain mode is `{format: 'plain'}`.
4. Show participants, sample messages, all parser warnings, and a local timestamp range picker. Plain text cannot be time-filtered.
5. Optional `BrowserModel.load(progressCallback)` after an explicit download action. Show progress and offer extractive mode if unsupported. No paid cloud API.
6. `createBrief(parsed.messages, profile, {model, since, signal})`. Omit model for extractive mode. `since` is a local ISO wall-clock string such as `2026-10-09T10:00`.
7. Render brief items by category. Display `reason`, `priority`, warnings, mode and measured stats. Resolve every `sourceIds` entry to its original message. Never insert source or model content using innerHTML/markdown HTML.
8. Cancel via AbortController. Clearing terminates the worker via `dispose`, clears file/text/result state, and invalidates pending asynchronous jobs. Clearing does not delete saved preferences or model weights. Provide a separate Forget profile action.

## Contract example

```ts
import { parseChat, createBrief, BrowserModel } from '../../backend/src/index';

const chat = parseChat(text, { format: 'whatsapp', dateOrder: 'DMY' });
const brief = await createBrief(chat.messages, profile, {
  model: localModelReady ? localModel : undefined,
  since: selectedTime || undefined,
  signal: abortController.signal,
});
```

No HTTP chat API is required. The processing engine is the backend logic, hosted in the browser for privacy. Render only exposes public metadata. Keep loading, cancellation, validation errors, no results, partial coverage and extractive mode visibly distinct. Do not add mock summaries, demo statistics, analytics, third-party fonts or fake sign-in.
