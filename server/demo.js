import { getTemplate, buildDocument } from '../shared/templates/index.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Streams text in small word-sized chunks so the demo feels like a live draft.
export async function streamText(markdown, onText, signal) {
  const chunks = markdown.match(/\S+\s*/g) ?? [];
  for (let i = 0; i < chunks.length; i += 5) {
    if (signal?.aborted) return;
    onText(chunks.slice(i, i + 5).join(''));
    await sleep(16);
  }
}

export function demoDraft(body) {
  const template = getTemplate(String(body.templateId ?? ''));
  if (!template) return '';
  return buildDocument(template, body.answers ?? {});
}

const CHECKS = [
  ['Governing law', /governing law|governed by|laws of/i],
  ['Dispute resolution', /dispute|arbitrat|jurisdiction|courts of/i],
  ['Term and termination', /terminat/i],
  ['Confidentiality', /confidential/i],
  ['Limitation of liability', /liabilit/i],
  ['Notices', /notices?\b/i],
  ['Entire agreement', /entire agreement/i],
  ['Severability', /severab/i],
  ['Signature block', /signature/i],
];

// A rule-based checklist used when no Claude key is connected.
export function demoReview(document) {
  const words = (document.match(/\S+/g) ?? []).length;
  const placeholders = [...new Set(document.match(/\[[^\]\n]{2,80}\]/g) ?? [])];
  const rows = CHECKS.map(([name, re]) => `| ${name} | ${re.test(document) ? 'Present' : '**Not found**'} |`);
  const missing = CHECKS.filter(([, re]) => !re.test(document)).map(([name]) => name);

  return [
    '## Summary',
    '',
    `This is a rule-based checklist, not an AI review. The document is about ${words.toLocaleString()} words (roughly ${Math.max(1, Math.round(words / 220))} minutes to read) and contains **${placeholders.length} unfilled placeholder${placeholders.length === 1 ? '' : 's'}**. Connect Claude in Settings for a full review of risks, balance between the parties and missing protections.`,
    '',
    '## Clause checklist',
    '',
    '| Clause | Status |',
    '| --- | --- |',
    ...rows,
    '',
    '## Placeholders to complete',
    '',
    ...(placeholders.length ? placeholders.slice(0, 40).map((p) => `- ${p.replace(/([\\`*_~|<])/g, '\\$1')}`) : ['- None found.']),
    ...(placeholders.length > 40 ? [`- …and ${placeholders.length - 40} more.`] : []),
    '',
    '## Before you sign',
    '',
    ...(missing.length ? [`- Consider whether these are needed: ${missing.join(', ')}.`] : []),
    '- Fill every placeholder and check names, amounts and dates against your records.',
    '- Check local formalities such as stamp duty, witnessing, notarisation or registration.',
    '- Have a qualified lawyer review any document with significant financial or legal consequences.',
    '',
  ].join('\n');
}
