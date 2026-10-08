import { wordCount } from './storage.js';

export function makeTitle(template, answers) {
  if (template.id === 'custom') return (answers.docType || 'Custom document').trim().slice(0, 80);
  const names = template.fields
    .filter((f) => f.required && f.type === 'text' && f.key !== 'jurisdiction')
    .map((f) => (answers[f.key] || '').trim())
    .filter(Boolean)
    .slice(0, 2);
  return (names.length ? `${template.name} — ${names.join(' & ')}` : template.name).slice(0, 90);
}

export const readMinutes = (content) => Math.max(1, Math.round(wordCount(content) / 220));

// A short plain-text preview for document cards.
export function snippet(content, max = 150) {
  const lines = (content || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('|'));
  const text = (lines[0] || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\\([\\`*_~|<])/g, '$1');
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}
