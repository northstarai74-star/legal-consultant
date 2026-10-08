// Shared building blocks for document templates. Used by the browser (forms)
// and the server (AI prompts + the offline demo drafter).

export const text = (key, label, o = {}) => ({ key, label, type: 'text', ...o });
export const area = (key, label, o = {}) => ({ key, label, type: 'textarea', rows: 3, ...o });
export const select = (key, label, options, o = {}) => ({ key, label, type: 'select', options, default: options[0], ...o });
export const date = (key, label, o = {}) => ({ key, label, type: 'date', ...o });

export const jurisdictionField = (o = {}) =>
  text('jurisdiction', 'Governing law / jurisdiction', {
    group: 'Legal terms',
    required: true,
    prefill: 'jurisdiction',
    suggest: 'jurisdictions',
    placeholder: 'e.g. India (Karnataka)',
    ...o,
  });

export const disputesField = (o = {}) =>
  select('disputes', 'Dispute resolution', ['Courts', 'Arbitration', 'Mediation then courts'], {
    group: 'Legal terms',
    ...o,
  });

export function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value || '';
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// Escape characters that would be interpreted as Markdown formatting in user-entered values.
const escapeMd = (s) => s.replace(/([\\`*_~|<])/g, '\\$1');

// v.key  -> escaped single-line value, or "[Label]" placeholder when empty
// v.$key -> raw trimmed value ('' when empty)
export function valuesFor(template, answers = {}) {
  const v = {};
  for (const f of template.fields) {
    let raw = String(answers[f.key] ?? '').trim();
    if (f.type === 'date') raw = formatDate(raw);
    v['$' + f.key] = raw;
    v[f.key] = raw ? escapeMd(raw.replace(/\s*\n+\s*/g, '; ')) : `[${f.label}]`;
  }
  return v;
}

export const blank = (n = 28) => '\\_'.repeat(n);

export function signatureTable(left, right) {
  return [
    `| ${left.title} | ${right.title} |`,
    '| --- | --- |',
    `| Signature: ${blank()} | Signature: ${blank()} |`,
    `| Name: ${left.name} | Name: ${right.name} |`,
    `| Title: ${blank(24)} | Title: ${blank(24)} |`,
    `| Date: ${blank(26)} | Date: ${blank(26)} |`,
  ].join('\n');
}

export function witnessBlock() {
  return [
    '**Witnesses**',
    '',
    '| Witness 1 | Witness 2 |',
    '| --- | --- |',
    `| Name: ${blank(24)} | Name: ${blank(24)} |`,
    `| Address: ${blank(22)} | Address: ${blank(22)} |`,
    `| Signature: ${blank(22)} | Signature: ${blank(22)} |`,
  ].join('\n');
}

export function disputeParas(v) {
  const method = v.$disputes || 'Courts';
  if (method === 'Arbitration') {
    return [
      `This Agreement shall be governed by and construed in accordance with the laws of ${v.jurisdiction}.`,
      `Any dispute arising out of or in connection with this Agreement, including any question regarding its existence, validity or termination, shall be referred to and finally resolved by arbitration by a sole arbitrator appointed by mutual agreement of the parties. The seat and venue of arbitration shall be in [Seat of arbitration], the language shall be English, and the award shall be final and binding on the parties.`,
    ];
  }
  if (method === 'Mediation then courts') {
    return [
      `This Agreement shall be governed by and construed in accordance with the laws of ${v.jurisdiction}.`,
      `The parties shall first attempt in good faith to resolve any dispute arising out of or in connection with this Agreement through mediation, for a period of thirty (30) days from written notice of the dispute. Failing resolution, the courts of ${v.jurisdiction} shall have exclusive jurisdiction.`,
    ];
  }
  return [
    `This Agreement shall be governed by and construed in accordance with the laws of ${v.jurisdiction}.`,
    `The courts of ${v.jurisdiction} shall have exclusive jurisdiction over any dispute arising out of or in connection with this Agreement.`,
  ];
}

export const governingLawClause = {
  title: 'Governing Law and Dispute Resolution',
  paras: (v) => disputeParas(v),
};

export const generalClause = {
  title: 'General',
  paras: () => [
    '**Entire agreement.** This Agreement constitutes the entire agreement between the parties on its subject matter and supersedes all prior discussions, understandings and agreements.',
    '**Amendment.** This Agreement may be amended only by a written instrument signed by both parties.',
    '**Assignment.** Neither party may assign or transfer its rights or obligations under this Agreement without the prior written consent of the other party.',
    '**Severability.** If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.',
    '**Waiver.** A failure or delay in exercising any right under this Agreement shall not operate as a waiver of that right.',
    '**Notices.** Notices under this Agreement shall be in writing and delivered by hand, registered post or email to the addresses stated above, or such other address as a party notifies in writing.',
    '**Counterparts.** This Agreement may be executed in counterparts, each of which shall be deemed an original and all of which together constitute one instrument.',
  ],
};
