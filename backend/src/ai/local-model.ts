import type { WebWorkerMLCEngine } from '@mlc-ai/web-llm';
import type { LocalModel } from '../core/brief';

export class BrowserModel implements LocalModel {
  constructor(readonly modelId = 'Qwen2.5-3B-Instruct-q4f16_1-MLC') {}
  private worker: Worker | null = null;
  private engine: WebWorkerMLCEngine | null = null;
  private busy = false;
  private disposed = false;
  async load(onProgress: (text: string) => void): Promise<void> {
    if (!('gpu' in navigator)) throw new Error('WebGPU is unavailable. Try a recent desktop Chrome or Edge browser, or use extractive mode.');
    if (this.engine) return;
    const { CreateWebWorkerMLCEngine, prebuiltAppConfig } = await import('@mlc-ai/web-llm');
    if (this.disposed) throw new DOMException('Cancelled', 'AbortError');
    const record = prebuiltAppConfig.model_list.find(m => m.model_id === this.modelId);
    if (!record) throw new Error('Configured local model is unavailable in this runtime.');
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    try {
      this.engine = await CreateWebWorkerMLCEngine(this.worker, record.model_id, {
        initProgressCallback: progress => onProgress(progress.text),
      }, { context_window_size: 8192 });
    } catch (error) { this.dispose(); throw error; }
  }
  async generate(system: string, input: string, signal?: AbortSignal, options?: { omitDeadlineQuotes?: boolean }): Promise<string> {
    if (!this.engine || this.busy) throw new Error('Local model is unavailable or busy.');
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    this.busy = true;
    const engine = this.engine;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let rejectAbort: ((reason: Error) => void) | undefined;
    const abort = () => { this.dispose(); rejectAbort?.(new DOMException('Cancelled', 'AbortError')); };
    signal?.addEventListener('abort', abort, { once: true });
    try {
      const { records, profile } = JSON.parse(input) as { records: { id: string }[]; profile: { length: string } };
      const schema = JSON.stringify({
        type: 'object', additionalProperties: false, required: ['items'], properties: {
          items: { type: 'array', maxItems: profile.length === 'brief' ? 6 : 12, items: {
            type: 'object', additionalProperties: false,
            required: ['category', 'text', 'sourceIds', 'priority', 'reason', 'deadlineQuote'],
            properties: {
              category: { type: 'string', enum: ['actions', 'decisions', 'updates'] },
              text: { type: 'string' },
              sourceIds: { type: 'array', minItems: 1, maxItems: 6, items: { type: 'string', enum: records.map(record => record.id) } },
              priority: { type: 'string', enum: ['high', 'normal'] },
              reason: { type: 'string' }, deadlineQuote: options?.omitDeadlineQuotes ? { type: 'null' } : { type: ['string', 'null'] },
            },
          } },
        },
      });
      const completion = engine.chat.completions.create({
        messages: [{ role: 'system', content: system }, { role: 'user', content: `Create my catch-up brief from this input. Identify relevant requests, decisions and updates, citing the supporting record IDs.\n${input}` }],
        temperature: 0, max_tokens: 1600, response_format: { type: 'json_object', schema },
      });
      const response = await Promise.race([
        completion,
        new Promise<never>((_, reject) => {
          rejectAbort = reject;
          timer = setTimeout(() => { this.dispose(); reject(new Error('Local inference timed out.')); }, 90000);
        }),
      ]);
      return response.choices[0]?.message.content ?? '';
    } finally {
      if (timer) clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      this.busy = false;
      // Drop the model conversation state between requests. Termination clears the worker on failure.
      if (this.engine === engine) await engine.resetChat().catch(() => this.dispose());
    }
  }
  dispose(): void { this.disposed = true; this.worker?.terminate(); this.worker = null; this.engine = null; this.busy = false; }
}
