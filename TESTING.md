# Integration test record — 9 October 2026

The Phase 2 Stitch export is integrated into the local CatchUp application. Design samples and static exports are converted into maintainable local components and CSS rules.

## Verified

- **Production Build**: Production TypeScript and Vite build passes (`npm run build`). Outputs `dist/` containing `index.html`, bundle scripts, styles, and WebLLM worker assets.
- **Automated Tests**: All 22 automated tests pass (`npm test`):
  - 17 core processing tests: export parsing, multiline/iOS timestamps, ambiguous and invalid dates, size/message limits, role ranking, time selection, source/quote validation, cancellation, and citation-repair retries.
  - 5 authentication & scope isolation tests: redirect destination allowlist enforcement (`validateRedirectDestination`), email initials derivation (`getInitialsFromEmail`), scope key isolation (`catchup.profile.guest` vs `catchup.profile.user.<id>`), cross-user preference isolation, and unconfigured Supabase state handling (`isAuthConfigured`).
- **Browser & UI Verification**:
  - Landing page (`/`): responsive header, hero section, CTA buttons, transformation illustration card, 3-step process, 3 guiding principles, role context filters, privacy boundary cards, FAQ, and footer.
  - Sign-in page (`/login`): passwordless email sign-in form, unconfigured state banner when Supabase env vars are missing, 45-second rate-limit cooldown timer, and local guest access link.
  - Check email page (`/auth/check-email`): recipient address display, resend link trigger, and change email link.
  - Callback page (`/auth/callback`): verifying spinner, URL fragment token purging, allowed route navigation, and expired link recovery card.
  - Account page (`/account`): signed-in email display, initials avatar, identity boundary notes, editable persona parameters, sign-out button, and device preference removal button.
  - Privacy page (`/privacy`): 4-part data boundary whitepaper, clear session guarantees and limits, IndexedDB model cache purge action, honest security statements, and DevTools 60-second verification guide.
  - Guest & Session Isolation: logging out or switching accounts clears in-memory chat buffers, terminates the AI worker, and loads the target scope's preferences.
  - Reduced-motion support: `prefers-reduced-motion` Media Query disables animations and sets smooth scrolling to instant.
  - Desktop and mobile layouts inspected at various viewport widths without document overflow.

## Remaining

- Configured live Supabase Auth project testing with actual SMTP email dispatch. (Unit tests mock configuration states; real magic-link delivery requires an active Supabase project).
- Real WebGPU hardware model inference on a live consented export. Synthetic fixtures verify code paths and schema validation, not real-world semantic accuracy across all languages or chat styles.

## Reproduce

Run `npm test`, `npm run build`, and `npm run dev` from the repository root. Never include real chat data or private credentials in test files or audit logs.
