# CatchUp — private chat catch-up

Import a WhatsApp text export, choose your role and time window, and inspect a source-linked brief. CatchUp provides **on-device local chat summarization**, **managed passwordless authentication** via Supabase Auth, and **explicit local guest access**. Chats and summaries are held strictly in browser memory and never leave the device.

## Run

Requires Node.js 22.12+ or 24+.

```sh
npm ci
npm run dev
npm test
npm run build
```

Open the Vite URL (default `http://localhost:5173`). Apply a profile, choose a `.txt` export without media, confirm date order, preview messages, and select **Catch me up**. Optional **Enable local AI** downloads model artifacts for WebLLM; this can take time and requires compatible WebGPU hardware. There is no cloud inference fallback. Model failures return labelled original excerpts.

---

## Authentication & Supabase Setup

CatchUp supports managed passwordless email sign-in via Supabase Auth (magic link / OTP). Authentication is **optional** for processing chats; guest mode remains fully functional without an account.

### Setup Instructions:
1. Copy `.env.example` to `.env`:
   ```sh
   cp .env.example .env
   ```
2. Set your public Supabase project credentials in `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   ```
3. In your Supabase project dashboard (under **Authentication -> URL Configuration**):
   - Set **Site URL**: `http://localhost:5173`
   - Add **Redirect URLs**:
     - `http://localhost:5173/auth/callback`
     - `https://your-domain.vercel.app/auth/callback`
4. If credentials are unset or omitted, CatchUp displays *"Sign-in is not configured"* on the login page while keeping Guest Mode fully operational.

### Token Storage & Security Model:
- **Token Storage**: The Supabase JS SDK stores authenticated session tokens in browser `localStorage`.
- **Security Boundaries & XSS Risk**: Client-side token storage can be vulnerable to cross-site scripting (XSS) if untrusted scripts run on the origin. To mitigate this risk, CatchUp enforces strict Content Security Policy (CSP) headers in `vercel.json` (disallowing inline script injection and limiting external network connections exclusively to configured model hosts and `https://*.supabase.co`).
- **No Password Handling**: CatchUp uses passwordless magic links exclusively; no passwords or secret credentials are ever collected or stored.
- **Scope Isolation**: Saved user preferences are strictly isolated per authenticated user ID (`catchup.profile.user.<id>`) and guest scope (`catchup.profile.guest`). Guest preferences are never silently merged into an account.

---

## Application Structure & Routes

- `/`: Public landing page detailing product value, 3-step workflow, features, role customization examples, honest data boundary breakdown, and FAQ.
- `/login`: Passwordless email sign-in entry, cooldown throttle display, unconfigured state banner, and local guest access option.
- `/auth/check-email`: Email dispatch confirmation and resend controls.
- `/auth/callback`: Auth token / magic link callback verification and clean redirect.
- `/workspace`: Catch-up workspace (import, date confirmation, profile configuration, local WebGPU AI or extractive ranking, source viewer, and citation spotlighting).
- `/account`: Account management, initials avatar, identity boundary notes, persona parameter customization, sign-out & memory purge, and preference management.
- `/privacy`: Comprehensive technical whitepaper on partitioned data boundaries, what Clear Session does and does not do, IndexedDB model cache manager ("Purge Model Cache"), and DevTools verification guide.

---

## Architecture

- `backend/src/core/parser.ts`: bounded, source-preserving import with ambiguous-date checks.
- `backend/src/core/profile.ts`: validated preferences with user-scoped and guest-scoped browser persistence.
- `backend/src/core/brief.ts`: local model contract, bounded input, output validation, evidence references and deterministic excerpt fallback.
- `backend/src/ai/`: WebLLM worker adapter. Default model: Qwen2.5 3B Instruct (about 2.5 GB VRAM estimate). See `TESTING.md` for validation limits.
- `frontend/src/auth.ts`: Supabase Auth client integration, session state management, URL allowlist validator, and initials derivation.
- `frontend/src/app.ts`: SPA client router, auth listener, UI state controller, local inference runner, source navigation, cancellation, and session cleanup.
- `frontend/src/shell.ts` & `stitch.css`: integrated Stitch Phase 2 layout, responsive components, accessible controls, and reduced-motion support.
- `backend/server/health.mjs`: public Render health/version metadata only. No chat endpoint or database.

---

## Privacy and Reliability Boundaries

- **Device-Only Processing**: Conversations and generated digests NEVER leave the device. They are held strictly in Web Worker memory heap during processing.
- **Model Cache**: Model downloads contact external artifact hosts and cache weights in IndexedDB (~420 MB). Model weights remain cached after clearing a chat; they can be purged via the Privacy page.
- **Clear Session**: Removes chat/results references from the DOM, terminates the AI worker, and nullifies memory addresses. It does not perform physical hardware DRAM shredding or delete the original `.txt` export on disk.
- **Output Validation**: AI output validation checks structure, known source IDs, and exact deadline excerpts. It does not establish semantic truth; AI output requires human verification against cited sources.
- **Audit Log**: `prompt.md` is an audit log of prompt history, NOT runtime secrets. It never contains real credentials, tokens, or private chat contents.

---

## Deployment

- **Vercel**: Build command `npm run build`, output directory `dist`. Security headers and SPA rewrites are configured in `vercel.json`.
- **Render**: Optional metadata service using `node backend/server/health.mjs`; endpoint `/health`. Neither host requires an AI API key.
