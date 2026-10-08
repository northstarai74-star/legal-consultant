import { text, area, select, date, jurisdictionField, disputesField, governingLawClause, generalClause, blank } from './helpers.js';

export default {
  id: 'partnership',
  name: 'Partnership Agreement',
  category: 'Business',
  icon: 'Users',
  minutes: 4,
  blurb: 'Set out capital, profit sharing, authority and exit terms between business partners.',
  keywords: ['partnership', 'partner', 'partners', 'joint venture', 'firm', 'co-founder', 'cofounder'],
  fields: [
    text('firmName', 'Firm / business name', { group: 'Business', required: true }),
    area('businessNature', 'Nature of business', { group: 'Business', rows: 2, placeholder: 'Retail trading of consumer electronics' }),
    text('principalPlace', 'Principal place of business', { group: 'Business', prefill: 'address' }),
    date('startDate', 'Commencement date', { group: 'Business' }),
    area('partners', 'Partners (one per line: name, address)', { group: 'Partners', required: true, rows: 4, placeholder: 'Asha Verma, 12 MG Road, Pune\nRahul Shah, 4 Park Street, Mumbai' }),
    area('capital', 'Capital contributions', { group: 'Money', rows: 3, placeholder: 'Asha: INR 5,00,000; Rahul: INR 5,00,000' }),
    text('profitShare', 'Profit and loss sharing', { group: 'Money', default: 'In proportion to capital contributions' }),
    text('management', 'Management and decisions', { group: 'Governance', default: 'All partners participate; major decisions need unanimous consent' }),
    text('term', 'Duration', { group: 'Governance', default: 'At will (until dissolved)' }),
    jurisdictionField(),
    disputesField(),
  ],
  title: (v) => 'PARTNERSHIP AGREEMENT',
  intro: (v) => {
    const names = (v.$partners || '').split(/\n/).map((s) => s.trim()).filter(Boolean);
    const list = names.length ? names.map((n, i) => `(${i + 1}) ${n}`).join('; ') : '[Partners]';
    return `This Partnership Agreement (the “**Agreement**”) is made on ${v.startDate} between the following persons (each a “**Partner**” and together the “**Partners**”): ${list}.`;
  },
  clauses: (v) => [
    {
      title: 'Name and Formation',
      paras: () => [`The Partners hereby form a partnership under the name and style of **${v.firmName}** (the “**Firm**”), commencing on ${v.startDate}, on the terms of this Agreement.`],
    },
    {
      title: 'Business and Place',
      paras: () => [`The Firm shall carry on the following business: ${v.businessNature}, and any other lawful business the Partners agree. Its principal place of business is ${v.principalPlace}.`],
    },
    {
      title: 'Capital',
      paras: () => [
        `The Partners shall contribute capital as follows: ${v.capital}.`,
        'No interest shall be payable on capital unless the Partners agree otherwise in writing. Additional capital may be contributed only by agreement of the Partners.',
      ],
    },
    {
      title: 'Profits and Losses',
      paras: () => [`The net profits and losses of the Firm shall be shared as follows: ${v.profitShare}. Profits shall be calculated and distributed at intervals the Partners agree.`],
    },
    {
      title: 'Management and Authority',
      paras: () => [
        `The management of the Firm shall be conducted as follows: ${v.management}.`,
        'No Partner shall, without the consent of the other Partners, borrow in the Firm’s name beyond [Authority limit], sell or encumber Firm property, or enter into any contract outside the ordinary course of business.',
      ],
    },
    {
      title: 'Books, Accounts and Banking',
      paras: () => ['Proper books of account shall be kept at the Firm’s principal place of business and be open to inspection by every Partner. Accounts shall be closed on [Financial year end] each year. All Firm funds shall be held in bank accounts in the Firm’s name, operated as the Partners decide.'],
    },
    {
      title: 'Duties of the Partners',
      paras: () => ['Each Partner shall devote reasonable time and attention to the Firm’s business, act in good faith, account for any private profit derived from Firm business, and keep the Firm’s affairs confidential.'],
    },
    {
      title: 'Admission, Retirement and Exit',
      paras: () => [
        'A new Partner may be admitted only with the written consent of all Partners. A Partner may retire by giving [Retirement notice] written notice to the others.',
        'On a Partner’s retirement, death or exit, the Firm shall account to them (or their legal representatives) for their share of capital and profits as at the exit date, payable within [Payout period].',
      ],
    },
    {
      title: 'Term and Dissolution',
      paras: () => [
        `The Firm shall continue for the following duration: ${v.term}.`,
        'On dissolution, the Firm’s assets shall be applied first to its debts and liabilities, then to repayment of Partners’ capital, and any surplus shall be shared in the proportion in which profits are shared.',
      ],
    },
    {
      title: 'Restrictive Covenants',
      paras: () => ['During the partnership, no Partner shall carry on a business competing with the Firm without the written consent of the other Partners. [Post-exit restrictions, if any, to the extent permitted by applicable law]'],
    },
    governingLawClause,
    generalClause,
  ],
  signatures: (v) => {
    const names = (v.$partners || '').split(/\n/).map((s) => s.split(',')[0].trim()).filter(Boolean);
    const rows = (names.length ? names : ['[Partner 1]', '[Partner 2]']).map(
      (n) => `| **${n}** | Signature: ${blank(26)} | Date: ${blank(18)} |`,
    );
    return ['| Partner | Signature | Date |', '| --- | --- | --- |', ...rows].join('\n');
  },
};
