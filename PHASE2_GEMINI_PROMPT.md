# Paste into Gemini with the current project files

## Required delivery format: downloadable ZIP

Return the completed project as a downloadable **`catchup-phase2.zip`**, not just code blocks or snippets. Preserve the existing repository structure with `frontend/`, `backend/`, `tests/`, and shared configuration at the ZIP root. Include the complete updated source project, including unchanged source files needed to run it, the lockfile, `.env.example`, setup instructions, and any authentication migrations/policies. Include a `CHANGES.md` listing added, modified and intentionally removed files, plus the commands actually tested and any remaining setup.

Exclude `node_modules/`, `dist/`, `.git/`, real `.env` files, credentials, private chat exports, downloaded model weights and unrelated reference archives. Do not include fabricated test results. Verify that the ZIP extracts successfully and contains the files listed in `CHANGES.md`. Provide a direct download attachment/link to the generated ZIP. If your environment cannot create downloadable files, clearly state that limitation rather than inventing a download link; provide a runnable file-generation script as the fallback.

You are implementing phase two of CatchUp, a hackathon application. Modify the supplied existing repository; do not generate a disconnected replacement or claim untested features work. Deliver actual source files with a change summary, setup instructions, environment-variable template, migrations if needed, and tests. Never include credentials in the response.

## Product and constraints

CatchUp solves “What Did I Miss?” for overwhelming chats. Users import WhatsApp text exports or paste text, choose their identity/role/interests, and receive relevant source-linked summaries. One dependable workflow matters more than feature count. The product uses local processing for privacy: chat text and summaries must never be sent to any backend, auth provider, analytics, error-reporting service or cloud LLM. Real user files must not enter Git. No fake results, fake metrics or decorative login.

New work: a polished public landing page, REAL managed authentication, protected workspace access, account/session controls, and truthful security/privacy copy. Keep guest mode available as a clear “Continue locally without an account” option: it uses the existing local-only workspace without cloud persistence. Accounts protect account/preferences access; guest mode is not a backdoor into another user's account. Auth is optional for processing a locally imported chat. Do not weaken the privacy model to justify login.

## Existing repository: read before changing

Root: `C:/ProtocolX`.

```
backend/
  src/index.ts                 public local engine exports
  src/core/types.ts            Profile, Message, ParsedChat, Brief types
  src/core/parser.ts           WhatsApp/plain text parser
  src/core/profile.ts          validated opt-in local preferences
  src/core/brief.ts            AI prompt, source validation, fallback
  src/ai/local-model.ts        BrowserModel / WebLLM adapter
  src/ai/worker.ts             inference worker
  server/health.mjs            optional Render metadata service
frontend/
  index.html                  entry point
  src/app.ts                  current UI controller
  src/shell.ts                current markup
  src/stitch.css              integrated Stitch styles
  src/style.css               stylesheet entry
  testing/model.html          synthetic development diagnostic only
  STITCH_PROMPT.md             original design specification
  GEMINI_CONTEXT.md           original engine integration contract
tests/core.test.ts             17 existing core tests
tests/fixtures/                explicitly labelled synthetic fixtures
package.json / package-lock.json / tsconfig.json / vite.config.ts
vercel.json / render.yaml
prompt.md                    development prompt log, NOT runtime secrets
README.md / TESTING.md
```

Root commands: `npm ci`, `npm run dev`, `npm test`, `npm run build`. Vite root is `frontend`, output is root `dist`. Current frontend is vanilla TypeScript; keep this unless a framework materially simplifies implementation. Preserve the local engine and working integration. Deployment target is Vercel frontend + optional Render service. No auth provider project, production hostname, repository URL or credentials have been supplied yet. Do not invent them. Inspect installed dependencies and consult current official documentation for the chosen authentication SDK before coding.

## Existing processing API: no HTTP chat endpoints

From `frontend/src`:

```ts
import {
  parseChat, ChatParseError, MAX_INPUT_BYTES,
  createBrief, BrowserModel,
  loadProfile, saveProfile, forgetProfile, validateProfile,
  type Profile, type ParsedChat, type Brief,
} from '../../backend/src/index';
```

`Profile`: `{name: string, role: 'student'|'developer'|'lead'|'custom', interests: string[], responsibilities: string, length: 'brief'|'detailed'}`. Name <=100 chars, <=20 interests each <=60 chars, responsibilities <=500 chars. A role is a summary preference, NEVER an authorization role. The user can change it per conversation.

`parseChat(text, {format: 'whatsapp'|'plain', dateOrder?: 'DMY'|'MDY'})` returns `{messages, participants, warnings, ignoredLines}`. A message is `{id, author, text, timestamp: string|null}`. Timestamp is export wall-clock time, not a verified timezone. Ask about ambiguous dates. Parser errors: EMPTY, TOO_LARGE, DATE_ORDER_REQUIRED, INVALID_DATE, TOO_MANY_MESSAGES. Import limit 2 MB / 10,000 messages. File.text() only; never upload. Plain text has unknown author/time; disable time filtering.

`new BrowserModel()` currently defaults to Qwen2.5-3B-Instruct-q4f16_1-MLC. `await model.load(progressTextCallback)` downloads/caches model artifacts and requires WebGPU/memory (~2.5 GB catalog VRAM estimate). `model.dispose()` terminates its worker. Do not load/download before an explicit user action.

`await createBrief(messages, profile, {model?: localModel, since?: 'YYYY-MM-DDTHH:mm', signal?: AbortSignal})` returns:

- `mode`: ai or extractive.
- `items`: `{category: 'actions'|'decisions'|'updates', text, sourceIds: string[], priority: 'high'|'normal', reason, deadlineQuote: string|null}`.
- `warnings`: always display them.
- `stats`: totalMessages, selectedMessages, analyzedMessages, elapsedMs.

AI output uses a JSON schema, validates source IDs/exact deadline excerpts, and may retry once to repair deadline citations. Failure becomes clearly labelled original-message extraction. Validation does not prove semantic correctness. AI uses bounded recent context; show partial coverage. Do not remove these protections or fill errors with fake output.

All chat/result state is in browser memory. Only preferences persist if opted in. Imported and generated text must be rendered with textContent/escaped interpolation, never HTML. Clear session cancels work, invalidates asynchronous jobs, clears text/files/parsed messages/results and stops the worker. It does not guarantee forensic memory erasure or remove model weights. Retain accessible error/loading/empty states, cancellation, evidence expansion, citation highlighting and reduced-motion support.

Only current server endpoint: `GET /health` (local `http://localhost:3001/health` after `npm start`), returning `{"status":"ok","app":"catchup-local","version":"0.1.0","chatProcessing":"device-only"}`. All other routes return 404. There is no chat, summary, login or profile HTTP endpoint today. No database exists.

## Authentication implementation

Use a maintained managed-auth service instead of hand-built credentials. Recommended implementation path: Supabase Auth with email magic-link / OTP sign-in, so CatchUp does not handle passwords. Validate current official SDK behavior, rate limiting, refresh, PKCE and redirect configuration. If you choose a different provider, justify it and preserve all requirements. Do not add multiple providers or password login in this phase.

Implement actual SDK-backed sign-in, callback/error handling, session restoration, account display, and sign-out. Use a neutral “Check your inbox” response where possible to avoid revealing whether an email is registered. Disable duplicate submissions; respect provider throttling and give clear retry feedback. Avoid unverified promises such as “email sent” when the provider returned an error. Route destinations after sign-in must come from a fixed allowlist, not arbitrary return URLs.

Routes to implement (adapt to existing routing without breaking the local worker/build):

- `/`: public landing page.
- `/login`: email entry; link/OTP flow.
- `/auth/check-email`: confirmation and controlled resend.
- `/auth/callback`: validate/exchange using the provider's supported flow; handle expired/invalid/reused links and remove callback credentials from the address bar.
- `/workspace`: account workspace when signed in; an explicit guest mode can also run local-only processing. Do not pretend a guest is authenticated.
- `/account`: signed-in-only account/session settings.
- `/privacy`: accurate data-flow and storage explanation, linked from all relevant views.

A UI route guard alone is not security. Every remote account/preference operation must be authorized by the provider/database policy or a server that verifies provider-issued tokens. Never trust a client-supplied user ID/email/role. Do not parse a JWT and assume its signature is valid.

Prefer keeping profiles local in this first auth phase. If you implement optional preference synchronization, it MUST be off by default, send only explicitly selected profile fields, and enforce per-user ownership at the database layer (e.g. Row Level Security against the authenticated user ID). Include policy migrations and cross-user denial tests. Never add chat/result/history tables. Do not add remote synchronization merely to make login seem more useful.

Isolate any saved local preferences by authenticated user ID and guest scope. Never silently migrate a guest profile into an account or expose account A's profile to account B. Ask before copying guest preferences. On logout, expiry or account change: cancel inference, terminate workers, invalidate pending async operations, erase current chats/results and load only the new scope's authorized preferences. Logging out should use the actual provider sign-out, not merely hide the workspace.

Document the actual session storage model. For a browser-only SDK session, explain the XSS threat of browser-accessible tokens; do not claim HttpOnly cookies. If you instead implement server-owned cookie sessions, use HttpOnly/Secure/SameSite cookies and implement appropriate CSRF protection and refresh handling. Pick one coherent deployment-compatible approach, not a mixture that exposes refresh tokens.

Never embed service-role/admin/private keys in browser code or VITE_ variables. A provider's explicitly public publishable key is configuration, not an authorization secret. Provide `.env.example` placeholders with exact names and explain which keys are public. Keep actual secrets ignored. Missing configuration must produce a clear “Sign-in is not configured” state, while local guest processing still works. Do not fabricate working auth when a provider project has not been configured.

Keep logs free of emails, tokens, callback credentials, chats and summaries. Use allowlisted provider origins in CSP and restrict redirects to configured local/production URLs. Preserve existing security headers; do not solve CSP errors with wildcard script origins, unsafe-inline or unsafe-eval. Avoid third-party analytics, fonts and remote avatars. Derive an avatar from initials locally if desired. Do not advertise end-to-end encryption or certified compliance.

The optional Render metadata server can remain unchanged if the frontend talks directly to the managed auth provider. If remote preference APIs are necessary, add only documented protected endpoints; retain no chat-upload endpoint. CORS is not authorization. Bind permissions to verified identity.

## Landing page and design

Follow `PHASE2_STITCH_PROMPT.md` and the attached Stitch screens. Match the existing mint background, deep green/teal actions, white cards, warm chat surfaces and system typography. Use CatchUp's own branding. References: QuillBot, https://chatgpt.com/writing/summarizer/, Notta, and familiar WhatsApp chat cues.

Landing page: clear one-sentence value proposition, “Start catching up” and “Continue locally” CTAs, three-step workflow, role-specific value, source verification, truthful privacy explanation, and a concise FAQ. Do not display invented usage counts, speedup/accuracy percentages, testimonials or canned AI results. Abstract chat blocks are fine; any illustrative text must be clearly marked as an illustration and not presented as live processing.

Auth/account pages must be complete, responsive and accessible. Include keyboard focus, visible labels, status announcements, loading/error/expired-link/network-failure states. Use subtle 120–240 ms transitions only where helpful; honor prefers-reduced-motion. No unnecessary animation package.

## Tests and honest delivery

Preserve all 17 core tests. Add meaningful auth tests for signed-out account access, callback failure, session restoration/expiry, sign-out cleanup, user-switch preference isolation and disallowed redirect destinations. If remote preferences exist, prove user A cannot read/write user B's data. Use a test project for provider-backed tests; never claim a mocked test proves real email delivery or deployed access control.

Run build and tests. Test guest import and local inference integration after auth changes. Review actual network calls: authentication requests may contain the email needed for sign-in; no request may contain imported chat text or summaries. Distinguish code-reviewed guarantees from network-tested behavior.

Read `TESTING.md`: current checks use labelled synthetic fixtures, not real user data. Small-model semantic accuracy is not established. Do not claim this phase solves AI accuracy or every WhatsApp locale. The 3B model completed a source-validated synthetic smoke test, but a real consented export and deployed CSP/network checks remain.

Deliver: changed source files in the existing frontend/backend structure; safe environment template; auth setup checklist with exact redirect URLs to configure once hosts are known; any migrations/policies; tests and actual test output; a short list of external setup still required. Update README and append a concise non-sensitive prompt summary to `prompt.md`. Do not initialize a new unrelated repo, deploy, submit the hackathon entry, or publish credentials.
