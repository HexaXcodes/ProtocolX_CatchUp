import './style.css';
import { shell } from './shell';
import { parseChat, MAX_INPUT_BYTES, createBrief, BrowserModel, loadProfile, saveProfile, forgetProfile, validateProfile, type Profile, type ParsedChat, type Brief, type Message } from '../../backend/src/index';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = shell;
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const value = (id: string) => el<HTMLInputElement>(id).value;
const status = (message: string) => { el('status').textContent = message; };
let parsed: ParsedChat | null = null;
let model: BrowserModel | null = null;
let ready = false, loading = false;
let controller: AbortController | null = null;
let runEpoch = 0, loadEpoch = 0, fileEpoch = 0, sourceLimit = 100;

function view(name: 'import' | 'workspace' | 'privacy') {
  for (const v of ['import', 'workspace', 'privacy']) el(`${v}-view`).hidden = v !== name;
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b => {
    b.classList.toggle('active', b.dataset.view === name);
    b.setAttribute('aria-current', b.dataset.view === name ? 'page' : 'false');
  });
}
function p(text: string, className = '') {
  const node = document.createElement('p'); node.textContent = text; node.className = className; return node;
}
function profile(): Profile {
  return validateProfile({ name: value('name'), role: value('role'), interests: value('interests').split(',').map(i => i.trim()).filter(Boolean), responsibilities: value('responsibilities'), length: value('length') });
}
function controls() {
  el<HTMLButtonElement>('summarize').disabled = loading || !!controller;
  el<HTMLButtonElement>('load').disabled = loading || !!controller;
  el('cancel').hidden = !loading && !controller;
  el('runtime-label').textContent = loading ? 'Loading local AI…' : controller ? 'Processing on device…' : ready ? 'Local AI ready' : 'Extractive mode available';
}
function stopModel() { loadEpoch++; model?.dispose(); model = null; ready = false; loading = false; }
function cancelRun() {
  runEpoch++;
  if (controller) { controller.abort(); controller = null; stopModel(); el('model-status').textContent = 'AI stopped. Enable local AI to reload.'; }
  controls();
}
function resetResults() {
  el('results').replaceChildren(p('Import a conversation, choose your context, and select Catch me up. Your brief will appear here.', 'empty'));
  el('workspace-meta').textContent = 'Generate a new brief after changing your context.';
}
function renderSources() {
  const query = value('source-search').trim().toLocaleLowerCase();
  const messages = (parsed?.messages ?? []).filter(m => `${m.author} ${m.text}`.toLocaleLowerCase().includes(query));
  el('source-count').textContent = `${messages.length} messages${query ? ' matching filter' : ''}`;
  el('source-feed').replaceChildren(...messages.slice(0, sourceLimit).map(m => {
    const card = document.createElement('article'); card.id = `source-${m.id}`;
    card.className = `chat-message${m.author === value('name').trim() && m.author !== 'Unknown' ? ' mine' : ''}`;
    const meta = document.createElement('span'); meta.className = 'message-meta'; meta.textContent = `${m.author} · ${m.timestamp ?? 'Unknown time'} · ${m.id}`;
    card.append(meta, document.createTextNode(m.text)); return card;
  }));
  if (!messages.length) el('source-feed').append(p('Your source messages will appear here.', 'empty'));
  el('more-sources').hidden = messages.length <= sourceLimit;
}
function invalidateImport() {
  cancelRun(); parsed = null; sourceLimit = 100;
  el('preview').replaceChildren(); el('participants').replaceChildren(); resetResults(); renderSources();
}
function parse(): ParsedChat {
  const chat = parseChat(value('chat'), { format: value('format') as 'whatsapp' | 'plain', dateOrder: (value('dateOrder') || undefined) as 'DMY' | 'MDY' | undefined });
  parsed = chat;
  el('participants').replaceChildren(...chat.participants.map(name => { const option = document.createElement('option'); option.value = name; return option; }));
  el('preview').replaceChildren(p(`${chat.messages.length} messages · ${chat.participants.length} participants`, 'badge'), ...chat.warnings.map(w => p(w, 'hint')));
  const details = document.createElement('details'), summary = document.createElement('summary'); summary.textContent = 'Check first 5 parsed messages'; details.append(summary);
  for (const m of chat.messages.slice(0, 5)) details.append(p(`${m.author} · ${m.timestamp ?? 'Unknown time'}\n${m.text}`, 'source'));
  el('preview').append(details); renderSources(); return chat;
}
function renderBrief(brief: Brief, chat: ParsedChat, currentProfile: Profile) {
  const results = el('results'); results.replaceChildren();
  const heading = document.createElement('h2'); heading.textContent = brief.mode === 'ai' ? 'Your catch-up brief' : 'Relevant excerpts'; results.append(heading);
  if (brief.mode === 'extractive') results.append(p('Extractive mode · AI summary unavailable', 'badge'));
  results.append(p(`${brief.stats.analyzedMessages} / ${brief.stats.selectedMessages} selected messages analyzed · ${brief.stats.elapsedMs} ms`, 'muted'));
  for (const warning of [...chat.warnings, ...brief.warnings]) results.append(p(warning, 'notice'));
  if (!brief.items.length) results.append(p('No updates found in this window. Try a wider range and check the source conversation.', 'empty'));
  for (const category of ['actions', 'decisions', 'updates'] as const) {
    const items = brief.items.filter(i => i.category === category); if (!items.length) continue;
    const title = document.createElement('h3'); title.textContent = { actions: 'Your actions', decisions: 'Decisions made', updates: 'Relevant updates' }[category]; results.append(title);
    for (const item of items) {
      const card = document.createElement('article'); card.className = 'panel result';
      card.append(p(item.priority === 'high' ? 'HIGH PRIORITY · VERIFY SOURCE' : 'FOR YOUR CONTEXT', 'eyebrow'), p(item.text), p(item.reason, 'muted'));
      if (item.deadlineQuote) card.append(p(`Deadline wording: ${item.deadlineQuote}`, 'small'));
      const details = document.createElement('details'), summary = document.createElement('summary'); summary.textContent = `View ${item.sourceIds.length} source message(s)`; details.append(summary);
      for (const id of item.sourceIds) {
        const source = chat.messages.find(m => m.id === id)!;
        details.append(p(`${source.author} · ${source.timestamp ?? 'Unknown time'} · ${source.id}\n${source.text}`, 'source'));
        const button = document.createElement('button'); button.className = 'secondary citation'; button.textContent = `Locate ${id} in conversation`;
        button.addEventListener('click', () => {
          el<HTMLInputElement>('source-search').value = ''; sourceLimit = Math.max(sourceLimit, chat.messages.findIndex(m => m.id === id) + 1); renderSources();
          const target = el(`source-${id}`); target.classList.add('spotlight'); target.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        }); details.append(button);
      }
      card.append(details); results.append(card);
    }
  }
  el('context-name').textContent = currentProfile.name;
  el('context-role').textContent = `Role: ${currentProfile.role}`;
  el('context-interests').textContent = [...currentProfile.interests, currentProfile.responsibilities].filter(Boolean).join(' · ') || 'Using role-based interests.';
  el('workspace-meta').textContent = `${brief.mode === 'ai' ? 'Local AI brief' : 'Extractive mode'} · ${brief.stats.selectedMessages} selected messages · ${brief.stats.elapsedMs} ms`;
  view('workspace'); renderSources(); results.classList.remove('reveal'); void results.offsetWidth; results.classList.add('reveal');
}
const saved = loadProfile();
if (saved) {
  for (const key of ['name', 'role', 'responsibilities', 'length'] as const) el<HTMLInputElement>(key).value = saved[key];
  el<HTMLInputElement>('interests').value = saved.interests.join(', '); el<HTMLInputElement>('remember').checked = true;
}
el('profile').addEventListener('submit', event => {
  event.preventDefault();
  try { const current = profile(); if (el<HTMLInputElement>('remember').checked) saveProfile(current); else forgetProfile(); cancelRun(); resetResults(); status('Preferences applied. Generate a new brief to use them.'); }
  catch (error) { status((error as Error).message); }
});
el('remember').addEventListener('change', () => {
  if (!el<HTMLInputElement>('remember').checked) { try { forgetProfile(); } catch { status('Browser storage unavailable.'); } }
});
el('forget').addEventListener('click', () => { try { forgetProfile(); el<HTMLInputElement>('remember').checked = false; status('Saved preferences removed. Current form remains available in memory.'); } catch { status('Browser storage unavailable.'); } });
for (const id of ['chat', 'format', 'dateOrder']) el(id).addEventListener('input', () => { fileEpoch++; invalidateImport(); });
for (const id of ['name', 'role', 'interests', 'responsibilities', 'length', 'since']) el(id).addEventListener('input', () => { cancelRun(); resetResults(); renderSources(); });
el('format').addEventListener('change', () => {
  const plain = value('format') === 'plain'; el<HTMLInputElement>('since').disabled = plain; el<HTMLSelectElement>('dateOrder').disabled = plain;
  if (plain) el<HTMLInputElement>('since').value = '';
});
async function importFile(file: File) {
  const epoch = ++fileEpoch;
  invalidateImport(); el<HTMLTextAreaElement>('chat').value = ''; el('file-name').textContent = '';
  try {
    if (!file.name.toLowerCase().endsWith('.txt')) throw new Error('Choose the .txt export, not a ZIP or media attachment.');
    if (file.size > MAX_INPUT_BYTES) throw new Error('Choose a text file smaller than 2 MB.');
    const text = await file.text(); if (epoch !== fileEpoch) return;
    el<HTMLTextAreaElement>('chat').value = text; el('file-name').textContent = file.name;
    status('File read locally. Preview the import and confirm the dates.');
  } catch (error) { if (epoch === fileEpoch) status((error as Error).message); }
}
el('file').addEventListener('change', () => { const file = el<HTMLInputElement>('file').files?.[0]; if (file) void importFile(file); });
el('drop-zone').addEventListener('dragover', event => { event.preventDefault(); el('drop-zone').classList.add('dragging'); });
el('drop-zone').addEventListener('dragleave', () => el('drop-zone').classList.remove('dragging'));
el('drop-zone').addEventListener('drop', event => { event.preventDefault(); el('drop-zone').classList.remove('dragging'); const file = event.dataTransfer?.files[0]; if (file) void importFile(file); });
el('parse').addEventListener('click', () => { try { parse(); status('Check the preview, then catch up.'); } catch (error) { status((error as Error).message); } });
el('load').addEventListener('click', async () => {
  if (loading || controller) return;
  stopModel(); const epoch = loadEpoch, active = new BrowserModel(); model = active; loading = true; controls();
  el('model-status').textContent = 'Checking WebGPU and loading the local model…';
  try {
    await active.load(text => { if (epoch === loadEpoch) el('model-status').textContent = text; });
    if (epoch !== loadEpoch) { active.dispose(); return; }
    ready = true; el('model-status').textContent = `Local AI ready · ${active.modelId}`; status('Model loaded. Chat inference will run on this device.');
  } catch (error) {
    if (epoch === loadEpoch) { active.dispose(); model = null; ready = false; el('model-status').textContent = 'AI could not load. Extractive mode remains available.'; status(`Model loading failed: ${(error as Error).message}`); }
  } finally { if (epoch === loadEpoch) { loading = false; controls(); } }
});
el('summarize').addEventListener('click', async () => {
  if (controller || loading) return;
  const epoch = ++runEpoch; controller = new AbortController(); controls();
  try {
    const current = profile(), chat = parsed ?? parse();
    if (el<HTMLInputElement>('remember').checked) { try { saveProfile(current); } catch { /* In-memory processing remains available. */ } }
    status(ready ? 'Building your brief locally…' : 'Finding relevant original messages…');
    const brief = await createBrief(chat.messages, current, { model: ready && model ? model : undefined, since: value('since') || undefined, signal: controller.signal });
    if (epoch !== runEpoch) return;
    if (ready && brief.mode === 'extractive' && brief.stats.selectedMessages > 0) { stopModel(); el('model-status').textContent = 'Local AI failed or returned invalid evidence. Enable local AI to retry.'; }
    renderBrief(brief, chat, current); status('Ready. Review the source messages before acting.');
  } catch (error) { if (epoch === runEpoch) status((error as Error).name === 'AbortError' ? 'Cancelled.' : (error as Error).message); }
  finally { if (epoch === runEpoch) { controller = null; controls(); } }
});
el('cancel').addEventListener('click', () => { cancelRun(); stopModel(); controls(); el('model-status').textContent = 'Processing stopped. Enable local AI to reload.'; status('Processing cancelled.'); });
el('extractive').addEventListener('click', () => { cancelRun(); stopModel(); controls(); resetResults(); el('model-status').textContent = 'Extractive mode selected. No AI summary or inferred tasks.'; status('Select Catch me up to rank original messages.'); });
el('clear').addEventListener('click', () => {
  fileEpoch++; cancelRun(); stopModel();
  for (const id of ['chat', 'file', 'since', 'source-search']) el<HTMLInputElement>(id).value = '';
  el('file-name').textContent = ''; invalidateImport(); controls(); view('import');
  el('model-status').textContent = 'Extractive mode available now'; status('Chat and results cleared; model stopped. Saved preferences and model cache remain.');
});
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b => b.addEventListener('click', () => view(b.dataset.view as 'import' | 'workspace' | 'privacy')));
el('privacy-link').addEventListener('click', () => view('privacy'));
for (const id of ['configure', 'edit-profile']) el(id).addEventListener('click', () => view('import'));
el('source-search').addEventListener('input', () => { sourceLimit = 100; renderSources(); });
el('more-sources').addEventListener('click', () => { sourceLimit += 100; renderSources(); });
