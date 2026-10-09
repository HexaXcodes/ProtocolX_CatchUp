import { BrowserModel, parseChat, validateModelOutput } from '../../backend/src/index';
import { SYSTEM_PROMPT } from '../../backend/src/core/brief';
const button = document.querySelector<HTMLButtonElement>('#run')!;
const output = document.querySelector<HTMLPreElement>('#output')!;
button.addEventListener('click', async () => {
  button.disabled = true; const model = new BrowserModel();
  try {
    await model.load(text => { output.textContent = text; });
    const records = parseChat('09/10/2026, 10:00 - Ben: SYNTHETIC TEST: Ana, please review the API bug by Friday.\n09/10/2026, 10:01 - Ana: I will investigate; no deployment agreed yet.\n09/10/2026, 10:02 - Ben: Exam registration closes Monday.', { format: 'whatsapp', dateOrder: 'DMY' }).messages;
    const profile = { name: 'Ana', role: 'developer', interests: [], responsibilities: '', length: 'brief' };
    const raw = await model.generate(SYSTEM_PROMPT, JSON.stringify({profile, records}));
    output.textContent = raw;
    try { validateModelOutput(raw, records); output.textContent += '\nVALID'; }
    catch(error) { output.textContent += `\nVALIDATION ERROR: ${(error as Error).message}`; }
  } catch(error) { output.textContent = (error as Error).message; }
  finally { model.dispose(); button.disabled = false; }
});
