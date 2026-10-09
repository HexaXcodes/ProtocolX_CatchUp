# CatchUp — private chat catch-up

Import a WhatsApp text export, choose your role and time window, and inspect a source-linked brief. This MVP uses a **local profile, not authentication**. Chats and summaries are held in browser memory. It does not connect to WhatsApp or retrieve unread status.

## Run

Requires Node.js 22.12+ or 24+.

```sh
npm ci
npm run dev
npm test
npm run build
```

Open the Vite URL. Apply a profile, choose a `.txt` export without media, confirm date order, preview messages, and select **Catch me up**. Optional **Enable local AI** downloads model artifacts for WebLLM; this can take time and requires compatible WebGPU hardware. There is no cloud inference fallback. Model failures return labelled original excerpts.

## WhatsApp demo

1. Use a real conversation whose participants have consented to the demo. Do not commit its export.
2. In WhatsApp, export the selected chat **without media**. Extract the `.txt` file if it arrives in a ZIP. Transfer it to the demo laptop using your preferred private method.
3. Import the text file locally. Choose DMY or MDY according to the export, check the first messages, and select your chat display name.
4. Use an export date/time for the catch-up window (the export does not establish a timezone).
5. Compare roles, open the sources, and show the observed timings and coverage.
6. Open browser network inspection to verify that inference does not send message text. Preload the model before the presentation; test inference with networking disabled after assets are cached. Offline page reload is not promised.

Android and iOS common text formats are supported, including multiline messages, optional seconds and AM/PM. Localized date formats, non-text attachments, backup databases, live integration and ZIP import are not supported. Plain text mode treats each nonempty line as a source, with unknown author/time. A real phone export still needs manual validation before the demo.

## Architecture

- `backend/src/core/parser.ts`: bounded, source-preserving import with ambiguous-date checks.
- `backend/src/core/profile.ts`: validated preferences, opt-in browser persistence.
- `backend/src/core/brief.ts`: local model contract, bounded input, output validation, evidence references and deterministic excerpt fallback.
- `backend/src/ai/`: WebLLM worker adapter. Default model: Qwen2.5 3B Instruct, selected from the installed runtime catalog (about 2.5 GB VRAM estimate). See `TESTING.md` for validation limits.
- `frontend/src/app.ts`: UI state, imports, local inference, source navigation and cancellation.
- `frontend/src/shell.ts` and `stitch.css`: integrated Stitch layout and responsive styles; no CDN scripts, remote fonts or remote images.
- `backend/server/health.mjs`: public Render health/version metadata only. No chat endpoint or database.

See `FRONTEND_HANDOFF.md` for the integration contract. A frontend rewrite must preserve the local processing boundary.

The supplied Stitch screens were used as visual references, not production data. Static sample messages, timing estimates, encrypted-storage claims and fake hardware status were removed. `design-reference/` holds the original export locally and is excluded from Git and production output. Synthetic diagnostic fixtures are explicitly labelled and never preloaded into the app.

## Privacy and reliability boundaries

- Conversations and results never enter localStorage, telemetry, application logs, or server APIs in this implementation. Only user-selected profile preferences can persist.
- Model downloads contact external artifact hosts and reveal ordinary connection metadata. They do not include chat text. Model weights remain cached after clearing a chat.
- Clear session removes app references and terminates the AI worker; it cannot guarantee forensic erasure of browser/OS memory or delete the original export file.
- Imported content is rendered as text. No HTML execution or source-link navigation is enabled. Chat instructions are untrusted input; the model has no tools.
- Output validation checks structure, known source IDs and exact deadline excerpts. It does **not** establish semantic truth. AI output always requires human verification.
- The AI input budget includes the latest complete messages that fit. Partial coverage is visible; earlier changes/decisions can be missed. Keyword fallback is not semantic summarization and does not infer ownership or urgency.
- Tests contain labelled synthetic edge-case fixtures only, not a dataset or demo results. Production results are calculated from user input. No external dataset or training pipeline is used.
- No benchmark, speedup, accuracy or privacy certification is claimed. Measure with a consented real export on the actual demo device.

## Deployment

Vercel: import the repository, build with `npm run build`, output `dist`. Security headers are in `vercel.json`. Verify actual model download hosts against the deployed CSP before demoing.

Render: use `render.yaml` or a Node web service with `node backend/server/health.mjs`; health endpoint `/health`. The frontend does not need to call Render. Neither host needs an AI API key.

Deployment and remote Git pushes require the destination account/repository. No deployment is claimed by the presence of these config files.

## Future expansion

Real authentication, isolated preference synchronization, multilingual/locale parser coverage, larger-context processing, permissioned integrations, local encrypted history and formal evaluation. Roles remain personalization settings, never authorization claims.

`prompt.env` is an audit log, separate from runtime `.env` secrets. It must never contain private imported conversations. Runtime model instructions are in `SYSTEM_PROMPT` in `backend/src/core/brief.ts`.
