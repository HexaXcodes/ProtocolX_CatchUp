// Original decorative SVG and static product copy. No sample chats or invented results.
export const landing = `
<section id="landing-view" class="page-view" hidden>
  <div class="cinema-hero">
    <div class="hero-art" aria-hidden="true">
      <div class="sun-halo"></div>
      <svg class="hero-emblem" viewBox="0 0 600 560" fill="none">
        <defs>
          <linearGradient id="emblem-face" x1="160" y1="100" x2="400" y2="450" gradientUnits="userSpaceOnUse"><stop stop-color="#d3ffb5"/><stop offset=".24" stop-color="#65e59d"/><stop offset=".55" stop-color="#15977b"/><stop offset="1" stop-color="#064c41"/></linearGradient>
          <linearGradient id="emblem-edge" x1="130" y1="150" x2="400" y2="470" gradientUnits="userSpaceOnUse"><stop stop-color="#3cc998"/><stop offset=".5" stop-color="#063e34"/><stop offset="1" stop-color="#0d7963"/></linearGradient>
          <linearGradient id="orbit-light"><stop stop-color="#e3a94d" stop-opacity=".12"/><stop offset=".5" stop-color="#ffe0a0"/><stop offset="1" stop-color="#f2bc59"/></linearGradient>
          <radialGradient id="particle-light"><stop stop-color="#fff9df"/><stop offset=".4" stop-color="#ffdc83"/><stop offset="1" stop-color="#eaa945" stop-opacity="0"/></radialGradient>
          <filter id="emblem-shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="22" stdDeviation="18" flood-color="#001d16" flood-opacity=".7"/></filter>
        </defs>
        <g opacity=".65" stroke="#b6e2c9"><path d="M78 135h74v37H99l-15 11v-11h-6z" fill="#317464" fill-opacity=".3"/><path d="M460 371h65v32h-12v11l-17-11h-36z" fill="#317464" fill-opacity=".3"/></g>
        <ellipse cx="302" cy="284" rx="239" ry="85" transform="rotate(-31 302 284)" stroke="url(#orbit-light)" stroke-width="1.5" stroke-dasharray="2 7"/>
        <g filter="url(#emblem-shadow)">
          <path d="M408 161 A161 161 0 1 0 408 406" stroke="url(#emblem-edge)" stroke-width="78" stroke-linecap="round"/>
          <path d="M396 141 A161 161 0 1 0 396 386" stroke="url(#emblem-face)" stroke-width="70" stroke-linecap="round"/>
          <path d="M391 117 A174 174 0 1 0 391 408" stroke="#ccffbe" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>
        </g>
        <path d="M92 384 C165 425 446 286 509 172" stroke="url(#orbit-light)" stroke-width="3" stroke-linecap="round"/>
        <circle cx="478" cy="221" r="32" fill="url(#particle-light)"/><circle cx="478" cy="221" r="9" fill="#fff1bc"/>
        <g fill="#f9dda0"><circle cx="121" cy="298" r="2"/><circle cx="466" cy="122" r="2"/><circle cx="408" cy="451" r="1.5"/><circle cx="196" cy="72" r="1.5"/><circle cx="535" cy="297" r="2"/><circle cx="94" cy="431" r="1"/><circle cx="363" cy="70" r="1"/><circle cx="192" cy="477" r="2"/></g>
      </svg>
      <span class="art-caption">A little clarity. A lot more headspace.</span>
    </div>
    <div class="hero-copy">
      <span class="hero-kicker"><span></span> YOUR CHATS. YOUR CONTEXT. YOUR DEVICE.</span>
      <h1>What did<br> I <span>miss?</span></h1>
      <p class="cinema-subhead">Back in the loop.<br>On your terms.</p>
      <p class="cinema-description"><strong>Local AI</strong> turns busy chats into a brief shaped by <strong>your role</strong>. Find actions, decisions, and updates—and check the original messages.</p>
      <div class="hero-actions">
        <a href="/workspace" data-route="/workspace" class="btn primary">Start catching up <span aria-hidden="true">↗</span></a>
        <a href="/login" data-route="/login" class="btn secondary">Sign in</a>
      </div>
      <p class="cinema-reassurance">No account needed · WhatsApp text exports welcome</p>
    </div>
  </div>
  <div class="ticker-ribbon-wrapper">
    <div class="ticker-ribbon" tabindex="0" aria-label="CatchUp features">
      ${[false, true].map(duplicate => `<div class="ticker-track"${duplicate ? ' aria-hidden="true"' : ''}>${['On-device chat processing', 'Role-aware priorities', 'Source-linked takeaways', 'Actions & decisions', 'Your context comes first'].map(label => `<div class="ticker-item"><span aria-hidden="true">✦</span>${label}</div>`).join('')}</div>`).join('')}
    </div>
    <button id="ticker-toggle" class="ticker-toggle-btn" aria-label="Pause feature ticker" aria-pressed="false"><span class="pause-icon" aria-hidden="true">Ⅱ</span></button>
  </div>
  <div id="how-it-works" class="section-block cinema-process">
    <div class="section-intro"><span class="eyebrow">LESS SCROLLING. MORE CLARITY.</span><h2>Your next step,<br>without the endless scroll.</h2><p>One simple flow, built around the part you play in the conversation.</p></div>
    <div class="three-step-grid">
      <article class="step-card"><span class="step-num">01 / BRING THE CHAT</span><h3>Pick up where you left off.</h3><p>Import a WhatsApp .txt export without media, or paste text from another messaging app.</p><span class="step-detail">Text in. Noise out.</span></article>
      <article class="step-card"><span class="step-num">02 / MAKE IT YOURS</span><h3>A different role.<br>A different perspective.</h3><p>Set your name, role, and interests. Focus on the updates that relate to your responsibilities.</p><span class="step-detail">Student · Developer · Lead · Custom</span></article>
      <article class="step-card"><span class="step-num">03 / GET YOUR BEARINGS</span><h3>See the takeaway.<br>Check the source.</h3><p>Use local AI for a brief, or start immediately with ranked original excerpts. Follow citations back to the conversation.</p><span class="step-detail">Clarity you can check.</span></article>
    </div>
  </div>
  <div class="privacy-feature">
    <div class="privacy-symbol" aria-hidden="true">↳</div>
    <div><span class="eyebrow">PRIVATE CONVERSATIONS STAY CLOSE</span><h2>Your chat doesn't need<br>a trip to the cloud.</h2><p>Chat processing runs in your browser. Optional sign-in uses Supabase for your email and session; saved role preferences stay on this device. Enabling AI downloads model files.</p><a href="/privacy" data-route="/privacy" class="text-link">See exactly what stays local <span aria-hidden="true">↗</span></a></div>
  </div>
  <div class="section-block cinema-faq"><span class="eyebrow">A FEW THINGS TO KNOW</span><h2>Clear before you begin.</h2><div class="faq-grid">
    <article class="faq-card"><h3>Does it connect to WhatsApp?</h3><p>Use a text export. CatchUp does not connect to your WhatsApp account or automatically read unread messages.</p></article>
    <article class="faq-card"><h3>What if local AI isn't available?</h3><p>Extractive mode ranks original messages without downloading a model. AI needs a compatible device and an initial model download.</p></article>
    <article class="faq-card"><h3>Can the summary get things wrong?</h3><p>Yes. Check the linked messages before acting on a takeaway, especially a deadline or an assignment.</p></article>
    <article class="faq-card"><h3>Do I need to sign in?</h3><p>No. Guest mode is ready to use. Optional sign-in separates your saved local preferences by account on this device.</p></article>
  </div></div>
  <div class="cta-box"><span class="eyebrow">READY WHEN YOU ARE</span><h2>Less catching up.<br>More moving forward.</h2><a href="/workspace" data-route="/workspace" class="btn primary">Bring your first conversation ↗</a></div>
</section>`;
