# Paste into Stitch with the existing CatchUp screens

Design the remaining pages for CatchUp, extending the attached existing mint-and-teal workspace. This is a privacy-focused chat catch-up tool: users import WhatsApp text exports, choose a role and get summaries with original message citations. Chat processing stays on the device. Do not redesign the completed workspace; create matching surrounding pages and transitions.

Use the existing identity: mint canvas (#E4FFFA), white rounded cards, deep green (#075E54), teal accents (#128C7E), dark readable text (#183B37), subtle borders, warm WhatsApp-inspired chat surfaces (#EFEAE2) and pale green bubbles (#DCF8C6). Keep accessible contrast and uncluttered typography using system fonts or supplied local font assets. Draw functional inspiration from QuillBot, https://chatgpt.com/writing/summarizer/ and Notta. Keep CatchUp branding; never imply affiliation with those products or WhatsApp.

Create desktop and mobile designs for these pages and states:

1. LANDING PAGE `/`
   - Compact header: CatchUp, How it works, Privacy, Sign in.
   - Hero: “Back in the loop. On your terms.” Supporting line: “Find the decisions, requests, and updates that matter to you—without uploading your chats.”
   - Primary CTA “Start catching up”; secondary “Continue locally without an account”. Make the distinction understandable: an account manages identity/preferences; guest mode still processes chats locally.
   - A restrained visual connecting an imported conversation to a role-specific brief and source citation. Use abstract message blocks or explicitly labelled illustrations, not fake live results or metrics.
   - Three-step section: Import a text export → Choose your context → Read and verify your brief.
   - Three feature cards: Relevant to your role / Sources behind each takeaway / On-device processing.
   - Compact role examples: Student, Developer, Project lead, Custom. Describe priorities, not generated outcomes.
   - Honest privacy section: app/auth/model downloads use the internet; chats and summaries stay on device. Saved preferences are optional.
   - FAQ: Does it connect to WhatsApp? (No, text export import.) Do I need an account? (No, local guest mode is available.) Does AI always get it right? (No, verify citations.) What if my device cannot run AI? (Use clearly labelled original-message extraction.)
   - Closing CTA and concise footer. No fake testimonials, user counts, accuracy guarantees, speed guarantees or “military-grade” security claims.

2. SIGN-IN `/login`
   - Clean card, email input, “Send sign-in link” primary button, and guest-mode link.
   - Explain: “We use your email to sign you in. Your chats are not sent with it.”
   - Passwordless email sign-in only. Do not design Google/Apple/password methods that will not exist.
   - Include validation, submitting, rate-limited, offline/provider-error and unconfigured-sign-in states. The unconfigured state offers local guest mode and does not pretend an email was sent.

3. CHECK EMAIL `/auth/check-email`
   - “Check your inbox” with the entered address shown only in the user's own flow, a change-email action, controlled resend state and spam-folder guidance.
   - Do not invent a countdown that has no corresponding backend behavior.

4. AUTH CALLBACK `/auth/callback`
   - Compact verifying state, success transition to workspace, and invalid/expired/already-used-link recovery.
   - No token or technical credential strings displayed. Provide a safe route to request a new link.

5. ACCOUNT `/account`
   - Signed-in email, locally generated initials avatar, profile preferences and storage explanation.
   - “Sign out” with clear note that current imported chat/results will be cleared.
   - “Forget preferences on this device” separate from sign-out.
   - Show preference-sync controls only if implemented; otherwise omit them rather than inventing functionality.
   - Roles remain personalization choices, not admin permissions. Do not add organization management, billing or unsupported account deletion.

6. PRIVACY `/privacy`
   - Extend the existing Privacy & storage screen into a clear data-flow page.
   - Separate: chat text/results in memory; opt-in local preferences; identity handled by the authentication provider; model files downloaded/cached.
   - Explain clear session and its limits: stops worker and removes app references; does not guarantee forensic erasure or delete source files/model cache.
   - No “encrypted localStorage”, “air-gapped”, certified compliance, automatic secure deletion or end-to-end encryption claims.

7. WORKSPACE HEADER STATES
   - Guest: explicit “Local guest” badge plus Sign in.
   - Signed in: account initials menu with Account and Sign out.
   - Expired session: accessible notice and route back to sign-in; sensitive current chat/results have been cleared by the implementation.
   - Keep existing import, role preferences, source panel and brief design intact.

Motion: use short 120–240 ms hover/focus, card reveal and source-expansion transitions. Use actual loading indicators only during real operations. No autoplay videos, fake AI typing, confetti or endless decorative pulses. Respect prefers-reduced-motion. Provide visible focus, labelled inputs, clear errors, generous tap targets and readable mobile layouts.

Deliver coherent page designs/components and all named states for Gemini to implement. Authentication wiring is Gemini's responsibility; designs must not imply that an unconfigured integration already works.
