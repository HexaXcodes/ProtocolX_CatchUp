import { landing } from './landing';
// Static application markup for CatchUp Phase 2.
// All user and chat content is strictly rendered as text via DOM nodes.

export const shell = `
<div id="catchup-intro-overlay" class="intro-overlay" hidden>
  <div class="intro-content">
    <div class="intro-c-container">
      <svg class="intro-c-svg" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="c-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#E2ECE7" />
            <stop offset="40%" stop-color="#128C7E" />
            <stop offset="100%" stop-color="#075E54" />
          </linearGradient>
          <linearGradient id="orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#F59E0B" stop-opacity="1" />
            <stop offset="100%" stop-color="#D97706" stop-opacity="0" />
          </linearGradient>
          <filter id="c-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <!-- Custom C mark stroke -->
        <path class="c-path" d="M 68 28 A 34 34 0 1 0 68 72" fill="none" stroke="url(#c-grad)" stroke-width="12" stroke-linecap="round" filter="url(#c-glow)" />
        <!-- Orbiting amber light particle -->
        <g class="orbit-group">
          <circle cx="50" cy="50" r="34" fill="none" class="orbit-path-debug" />
          <circle class="amber-light" cx="68" cy="28" r="4" fill="#F59E0B" />
        </g>
      </svg>
      <div class="intro-bloom"></div>
    </div>
    <div class="intro-brand-name">CatchUp</div>
    <button id="skip-intro" class="skip-intro-btn" aria-label="Skip intro animation">Skip intro</button>
  </div>
</div>

<header class="topbar">
  <div class="topbar-left">
    <a class="brand" href="/" data-route="/" aria-label="CatchUp home">
      <svg class="brand-svg-logo" viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
        <defs>
          <linearGradient id="brand-c-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#128C7E" />
            <stop offset="100%" stop-color="#075E54" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="#075E54" />
        <path d="M 22 10 A 10 10 0 1 0 22 22" fill="none" stroke="#E2ECE7" stroke-width="3.5" stroke-linecap="round" />
        <circle cx="22" cy="10" r="1.8" fill="#F59E0B" />
      </svg>
      CatchUp<span class="brand-dot">•</span>
    </a>
    <div class="tagline">Back in the loop.<br><span>On your terms.</span></div>
  </div>

  <nav class="topbar-nav">
    <a href="/workspace" data-route="/workspace" class="nav-link">Workspace</a>
    <a href="/" data-route="/" class="nav-link">How it works</a>
    <a href="/privacy" data-route="/privacy" class="nav-link">Privacy</a>
    <a href="/account" data-route="/account" class="nav-link" id="topbar-account-link">Account</a>
  </nav>

  <div class="topbar-right">
    <div id="topbar-guest-badge" class="session-badge guest">
      <span class="dot"></span>
      <span>Local guest</span>
    </div>
    <div id="topbar-user-badge" class="session-badge user" hidden>
      <span class="dot active"></span>
      <span id="topbar-user-email">user@domain.com</span>
    </div>
    <button id="clear" class="secondary compact" title="Clear current chat & results from browser memory">
      <span>Clear session</span>
    </button>
    <button id="topbar-auth-btn" class="secondary compact">
      Sign in
    </button>
  </div>
</header>

<div class="privacy-strip">
  Imported chats and summaries stay in this browser session. Only preferences can be saved locally.
</div>

<main>
  <div id="status" role="status" aria-live="polite"></div>
  <div id="session-expired-banner" class="notice warning" hidden>
    <strong>Session expired:</strong> Inactive session token expired. Current in-memory chat buffers have been cleared for privacy protection.
  </div>

  ${landing}

  <!-- 2. SIGN-IN PAGE VIEW (/login) -->
  <section id="login-view" class="page-view" hidden>
    <div class="auth-card">
      <div class="auth-header">
        <span class="badge">Local-First Authentication</span>
        <h2>Sign in to CatchUp</h2>
        <p>Your next catch-up starts here. Sign in with a secure email link, or continue as a guest.</p>
      </div>

      <div id="login-unconfigured-banner" class="notice error-notice" hidden>
        <strong>Sign-in is not configured:</strong> You can still use the local guest workspace without an account.
      </div>

      <div id="login-cooldown-banner" class="notice warning" hidden>
        <strong>Cooldown active:</strong> Please wait <span id="cooldown-seconds">45</span>s before requesting another sign-in link.
      </div>

      <div id="login-error-banner" class="notice error-notice" hidden></div>

      <form id="login-form">
        <label for="login-email">Work or Personal Email
          <input id="login-email" type="email" placeholder="name@company.com" required>
        </label>
        <p class="hint">We use your email to authenticate your profile. <strong>Your chats are never transmitted with it.</strong></p>
        
        <button type="submit" id="login-submit" class="btn primary full">
          <span>Send sign-in link →</span>
        </button>
      </form>

      <div class="auth-divider">or</div>

      <button id="login-guest-btn" class="secondary full">
        Continue in local guest mode (no account required)
      </button>

      <div class="auth-footnote">
        Supabase handles your email and sign-in session. Role preferences stay on this device. Your chats are processed in your browser.
      </div>
    </div>
  </section>

  <!-- 3. CHECK EMAIL VIEW (/auth/check-email) -->
  <section id="check-email-view" class="page-view" hidden>
    <div class="auth-card text-center">
      <div class="step-icon">✉</div>
      <h2>Check your inbox</h2>
      <p>We sent a magic sign-in link to:</p>
      <div class="email-chip"><strong id="check-email-address">user@domain.com</strong></div>
      <p class="hint">Click the link in your email to log in. Check your spam or junk folder if it does not appear within 2 minutes.</p>

      <div class="auth-actions">
        <button id="check-email-resend" class="secondary full">Resend sign-in link</button>
        <button id="check-email-change" class="quiet full">Use a different email address</button>
      </div>
    </div>
  </section>

  <!-- 4. AUTH CALLBACK VIEW (/auth/callback) -->
  <section id="callback-view" class="page-view" hidden>
    <div class="auth-card text-center">
      <div id="callback-verifying">
        <div class="spinner"></div>
        <h2>Verifying sign-in link…</h2>
        <p class="hint">Authenticating your profile and setting up your secure session.</p>
      </div>

      <div id="callback-expired" hidden>
        <div class="step-icon error">⚠</div>
        <h2>Sign-in link expired or invalid</h2>
        <p>This single-use link has expired or has already been used. Technical credentials have been purged for security.</p>
        <div class="auth-actions">
          <button id="callback-retry-btn" class="primary full">Request a fresh sign-in link</button>
          <button id="callback-guest-btn" class="secondary full">Return to Guest Workspace</button>
        </div>
      </div>
    </div>
  </section>

  <!-- 5. ACCOUNT VIEW (/account) -->
  <section id="account-view" class="page-view" hidden>
    <div class="page-heading">
      <div>
        <span class="eyebrow">IDENTITY & PREFERENCES</span>
        <h1>Your Account & Scope</h1>
        <p>Manage your account identity and personalize summary preferences for this scope.</p>
      </div>
      <span class="badge">Local-First Account</span>
    </div>

    <div class="account-grid">
      <div class="panel">
        <div class="user-profile-header">
          <div id="account-avatar" class="avatar-circle">MC</div>
          <div>
            <h2 id="account-email">user@domain.com</h2>
            <span class="badge active">Signed In</span>
          </div>
        </div>

        <div id="account-copy-guest-prompt" class="guide" hidden>
          <h3>Copy guest preferences?</h3>
          <p>We noticed you have saved preferences in guest mode. Would you like to copy them into your account?</p>
          <button id="account-copy-guest-btn" class="secondary">Copy guest preferences</button>
        </div>

        <div class="section-title margin-top">
          <div>
            <h2>Data & Storage Boundary</h2>
            <p class="hint">Chats, parsed logs, and summaries are held only in memory and never linked to your remote account.</p>
          </div>
        </div>

        <div class="account-actions">
          <button id="account-sign-out" class="secondary full">Sign out & clear memory</button>
          <button id="account-forget-device" class="quiet full">Forget preferences for this account on this device</button>
        </div>
      </div>

      <div class="panel">
        <h2>Personalization Engine Parameters</h2>
        <p class="hint">These preferences customize the LLM context filter for your account.</p>

        <form id="account-profile-form">
          <label for="account-name">Your display name in chats
            <input id="account-name" maxlength="100" required placeholder="e.g. Alex Chen">
          </label>
          <p class="hint">Matches your WhatsApp display handle to highlight direct requests.</p>

          <label for="account-role">Default Synthesis Role
            <select id="account-role">
              <option value="student">Student</option>
              <option value="developer">Developer</option>
              <option value="lead">Project lead</option>
              <option value="custom">Custom</option>
            </select>
          </label>

          <label for="account-interests">Contextual filter keywords
            <input id="account-interests" placeholder="reviews, deadlines, deploy, API">
          </label>
          <p class="hint">Comma-separated triggers for high-priority cards.</p>

          <label for="account-responsibilities">Your responsibilities
            <textarea id="account-responsibilities" maxlength="500" rows="3" placeholder="What are you responsible for?"></textarea>
          </label>

          <label for="account-length">Summary detail
            <select id="account-length">
              <option value="brief">Brief · Just the essentials</option>
              <option value="detailed">Detailed · More context</option>
            </select>
          </label>

          <button type="submit" id="account-save" class="primary full">Save account preferences</button>
        </form>
      </div>
    </div>
  </section>

  <!-- 6. WORKSPACE VIEW (IMPORT & CATCH-UP) -->
  <section id="import-view" class="page-view" hidden>
    <div class="page-heading">
      <div>
        <span class="eyebrow">YOUR CONTEXT. YOUR PRIORITIES.</span>
        <h1>Make room for what matters.</h1>
        <p>Bring a conversation. Leave the noise behind.</p>
      </div>
      <span id="workspace-scope-badge" class="badge">◈ Local profile · Guest Mode</span>
    </div>

    <div class="import-grid">
      <div>
        <section class="panel">
          <div class="section-title">
            <span class="step">1</span>
            <div>
              <h2>Your local profile</h2>
              <p>Tell CatchUp what matters to you.</p>
            </div>
          </div>

          <form id="profile">
            <label>Your name in the chat
              <input id="name" maxlength="100" required placeholder="Match your chat display name" list="participants">
              <datalist id="participants"></datalist>
            </label>
            <p class="hint">Choose an imported participant or enter your display name.</p>

            <label>Your role
              <select id="role">
                <option value="student">Student</option>
                <option value="developer">Developer</option>
                <option value="lead">Project lead</option>
                <option value="custom">Custom</option>
              </select>
            </label>

            <label>Interests & contextual filters
              <input id="interests" placeholder="Reviews, deadlines, project updates">
            </label>
            <p class="hint">Separate interests with commas.</p>

            <label>Your responsibilities
              <textarea id="responsibilities" maxlength="500" rows="3" placeholder="What are you responsible for?"></textarea>
            </label>

            <label>Summary detail
              <select id="length">
                <option value="brief">Brief · Just the essentials</option>
                <option value="detailed">Detailed · More context</option>
              </select>
            </label>

            <label class="check">
              <input id="remember" type="checkbox"> Remember preferences on this device
            </label>
            <p class="hint">This saves your profile in browser storage for this scope. Chats are never saved.</p>

            <button type="submit" class="secondary full">Apply preferences</button>
          </form>
          <button id="forget" class="quiet">Forget saved profile</button>
        </section>

        <div class="guide">
          <h3>Before you import</h3>
          <p>Export your WhatsApp conversation <strong>without media</strong>, then choose the .txt file. Unzip it first if needed.</p>
          <p>Use a conversation you have permission to process. No cloud connection is required.</p>
        </div>
      </div>

      <div class="import-right">
        <section class="panel">
          <div class="section-title">
            <span class="step">2</span>
            <div>
              <h2>Import your conversation</h2>
              <p>WhatsApp exports or plain text from another app.</p>
            </div>
          </div>

          <div class="row">
            <label>Source format
              <select id="format">
                <option value="whatsapp">WhatsApp (.txt)</option>
                <option value="plain">Plain text / other app</option>
              </select>
            </label>
            <label>Date order
              <select id="dateOrder">
                <option value="">Confirm if prompted</option>
                <option value="DMY">Day / month / year</option>
                <option value="MDY">Month / day / year</option>
              </select>
            </label>
          </div>

          <div id="drop-zone" class="upload">
            <span class="upload-icon">↥</span>
            <strong>Drop a text export here or browse files</strong>
            <span>Up to 2 MB · Read locally in your browser</span>
            <input id="file" aria-label="Choose text export" type="file" accept=".txt,text/plain">
            <span id="file-name"></span>
          </div>

          <details class="paste-box" open>
            <summary>Or paste a conversation</summary>
            <label class="sr-only" for="chat">Conversation text</label>
            <textarea id="chat" rows="5" placeholder="Paste the original text here…"></textarea>
          </details>

          <button id="parse" class="secondary">Preview import</button>
          <div id="preview"></div>

          <label>Catch up since <span class="hint">(optional · export time)</span>
            <input id="since" type="datetime-local">
          </label>
          <p class="hint">Plain text has no verified timestamps. Export times have no verified timezone.</p>
        </section>

        <section class="panel">
          <div class="section-title">
            <span class="step">3</span>
            <div>
              <h2>Choose your processing mode</h2>
              <p>Both modes keep chat processing on your device.</p>
            </div>
          </div>

          <div class="engine-grid">
            <div class="engine-card">
              <span class="badge">CONTEXTUAL AI</span>
              <h3>On-device AI</h3>
              <p>Understand decisions and actions in context with a local language model.</p>
              <p class="hint">First use downloads large model files. Requires WebGPU and enough device memory.</p>
              <button id="load" class="secondary">Enable local AI</button>
            </div>
            <div class="engine-card">
              <span class="badge">NO MODEL DOWNLOAD</span>
              <h3>Relevant excerpts</h3>
              <p>Original messages ranked by your name and interests. No inferred tasks or deadlines.</p>
              <button id="extractive" class="secondary">Use extractive mode</button>
            </div>
          </div>
          <p id="model-status" class="runtime" aria-live="polite">Extractive mode available now</p>
        </section>

        <div class="launch">
          <div>
            <h2>Ready to catch up?</h2>
            <p id="launch-status">Your sources stay one click away.</p>
          </div>
          <button id="summarize">Catch me up <span aria-hidden="true">→</span></button>
          <button id="cancel" class="quiet" hidden>Cancel</button>
        </div>
      </div>
    </div>
  </section>

  <section id="workspace-view" class="page-view" hidden>
    <div class="page-heading">
      <div>
        <span class="eyebrow">LESS SCROLLING. MORE CONTEXT.</span>
        <h1>Your catch-up workspace</h1>
        <p id="workspace-meta">Import a conversation to get started.</p>
      </div>
      <button id="configure" class="secondary">Edit context & import</button>
    </div>

    <div class="workspace-grid">
      <aside class="panel context-card">
        <span class="eyebrow">YOUR CONTEXT</span>
        <h2 id="context-name">No profile yet</h2>
        <p id="context-role"></p>
        <p id="context-interests" class="hint"></p>
        <button id="edit-profile" class="secondary full">Edit preferences</button>
        <div class="guide">
          <strong>Verify every takeaway</strong>
          <p>Open a citation to inspect the exact source. AI can miss context or make mistakes.</p>
        </div>
      </aside>

      <section class="source-panel">
        <div class="source-heading">
          <h2>Conversation</h2>
          <p id="source-count">No messages imported</p>
          <label class="sr-only" for="source-search">Filter source messages</label>
          <input id="source-search" placeholder="Filter by participant or keyword">
        </div>
        <div id="source-feed" class="source-feed">
          <p class="empty">Your imported messages will appear here.</p>
        </div>
        <button id="more-sources" class="quiet full" hidden>Show more messages</button>
      </section>

      <section id="results" aria-live="polite">
        <div class="panel empty">
          <span class="empty-icon">▤</span>
          <h2>A little less noise.</h2>
          <p>Import a conversation and choose your context to create your first brief.</p>
        </div>
      </section>
    </div>
  </section>

  <!-- 7. PRIVACY & DATA FLOW VIEW (/privacy) -->
  <section id="privacy-view" class="page-view" hidden>
    <div class="page-heading">
      <div>
        <span class="eyebrow">PRIVACY & DATA FLOW ARCHITECTURE</span>
        <h1>Your conversation stays on this device.</h1>
        <p>What stays here, what gets stored, and what connects to the internet.</p>
      </div>
      <span class="badge">On-device chat processing</span>
    </div>

    <div class="privacy-whitepaper">
      <div class="privacy-grid">
        <article class="panel">
          <span class="step-num">01</span>
          <h2>Chat Text & Parsed Summaries</h2>
          <p class="badge warning">Ephemeral RAM Isolation</p>
          <p>Imported messages and results are held in browser memory and displayed on this page. Parsing and ranking run locally; local AI runs in a browser worker.</p>
          <p>They are never written to persistent cookies, <code>localStorage</code>, or transmitted across network sockets.</p>
        </article>

        <article class="panel">
          <span class="step-num">02</span>
          <h2>User Preferences & Profile</h2>
          <p class="badge">Optional LocalStorage</p>
          <p>Saving preferences is strictly opt-in ("Remember preferences on this device"). It stores only non-sensitive personalization parameters: display name, role archetype, and keyword filters.</p>
          <p>Preferences are isolated per authenticated user ID and guest scope. No chat lines or extracted quotes are stored.</p>
        </article>

        <article class="panel">
          <span class="step-num">03</span>
          <h2>Identity & Managed Authentication</h2>
          <p class="badge">Isolated Auth Provider</p>
          <p>Supabase handles your email, authentication requests, and session tokens. CatchUp does not send imported chats, summaries, or role preferences to the authentication service.</p>
        </article>

        <article class="panel">
          <span class="step-num">04</span>
          <h2>Neural Weights & WebGPU</h2>
          <p class="badge">IndexedDB Cache</p>
          <p>Enabling local AI downloads open model weights directly from static artifact hosts. Model files are cached in browser <code>IndexedDB</code> so subsequent runs work completely offline.</p>
        </article>
      </div>

      <div class="panel margin-top">
        <h2>What "Clear Session" DOES and DOES NOT Do</h2>
        <div class="two-col-grid">
          <div class="guide">
            <h3>✓ What "Clear Session" DOES</h3>
            <ul>
              <li>Hard-terminates background Web Worker threads.</li>
              <li>Nullifies all in-memory JavaScript references to chat buffers.</li>
              <li>Wipes rendered DOM nodes, citations, and summary cards.</li>
            </ul>
          </div>
          <div class="guide warning-guide">
            <h3>⚠ What It Does NOT Do</h3>
            <ul>
              <li>Does NOT perform physical hardware DRAM cryptographic shredding (browser JS cannot bypass OS memory controls).</li>
              <li>Does NOT delete your original <code>.txt</code> export file on your disk.</li>
              <li>Does NOT automatically delete downloaded model files from browser storage.</li>
            </ul>
          </div>
        </div>

        <div class="cache-control-strip">
          <div>
            <strong>Local Model Storage Cache</strong>
            <p class="hint">Stored in browser IndexedDB for offline WebGPU inference.</p>
          </div>
          <button id="purge-cache-btn" class="secondary">Purge Model Cache</button>
          <span id="purge-cache-status" class="hint" hidden>Cache cleared!</span>
        </div>
      </div>

      <div class="panel margin-top">
        <h2>60-Second DevTools Verification</h2>
        <p>You do not need to take our privacy claims on faith. Verify them yourself:</p>
        <ol class="guide-list">
          <li><strong>Network inspection:</strong> Open Browser DevTools (F12) → Network tab → Filter Fetch/XHR. Import a chat and generate a brief. Notice <code>POST</code> network requests remain exactly <strong>0</strong>.</li>
          <li><strong>Storage inspection:</strong> Open Application/Storage tab → LocalStorage. Verify no chat text or summary lines exist.</li>
          <li><strong>Offline test:</strong> Enable Airplane Mode. Import a file and click "Catch me up". Inference executes cleanly offline once assets are cached.</li>
        </ol>
      </div>
    </div>
  </section>

  <footer>
    <div class="footer-content">
      <span>CatchUp · Back in the loop. On your terms.</span>
      <span>Zero-cloud chat processing. Local profiles & managed authentication.</span>
    </div>
  </footer>
</main>
`;
