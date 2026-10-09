import './style.css';
import './stitch.css';
import './cinematic.css';
import { shell } from './shell';
import {
  parseChat,
  ChatParseError,
  MAX_INPUT_BYTES,
  createBrief,
  BrowserModel,
  loadProfile,
  saveProfile,
  forgetProfile,
  validateProfile,
  type Profile,
  type ParsedChat,
  type Brief,
} from '../../backend/src/index';

import {
  isAuthConfigured,
  signInWithEmail,
  signOutUser,
  getCurrentUser,
  getCurrentSession,
  onAuthStateChange,
  validateRedirectDestination,
  getInitialsFromEmail,
} from './auth';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = shell;

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const value = (id: string) => (el<HTMLInputElement>(id) ? el<HTMLInputElement>(id).value : '');

let parsed: ParsedChat | null = null;
let model: BrowserModel | null = null;
let ready = false, loading = false;
let controller: AbortController | null = null;
let runEpoch = 0, loadEpoch = 0, fileEpoch = 0, sourceLimit = 100;

let currentUserId: string | null = null;
let currentUserEmail: string | null = null;
let pendingSentEmail: string | null = null;
let cooldownTimer: number | null = null;

const status = (message: string) => {
  const statusEl = el('status');
  if (statusEl) statusEl.textContent = message;
  const launchStatusEl = el('launch-status');
  if (launchStatusEl) launchStatusEl.textContent = message;
};

// Route & View Management
type RoutePath = '/' | '/workspace' | '/login' | '/auth/check-email' | '/auth/callback' | '/account' | '/privacy';

function navigateTo(path: string, options?: { replace?: boolean }) {
  const validPath = validateRedirectDestination(path) as RoutePath;
  if (options?.replace) {
    window.history.replaceState({}, '', validPath);
  } else {
    window.history.pushState({}, '', validPath);
  }
  updateRoute();
}

function updateRoute() {
  const path = (window.location.pathname || '/') as RoutePath;
  const hash = window.location.hash;

  // Handle hash callbacks if Supabase returned tokens in fragment
  if (hash && (hash.includes('access_token=') || hash.includes('error='))) {
    if (path !== '/auth/callback') {
      window.history.replaceState({}, '', `/auth/callback${hash}`);
    }
  }

  const currentPath = window.location.pathname as RoutePath;
  showView(currentPath);
}

function showView(targetPath: string, options?: { forceView?: 'import-view' | 'workspace-view' }) {
  let viewName = 'landing-view';

  if (targetPath === '/workspace') {
    viewName = options?.forceView ? options.forceView : (parsed ? 'workspace-view' : 'import-view');
  } else if (targetPath === '/login') {
    viewName = 'login-view';
  } else if (targetPath === '/auth/check-email') {
    viewName = 'check-email-view';
  } else if (targetPath === '/auth/callback') {
    viewName = 'callback-view';
  } else if (targetPath === '/account') {
    if (!currentUserId) {
      // Guard protected route: redirect signed-out users to login
      navigateTo('/login', { replace: true });
      return;
    }
    viewName = 'account-view';
  } else if (targetPath === '/privacy') {
    viewName = 'privacy-view';
  } else {
    viewName = 'landing-view';
  }

  document.querySelectorAll<HTMLElement>('.page-view').forEach(section => {
    section.hidden = section.id !== viewName;
  });
  document.body.dataset.view = viewName;
  window.onmousemove = null;
  if (viewName !== 'landing-view') el('catchup-intro-overlay').hidden = true;

  // Update navbar links active state
  document.querySelectorAll<HTMLAnchorElement>('.nav-link').forEach(link => {
    const route = link.getAttribute('data-route');
    const isActive = route === targetPath || (route === '/workspace' && (viewName === 'import-view' || viewName === 'workspace-view'));
    link.classList.toggle('active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  // Special view setup & Landing features
  if (viewName === 'landing-view') {
    setupLandingFeatures();
  } else if (viewName === 'login-view') {
    setupLoginView();
  } else if (viewName === 'check-email-view') {
    setupCheckEmailView();
  } else if (viewName === 'callback-view') {
    setupCallbackView();
  } else if (viewName === 'account-view') {
    setupAccountView();
  }

  window.scrollTo({ top: 0, behavior: 'instant' });
}

// 1. Landing Features: C Mark Intro, Ticker Toggle, and Pointer Parallax
function setupLandingFeatures() {
  const introOverlay = el('catchup-intro-overlay');
  const skipBtn = el('skip-intro');

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let hasSeenIntro = true;
  try { hasSeenIntro = sessionStorage.getItem('catchup_intro_seen') === 'true'; } catch { /* Storage may be blocked; skip decoration. */ }

  if (introOverlay) {
    if (!hasSeenIntro && !prefersReducedMotion && window.location.pathname === '/') {
      introOverlay.hidden = false;
      try { sessionStorage.setItem('catchup_intro_seen', 'true'); } catch { /* Nonessential preference. */ }

      const dismissIntro = () => {
        introOverlay.classList.add('fade-out');
        setTimeout(() => {
          introOverlay.hidden = true;
          introOverlay.classList.remove('fade-out');
        }, 400);
      };

      const timerId = setTimeout(dismissIntro, 1800);

      if (skipBtn) {
        skipBtn.onclick = () => {
          clearTimeout(timerId);
          dismissIntro();
        };
      }
    } else {
      introOverlay.hidden = true;
    }
  }

  // Feature Ticker Pause / Resume button
  const tickerToggleBtn = el('ticker-toggle');
  const tickerWrapper = document.querySelector('.ticker-ribbon-wrapper');
  if (tickerToggleBtn && tickerWrapper) {
    tickerToggleBtn.onclick = () => {
      const isPaused = tickerWrapper.classList.toggle('paused');
      const pauseIcon = tickerToggleBtn.querySelector('.pause-icon');
      if (pauseIcon) pauseIcon.textContent = isPaused ? '▶' : '⏸';
      tickerToggleBtn.setAttribute('aria-label', isPaused ? 'Resume feature ticker' : 'Pause feature ticker');
      tickerToggleBtn.setAttribute('aria-pressed', String(isPaused));
    };
  }

  // Pointer Parallax (4-8px) on decorative elements
  const bubbles = document.querySelector<HTMLElement>('.hero-bg-bubbles');
  if (bubbles && !prefersReducedMotion && !('ontouchstart' in window)) {
    window.onmousemove = (e: MouseEvent) => {
      const moveX = (e.clientX / window.innerWidth - 0.5) * 8;
      const moveY = (e.clientY / window.innerHeight - 0.5) * 8;
      bubbles.style.transform = `translate(${moveX}px, ${moveY}px)`;
    };
  }
}

function p(text: string, className = '') {
  const node = document.createElement('p');
  node.textContent = text;
  node.className = className;
  return node;
}

function getProfileFormValues(prefix: string = ''): Profile {
  const nameId = prefix ? `${prefix}-name` : 'name';
  const roleId = prefix ? `${prefix}-role` : 'role';
  const interestsId = prefix ? `${prefix}-interests` : 'interests';
  const respId = prefix ? `${prefix}-responsibilities` : 'responsibilities';
  const lenId = prefix ? `${prefix}-length` : 'length';

  return validateProfile({
    name: value(nameId),
    role: value(roleId),
    interests: value(interestsId).split(',').map(i => i.trim()).filter(Boolean),
    responsibilities: value(respId),
    length: value(lenId),
  });
}

function populateProfileForm(profile: Profile, prefix: string = '') {
  const nameId = prefix ? `${prefix}-name` : 'name';
  const roleId = prefix ? `${prefix}-role` : 'role';
  const interestsId = prefix ? `${prefix}-interests` : 'interests';
  const respId = prefix ? `${prefix}-responsibilities` : 'responsibilities';
  const lenId = prefix ? `${prefix}-length` : 'length';

  if (el<HTMLInputElement>(nameId)) el<HTMLInputElement>(nameId).value = profile.name;
  if (el<HTMLSelectElement>(roleId)) el<HTMLSelectElement>(roleId).value = profile.role;
  if (el<HTMLInputElement>(interestsId)) el<HTMLInputElement>(interestsId).value = profile.interests.join(', ');
  if (el<HTMLTextAreaElement>(respId)) el<HTMLTextAreaElement>(respId).value = profile.responsibilities;
  if (el<HTMLSelectElement>(lenId)) el<HTMLSelectElement>(lenId).value = profile.length;
}

function profile(): Profile {
  return getProfileFormValues();
}

function controls() {
  if (el<HTMLButtonElement>('summarize')) el<HTMLButtonElement>('summarize').disabled = loading || !!controller;
  if (el<HTMLButtonElement>('load')) el<HTMLButtonElement>('load').disabled = loading || !!controller;
  if (el('cancel')) el('cancel').hidden = !loading && !controller;
  if (el('runtime-label')) {
    el('runtime-label').textContent = loading
      ? 'Loading local AI…'
      : controller
      ? 'Processing on device…'
      : ready
      ? 'Local AI ready'
      : 'Extractive mode available';
  }
}

function stopModel() {
  loadEpoch++;
  model?.dispose();
  model = null;
  ready = false;
  loading = false;
}

function cancelRun() {
  runEpoch++;
  if (controller) {
    controller.abort();
    controller = null;
    stopModel();
    if (el('model-status')) el('model-status').textContent = 'AI stopped. Enable local AI to reload.';
  }
  controls();
}

function resetResults() {
  if (el('results')) {
    el('results').replaceChildren(p('Import a conversation, choose your context, and select Catch me up. Your brief will appear here.', 'empty'));
  }
  if (el('workspace-meta')) el('workspace-meta').textContent = 'Generate a new brief after changing your context.';
}

function renderSources() {
  if (!el('source-feed')) return;
  const query = value('source-search').trim().toLocaleLowerCase();
  const messages = (parsed?.messages ?? []).filter(m => `${m.author} ${m.text}`.toLocaleLowerCase().includes(query));
  if (el('source-count')) el('source-count').textContent = `${messages.length} messages${query ? ' matching filter' : ''}`;
  el('source-feed').replaceChildren(
    ...messages.slice(0, sourceLimit).map(m => {
      const card = document.createElement('article');
      card.id = `source-${m.id}`;
      card.className = `chat-message${m.author === value('name').trim() && m.author !== 'Unknown' ? ' mine' : ''}`;
      const meta = document.createElement('span');
      meta.className = 'message-meta';
      meta.textContent = `${m.author} · ${m.timestamp ?? 'Unknown time'} · ${m.id}`;
      card.append(meta, document.createTextNode(m.text));
      return card;
    })
  );
  if (!messages.length) el('source-feed').append(p('Your source messages will appear here.', 'empty'));
  if (el('more-sources')) el('more-sources').hidden = messages.length <= sourceLimit;
}

function invalidateImport() {
  cancelRun();
  parsed = null;
  sourceLimit = 100;
  if (el('preview')) el('preview').replaceChildren();
  if (el('participants')) el('participants').replaceChildren();
  resetResults();
  renderSources();
}

function parse(): ParsedChat {
  try {
    const chat = parseChat(value('chat'), {
      format: value('format') as 'whatsapp' | 'plain',
      dateOrder: (value('dateOrder') || undefined) as 'DMY' | 'MDY' | undefined,
    });
    parsed = chat;

    // Auto-fill participant display name if empty
    if (!value('name').trim() && chat.participants.length > 0) {
      if (el<HTMLInputElement>('name')) el<HTMLInputElement>('name').value = chat.participants[0];
    }

    if (el('participants')) {
      el('participants').replaceChildren(
        ...chat.participants.map(name => {
          const option = document.createElement('option');
          option.value = name;
          return option;
        })
      );
    }
    if (el('preview')) {
      el('preview').replaceChildren(
        p(`${chat.messages.length} messages · ${chat.participants.length} participants`, 'badge'),
        ...chat.warnings.map(w => p(w, 'hint'))
      );
      const details = document.createElement('details'), summary = document.createElement('summary');
      summary.textContent = 'Check first 5 parsed messages';
      details.append(summary);
      for (const m of chat.messages.slice(0, 5)) {
        details.append(p(`${m.author} · ${m.timestamp ?? 'Unknown time'}\n${m.text}`, 'source'));
      }
      el('preview').append(details);
    }
    renderSources();
    return chat;
  } catch (error) {
    if ((error as { code?: string }).code === 'DATE_ORDER_REQUIRED') {
      el('dateOrder')?.focus();
    }
    throw error;
  }
}

function renderBrief(brief: Brief, chat: ParsedChat, currentProfile: Profile) {
  const results = el('results');
  if (!results) return;
  results.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = brief.mode === 'ai' ? 'Your catch-up brief' : 'Relevant excerpts';
  results.append(heading);
  if (brief.mode === 'extractive') results.append(p('Extractive mode · AI summary unavailable', 'badge'));
  results.append(p(`${brief.stats.analyzedMessages} / ${brief.stats.selectedMessages} selected messages analyzed · ${brief.stats.elapsedMs} ms`, 'muted'));
  for (const warning of [...chat.warnings, ...brief.warnings]) results.append(p(warning, 'notice'));
  if (!brief.items.length) results.append(p('No updates found in this window. Try a wider range and check the source conversation.', 'empty'));
  for (const category of ['actions', 'decisions', 'updates'] as const) {
    const items = brief.items.filter(i => i.category === category);
    if (!items.length) continue;
    const title = document.createElement('h3');
    title.textContent = { actions: 'Your actions', decisions: 'Decisions made', updates: 'Relevant updates' }[category];
    results.append(title);
    for (const item of items) {
      const card = document.createElement('article');
      card.className = 'panel result';
      card.append(
        p(item.priority === 'high' ? 'HIGH PRIORITY · VERIFY SOURCE' : 'FOR YOUR CONTEXT', 'eyebrow'),
        p(item.text),
        p(item.reason, 'muted')
      );
      if (item.deadlineQuote) card.append(p(`Deadline wording: ${item.deadlineQuote}`, 'small'));
      const details = document.createElement('details'), summary = document.createElement('summary');
      summary.textContent = `View ${item.sourceIds.length} source message(s)`;
      details.append(summary);
      for (const id of item.sourceIds) {
        const source = chat.messages.find(m => m.id === id)!;
        details.append(p(`${source.author} · ${source.timestamp ?? 'Unknown time'} · ${source.id}\n${source.text}`, 'source'));
        const button = document.createElement('button');
        button.className = 'secondary citation';
        button.textContent = `Locate ${id} in conversation`;
        button.addEventListener('click', () => {
          el<HTMLInputElement>('source-search').value = '';
          sourceLimit = Math.max(sourceLimit, chat.messages.findIndex(m => m.id === id) + 1);
          renderSources();
          const target = el(`source-${id}`);
          if (target) {
            target.classList.add('spotlight');
            target.scrollIntoView({
              block: 'center',
              behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
            });
          }
        });
        details.append(button);
      }
      card.append(details);
      results.append(card);
    }
  }
  if (el('context-name')) el('context-name').textContent = currentProfile.name;
  if (el('context-role')) el('context-role').textContent = `Role: ${currentProfile.role}`;
  if (el('context-interests')) {
    el('context-interests').textContent =
      [...currentProfile.interests, currentProfile.responsibilities].filter(Boolean).join(' · ') || 'Using role-based interests.';
  }
  if (el('workspace-meta')) {
    el('workspace-meta').textContent = `${brief.mode === 'ai' ? 'Local AI brief' : 'Extractive mode'} · ${
      brief.stats.selectedMessages
    } selected messages · ${brief.stats.elapsedMs} ms`;
  }
  showView('/workspace');
  renderSources();
  results.classList.remove('reveal');
  void results.offsetWidth;
  results.classList.add('reveal');
}

// User & Session Updates
async function updateSessionState() {
  const user = await getCurrentUser();
  const oldUserId = currentUserId;
  currentUserId = user?.id ?? null;
  currentUserEmail = user?.email ?? null;

  const isGuest = !currentUserId;
  const guestBadge = el('topbar-guest-badge');
  const userBadge = el('topbar-user-badge');
  const userEmailEl = el('topbar-user-email');
  const authBtn = el('topbar-auth-btn');
  const scopeBadge = el('workspace-scope-badge');

  if (isGuest) {
    if (userEmailEl) userEmailEl.textContent = '';
    if (guestBadge) guestBadge.hidden = false;
    if (userBadge) userBadge.hidden = true;
    if (authBtn) {
      authBtn.textContent = 'Sign in';
      authBtn.setAttribute('data-action', 'login');
    }
    if (scopeBadge) scopeBadge.textContent = '◈ Local profile · Guest Mode';
  } else {
    if (guestBadge) guestBadge.hidden = true;
    if (userBadge) userBadge.hidden = false;
    if (userEmailEl) userEmailEl.textContent = currentUserEmail || 'Account active';
    if (authBtn) {
      authBtn.textContent = 'Account';
      authBtn.setAttribute('data-action', 'account');
    }
    if (scopeBadge) scopeBadge.textContent = `◈ Signed in as ${currentUserEmail}`;
  }

  // If session scope changed, clear chat memory and reload target scope profile
  if (oldUserId !== currentUserId && oldUserId !== undefined) {
    fileEpoch++;
    cancelRun();
    stopModel();
    invalidateImport();
    // Clear raw text and search fields as well as parsed results on account changes.
    for (const id of ['chat', 'file', 'since', 'source-search']) {
      const input = el<HTMLInputElement>(id);
      if (input) input.value = '';
    }
    el('file-name').textContent = '';
    el('account-email').textContent = '';
    populateProfileForm({ name: '', role: 'student', interests: [], responsibilities: '', length: 'brief' }, 'account');
    status(isGuest ? 'Signed out. Switched to local guest scope.' : 'Signed in. Loaded account scope.');
  }

  // Load saved preferences for current scope
  const saved = loadProfile(currentUserId);
  if (saved) {
    populateProfileForm(saved, '');
    if (el<HTMLInputElement>('remember')) el<HTMLInputElement>('remember').checked = true;
  } else {
    if (oldUserId !== currentUserId) {
      populateProfileForm({ name: '', role: 'student', interests: [], responsibilities: '', length: 'brief' }, '');
    }
    if (el<HTMLInputElement>('remember')) el<HTMLInputElement>('remember').checked = false;
  }
}

// View Initializers
function setupLoginView() {
  const configured = isAuthConfigured();
  const unconfiguredBanner = el('login-unconfigured-banner');
  const submitBtn = el<HTMLButtonElement>('login-submit');

  if (unconfiguredBanner) unconfiguredBanner.hidden = configured;
  if (submitBtn) submitBtn.disabled = !configured;

  if (!configured && submitBtn) {
    submitBtn.textContent = 'Sign-in is not configured';
  }
}

function setupCheckEmailView() {
  if (el('check-email-address') && pendingSentEmail) {
    el('check-email-address').textContent = pendingSentEmail;
  }
}

async function setupCallbackView() {
  const verifyingEl = el('callback-verifying');
  const expiredEl = el('callback-expired');

  if (verifyingEl) verifyingEl.hidden = false;
  if (expiredEl) expiredEl.hidden = true;

  try {
    const session = await getCurrentSession();
    if (session) {
      // Clean token fragments from address bar
      window.history.replaceState({}, document.title, '/workspace');
      await updateSessionState();
      status('Authentication successful! Welcome back.');
      navigateTo('/workspace', { replace: true });
      return;
    }

    // Check if URL hash indicates error
    const hash = window.location.hash;
    if (hash && (hash.includes('error=') || hash.includes('error_code='))) {
      throw new Error('Link expired or invalid.');
    }

    // Short wait to allow Supabase listener to finish token exchange
    setTimeout(async () => {
      const recheck = await getCurrentSession();
      if (recheck) {
        window.history.replaceState({}, document.title, '/workspace');
        await updateSessionState();
        navigateTo('/workspace', { replace: true });
      } else {
        if (verifyingEl) verifyingEl.hidden = true;
        if (expiredEl) expiredEl.hidden = false;
      }
    }, 1500);
  } catch (err) {
    if (window.location.pathname === '/auth/callback') {
      window.history.replaceState({}, document.title, '/auth/callback');
    }
    if (verifyingEl) verifyingEl.hidden = true;
    if (expiredEl) expiredEl.hidden = false;
  }
}

function setupAccountView() {
  if (el('account-email')) el('account-email').textContent = currentUserEmail || 'Signed In';
  if (el('account-avatar')) el('account-avatar').textContent = getInitialsFromEmail(currentUserEmail, value('name'));

  const accountSaved = loadProfile(currentUserId);
  if (accountSaved) {
    populateProfileForm(accountSaved, 'account');
  } else {
    const currentWorkspaceProfile = profile();
    populateProfileForm(currentWorkspaceProfile, 'account');
  }

  // Check if guest preferences exist that could be copied
  const guestSaved = loadProfile(null);
  const copyPrompt = el('account-copy-guest-prompt');
  if (copyPrompt) {
    copyPrompt.hidden = !guestSaved || !!accountSaved;
  }
}

// Event Listeners Initialization
function initEventListeners() {
  // Navigation Links Routing
  document.addEventListener('click', event => {
    const target = event.target as HTMLElement;
    const link = target.closest<HTMLAnchorElement>('[data-route], a[href^="/"]');
    if (link) {
      const route = link.getAttribute('data-route') || link.getAttribute('href');
      if (route && route.startsWith('/')) {
        event.preventDefault();
        navigateTo(route);
      }
    }
  });

  window.addEventListener('popstate', () => updateRoute());

  // Topbar Actions
  if (el('topbar-auth-btn')) {
    el('topbar-auth-btn').addEventListener('click', () => {
      const action = el('topbar-auth-btn').getAttribute('data-action');
      if (action === 'account') {
        navigateTo('/account');
      } else {
        navigateTo('/login');
      }
    });
  }

  // Login Form
  if (el('login-form')) {
    el('login-form').addEventListener('submit', async event => {
      event.preventDefault();
      const email = value('login-email').trim();
      const submitBtn = el<HTMLButtonElement>('login-submit');
      const errorBanner = el('login-error-banner');

      if (!email) return;
      if (submitBtn) submitBtn.disabled = true;
      if (errorBanner) errorBanner.hidden = true;

      try {
        const { error } = await signInWithEmail(email);
        if (error) {
          if (error.message.includes('rate limit') || error.message.includes('429')) {
            startCooldownTimer(45);
          } else {
            throw error;
          }
        } else {
          pendingSentEmail = email;
          navigateTo('/auth/check-email');
        }
      } catch (err) {
        if (errorBanner) {
          errorBanner.textContent = (err as Error).message;
          errorBanner.hidden = false;
        }
      } finally {
        if (submitBtn) submitBtn.disabled = !isAuthConfigured();
      }
    });
  }

  if (el('login-guest-btn')) {
    el('login-guest-btn').addEventListener('click', () => {
      navigateTo('/workspace');
    });
  }

  // Check Email Actions
  if (el('check-email-resend')) {
    el('check-email-resend').addEventListener('click', async () => {
      if (!pendingSentEmail) return;
      status('Resending sign-in link…');
      const { error } = await signInWithEmail(pendingSentEmail);
      if (error) {
        status(`Resend failed: ${error.message}`);
      } else {
        status('Fresh sign-in link sent to your inbox.');
      }
    });
  }

  if (el('check-email-change')) {
    el('check-email-change').addEventListener('click', () => {
      navigateTo('/login');
    });
  }

  // Callback Actions
  if (el('callback-retry-btn')) {
    el('callback-retry-btn').addEventListener('click', () => navigateTo('/login'));
  }
  if (el('callback-guest-btn')) {
    el('callback-guest-btn').addEventListener('click', () => navigateTo('/workspace'));
  }

  // Account View Actions
  if (el('account-profile-form')) {
    el('account-profile-form').addEventListener('submit', event => {
      event.preventDefault();
      try {
        const updated = getProfileFormValues('account');
        saveProfile(updated, currentUserId);
        populateProfileForm(updated, ''); // sync to workspace form
        status('Account preferences saved.');
      } catch (err) {
        status((err as Error).message);
      }
    });
  }

  if (el('account-sign-out')) {
    el('account-sign-out').addEventListener('click', async () => {
      const button = el<HTMLButtonElement>('account-sign-out');
      button.disabled = true;
      try {
      fileEpoch++;
      cancelRun();
      stopModel();
      invalidateImport();
      for (const id of ['chat', 'file', 'since', 'source-search']) el<HTMLInputElement>(id).value = '';
      el('file-name').textContent = '';
      const { error } = await signOutUser();
      if (error) throw error;
      await updateSessionState();
      navigateTo('/', { replace: true });
      status('Signed out successfully. Session memory cleared.');
      } catch {
        status('Chat cleared, but sign-out could not be confirmed. Check your connection and retry.');
      } finally {
        button.disabled = false;
      }
    });
  }

  if (el('account-forget-device')) {
    el('account-forget-device').addEventListener('click', () => {
      forgetProfile(currentUserId);
      status('Account preferences removed from this device.');
    });
  }

  if (el('account-copy-guest-btn')) {
    el('account-copy-guest-btn').addEventListener('click', () => {
      const guestSaved = loadProfile(null);
      if (guestSaved) {
        saveProfile(guestSaved, currentUserId);
        populateProfileForm(guestSaved, 'account');
        populateProfileForm(guestSaved, '');
        if (el('account-copy-guest-prompt')) el('account-copy-guest-prompt').hidden = true;
        status('Guest preferences copied to your account.');
      }
    });
  }

  // Privacy Model Cache Purging
  if (el('purge-cache-btn')) {
    el('purge-cache-btn').addEventListener('click', async () => {
      const btn = el<HTMLButtonElement>('purge-cache-btn');
      const statusSpan = el('purge-cache-status');
      btn.disabled = true;
      if (statusSpan) statusSpan.hidden = true;
      try {
        const modelId = model?.modelId ?? new BrowserModel().modelId;
        cancelRun();
        stopModel();
        controls();
        const { deleteModelAllInfoInCache } = await import('@mlc-ai/web-llm');
        await deleteModelAllInfoInCache(modelId);
        if (statusSpan) statusSpan.hidden = false;
        status('Configured model cache cleared. Enable local AI to download it again.');
      } catch {
        status('Model cache could not be cleared. No completion has been confirmed; retry or use browser site-storage settings.');
      } finally {
        btn.disabled = false;
      }
    });
  }

  // Workspace Profile & Import Listeners (Preserving existing logic)
  if (el('profile')) {
    el('profile').addEventListener('submit', event => {
      event.preventDefault();
      try {
        const current = profile();
        if (el<HTMLInputElement>('remember').checked) {
          saveProfile(current, currentUserId);
        } else {
          forgetProfile(currentUserId);
        }
        cancelRun();
        resetResults();
        status('Preferences applied. Generate a new brief to use them.');
      } catch (error) {
        status((error as Error).message);
      }
    });
  }

  if (el('remember')) {
    el('remember').addEventListener('change', () => {
      if (!el<HTMLInputElement>('remember').checked) {
        try {
          forgetProfile(currentUserId);
        } catch {
          status('Browser storage unavailable.');
        }
      }
    });
  }

  if (el('forget')) {
    el('forget').addEventListener('click', () => {
      try {
        forgetProfile(currentUserId);
        el<HTMLInputElement>('remember').checked = false;
        status('Saved preferences removed. Current form remains available in memory.');
      } catch {
        status('Browser storage unavailable.');
      }
    });
  }

  for (const id of ['chat', 'format', 'dateOrder']) {
    if (el(id)) el(id).addEventListener('input', () => { fileEpoch++; invalidateImport(); });
  }

  for (const id of ['name', 'role', 'interests', 'responsibilities', 'length', 'since']) {
    if (el(id)) el(id).addEventListener('input', () => { cancelRun(); resetResults(); renderSources(); });
  }

  if (el('format')) {
    el('format').addEventListener('change', () => {
      const plain = value('format') === 'plain';
      if (el<HTMLInputElement>('since')) el<HTMLInputElement>('since').disabled = plain;
      if (el<HTMLSelectElement>('dateOrder')) el<HTMLSelectElement>('dateOrder').disabled = plain;
      if (plain && el<HTMLInputElement>('since')) el<HTMLInputElement>('since').value = '';
    });
  }

  async function importFile(file: File) {
    const epoch = ++fileEpoch;
    invalidateImport();
    if (el<HTMLTextAreaElement>('chat')) el<HTMLTextAreaElement>('chat').value = '';
    if (el('file-name')) el('file-name').textContent = '';

    try {
      if (!file.name.toLowerCase().endsWith('.txt')) throw new Error('Choose the .txt export, not a ZIP or media attachment.');
      if (file.size > MAX_INPUT_BYTES) throw new Error('Choose a text file smaller than 2 MB.');
      const text = await file.text();
      if (epoch !== fileEpoch) return;
      if (el<HTMLTextAreaElement>('chat')) el<HTMLTextAreaElement>('chat').value = text;
      if (el('file-name')) el('file-name').textContent = file.name;
      status('File read locally. Preview the import and confirm the dates.');
    } catch (error) {
      if (epoch === fileEpoch) status((error as Error).message);
    }
  }

  if (el('file')) {
    el('file').addEventListener('change', () => {
      const file = el<HTMLInputElement>('file').files?.[0];
      if (file) void importFile(file);
    });
  }

  if (el('drop-zone')) {
    el('drop-zone').addEventListener('dragover', event => {
      event.preventDefault();
      el('drop-zone').classList.add('dragging');
    });
    el('drop-zone').addEventListener('dragleave', () => el('drop-zone').classList.remove('dragging'));
    el('drop-zone').addEventListener('drop', event => {
      event.preventDefault();
      el('drop-zone').classList.remove('dragging');
      const file = event.dataTransfer?.files[0];
      if (file) void importFile(file);
    });
  }

  if (el('parse')) {
    el('parse').addEventListener('click', () => {
      try {
        parse();
        status('Check the preview, then catch up.');
      } catch (error) {
        status((error as Error).message);
      }
    });
  }

  if (el('load')) {
    el('load').addEventListener('click', async () => {
      if (loading || controller) return;
      stopModel();
      const epoch = loadEpoch, active = new BrowserModel();
      model = active;
      loading = true;
      controls();
      if (el('model-status')) el('model-status').textContent = 'Checking WebGPU and loading the local model…';
      try {
        await active.load(text => {
          if (epoch === loadEpoch && el('model-status')) el('model-status').textContent = text;
        });
        if (epoch !== loadEpoch) {
          active.dispose();
          return;
        }
        ready = true;
        if (el('model-status')) el('model-status').textContent = `Local AI ready · ${active.modelId}`;
        status('Model loaded. Chat inference will run on this device.');
      } catch (error) {
        if (epoch === loadEpoch) {
          active.dispose();
          model = null;
          ready = false;
          if (el('model-status')) el('model-status').textContent = 'AI could not load. Extractive mode remains available.';
          status(`Model loading failed: ${(error as Error).message}`);
        }
      } finally {
        if (epoch === loadEpoch) {
          loading = false;
          controls();
        }
      }
    });
  }

  if (el('summarize')) {
    el('summarize').addEventListener('click', async () => {
      if (controller || loading) return;
      const epoch = ++runEpoch;
      controller = new AbortController();
      controls();
      try {
        if (!value('name').trim()) {
          el('name')?.focus();
          throw new Error('Please enter your chat display name in Step 1 first.');
        }
        if (!value('chat').trim() && !parsed) {
          el('chat')?.focus();
          throw new Error('Please import or paste a conversation in Step 2 first.');
        }
        const current = profile(), chat = parsed ?? parse();
        if (el<HTMLInputElement>('remember').checked) {
          try {
            saveProfile(current, currentUserId);
          } catch {
            /* In-memory processing remains available */
          }
        }
        status(ready ? 'Building your brief locally using Qwen2.5 (please wait)…' : 'Finding relevant original messages…');
        const brief = await createBrief(chat.messages, current, {
          model: ready && model ? model : undefined,
          since: value('since') || undefined,
          signal: controller.signal,
        });
        if (epoch !== runEpoch) return;
        if (ready && brief.mode === 'extractive' && brief.stats.selectedMessages > 0) {
          stopModel();
          if (el('model-status')) el('model-status').textContent = 'Local AI failed or returned invalid evidence. Enable local AI to retry.';
        }
        renderBrief(brief, chat, current);
        status('Ready. Review the source messages below.');
      } catch (error) {
        if (epoch === runEpoch) status((error as Error).name === 'AbortError' ? 'Cancelled.' : (error as Error).message);
      } finally {
        if (epoch === runEpoch) {
          controller = null;
          controls();
        }
      }
    });
  }

  if (el('cancel')) {
    el('cancel').addEventListener('click', () => {
      cancelRun();
      stopModel();
      controls();
      if (el('model-status')) el('model-status').textContent = 'Processing stopped. Enable local AI to reload.';
      status('Processing cancelled.');
    });
  }

  if (el('extractive')) {
    el('extractive').addEventListener('click', () => {
      cancelRun();
      stopModel();
      controls();
      resetResults();
      if (el('model-status')) el('model-status').textContent = 'Extractive mode selected. No AI summary or inferred tasks.';
      status('Select Catch me up to rank original messages.');
    });
  }

  if (el('clear')) {
    el('clear').addEventListener('click', () => {
      fileEpoch++;
      cancelRun();
      stopModel();
      for (const id of ['chat', 'file', 'since', 'source-search']) {
        if (el<HTMLInputElement>(id)) el<HTMLInputElement>(id).value = '';
      }
      if (el('file-name')) el('file-name').textContent = '';
      invalidateImport();
      controls();
      showView('/workspace');
      if (el('model-status')) el('model-status').textContent = 'Extractive mode available now';
      status('Chat and results cleared; model stopped. Saved preferences and model cache remain.');
    });
  }

  if (el('configure')) el('configure').addEventListener('click', () => showView('/workspace', { forceView: 'import-view' }));
  if (el('edit-profile')) el('edit-profile').addEventListener('click', () => showView('/workspace', { forceView: 'import-view' }));
  if (el('source-search')) {
    el('source-search').addEventListener('input', () => {
      sourceLimit = 100;
      renderSources();
    });
  }
  if (el('more-sources')) {
    el('more-sources').addEventListener('click', () => {
      sourceLimit += 100;
      renderSources();
    });
  }
}

function startCooldownTimer(seconds: number) {
  let remaining = seconds;
  const cooldownBanner = el('login-cooldown-banner');
  const secondsSpan = el('cooldown-seconds');
  if (cooldownBanner) cooldownBanner.hidden = false;
  if (secondsSpan) secondsSpan.textContent = String(remaining);

  if (cooldownTimer) clearInterval(cooldownTimer);
  cooldownTimer = window.setInterval(() => {
    remaining--;
    if (secondsSpan) secondsSpan.textContent = String(remaining);
    if (remaining <= 0) {
      clearInterval(cooldownTimer!);
      cooldownTimer = null;
      if (cooldownBanner) cooldownBanner.hidden = true;
    }
  }, 1000);
}

// App Initialization
async function initApp() {
  initEventListeners();
  await updateSessionState();

  onAuthStateChange(() => {
    // Defer session reads until the auth callback releases its internal lock.
    window.setTimeout(() => { void updateSessionState(); }, 0);
  });

  updateRoute();
}

void initApp();
