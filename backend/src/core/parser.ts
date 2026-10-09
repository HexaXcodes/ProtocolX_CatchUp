import type { DateOrder, Message, ParsedChat } from './types';

export const MAX_INPUT_BYTES = 2 * 1024 * 1024;
export const MAX_MESSAGES = 10000;
// Android: date, time - author: text. iOS: [date, time] author: text.
const header = /^\[?(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?(?:\]\s*|\s+-\s+)(.*)$/i;

export class ChatParseError extends Error {
  constructor(public code: 'EMPTY' | 'TOO_LARGE' | 'DATE_ORDER_REQUIRED' | 'INVALID_DATE' | 'TOO_MANY_MESSAGES', message: string) { super(message); }
}

export function parseChat(input: string, options: { format: 'whatsapp' | 'plain'; dateOrder?: DateOrder }): ParsedChat {
  if (!input.trim()) throw new ChatParseError('EMPTY', 'Choose a text export or paste a conversation.');
  if (new TextEncoder().encode(input).length > MAX_INPUT_BYTES) throw new ChatParseError('TOO_LARGE', 'Use a text export smaller than 2 MB.');
  const lines = input.replace(/\r\n?/g, '\n').replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, '').split('\n');
  const messages: Message[] = [];
  const warnings: string[] = [];
  let ignoredLines = 0;
  let current: Message | undefined;
  const push = (author: string, text: string, timestamp: string | null) => {
    if (messages.length >= MAX_MESSAGES) throw new ChatParseError('TOO_MANY_MESSAGES', 'Use a smaller export (maximum 10,000 messages).');
    current = { id: `m${messages.length + 1}`, author, text, timestamp };
    messages.push(current);
  };
  for (const line of lines) {
    if (options.format === 'plain') {
      if (line.trim()) push('Unknown', line, null);
      continue;
    }
    const match = line.match(header);
    if (!match) {
      if (current) current.text += `\n${line}`;
      else if (line.trim()) ignoredLines++;
      continue;
    }
    const [, a, b, y, h, min, sec, ampm, body] = match;
    const first = Number(a), second = Number(b);
    let order = options.dateOrder;
    if (!order) {
      if (first > 12) order = 'DMY';
      else if (second > 12) order = 'MDY';
      else throw new ChatParseError('DATE_ORDER_REQUIRED', 'Confirm day/month or month/day before parsing this export.');
    }
    const day = order === 'DMY' ? first : second;
    const month = order === 'DMY' ? second : first;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    let hour = Number(h);
    if (ampm) {
      if (hour < 1 || hour > 12) throw new ChatParseError('INVALID_DATE', 'Invalid 12-hour timestamp.');
      hour = hour % 12 + (ampm.toUpperCase() === 'PM' ? 12 : 0);
    }
    const date = new Date(year, month - 1, day, hour, Number(min), Number(sec || 0));
    if (month < 1 || month > 12 || hour > 23 || Number(min) > 59 || Number(sec || 0) > 59 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      throw new ChatParseError('INVALID_DATE', 'Invalid date in export. Check the date order.');
    }
    const split = body.indexOf(': ');
    if (split < 1) { ignoredLines++; current = undefined; continue; }
    const pad = (n: number) => String(n).padStart(2, '0');
    push(body.slice(0, split), body.slice(split + 2), `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${min}:${sec || '00'}`);
  }
  if (!messages.length) throw new ChatParseError('EMPTY', 'No messages recognized. Check the format or use plain text mode.');
  if (ignoredLines) warnings.push(`${ignoredLines} system or unrecognized lines were excluded. Check the parse preview.`);
  if (options.format === 'plain') warnings.push('Plain text: each non-empty line is a source. Authors and dates are unknown; time filtering is unavailable.');
  warnings.push('Attachments and voice notes are not analyzed. Export timestamps have no verified timezone.');
  return { messages, participants: [...new Set(messages.map(m => m.author))].filter(n => n !== 'Unknown'), warnings, ignoredLines };
}
