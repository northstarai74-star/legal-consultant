import { valuesFor } from './helpers.js';
import nda from './nda.js';
import employment from './employment.js';
import freelance from './freelance.js';
import service from './service.js';
import lease from './lease.js';
import loan from './loan.js';
import poa from './poa.js';
import partnership from './partnership.js';
import notice from './notice.js';
import terms from './terms.js';
import custom from './custom.js';

export { valuesFor, formatDate } from './helpers.js';

export const TEMPLATES = [nda, employment, freelance, service, lease, loan, poa, partnership, notice, terms, custom];

export const CATEGORIES = ['All', 'Business', 'Employment', 'Property', 'Finance', 'Personal', 'Disputes', 'Digital', 'Other'];

export const JURISDICTIONS = [
  'India',
  'India (Maharashtra)',
  'India (Karnataka)',
  'India (Delhi)',
  'United States (Delaware)',
  'United States (California)',
  'United States (New York)',
  'England and Wales',
  'Scotland',
  'Ireland',
  'Singapore',
  'United Arab Emirates (Dubai)',
  'Canada (Ontario)',
  'Australia (New South Wales)',
  'New Zealand',
  'South Africa',
  'Germany',
  'France',
];

export const getTemplate = (id) => TEMPLATES.find((t) => t.id === id);

export function defaultAnswers(template, profile = {}) {
  const out = {};
  for (const f of template.fields) {
    let value = f.default ?? '';
    if (f.prefill && profile[f.prefill]) value = profile[f.prefill];
    out[f.key] = value;
  }
  return out;
}

export function clauseTitles(template) {
  if (template.render) return ['Facts', 'Demand', 'Time to comply', 'Reservation of rights'];
  const v = valuesFor(template, defaultAnswers(template));
  const list = typeof template.clauses === 'function' ? template.clauses(v) : template.clauses;
  return list.map((c) => c.title);
}

// Offline draft built from the template's own clause library (used by the demo drafter).
export function buildDocument(template, answers = {}) {
  const v = valuesFor(template, answers);
  if (template.render) return template.render(v).trim() + '\n';

  const clauses = typeof template.clauses === 'function' ? template.clauses(v) : template.clauses;
  const out = [`# ${template.title(v)}`, ''];
  if (template.intro) out.push(template.intro(v), '');
  clauses.forEach((clause, i) => {
    out.push(`## ${i + 1}. ${clause.title}`, '');
    const paras = clause.paras(v).filter(Boolean);
    paras.forEach((p, j) => out.push(paras.length > 1 ? `**${i + 1}.${j + 1}** ${p}` : p, ''));
  });
  if (template.signatures) {
    out.push('## Execution', '', 'The parties have signed this document on the dates written below.', '', template.signatures(v), '');
  }
  return out.join('\n').trim() + '\n';
}

// Guess the best template for a free-text request ("NDA for my freelancer…").
export function matchTemplate(query) {
  const q = (query || '').toLowerCase();
  let best = null;
  let bestIndex = Infinity;
  let bestLen = 0;
  for (const t of TEMPLATES) {
    for (const k of t.keywords || []) {
      const at = q.search(new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
      if (at === -1) continue;
      if (at < bestIndex || (at === bestIndex && k.length > bestLen)) {
        best = t;
        bestIndex = at;
        bestLen = k.length;
      }
    }
  }
  return best || getTemplate('custom');
}
