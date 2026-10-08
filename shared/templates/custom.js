import { text, area, select, date, jurisdictionField, disputesField, governingLawClause, generalClause, signatureTable } from './helpers.js';

export default {
  id: 'custom',
  name: 'Custom Document',
  category: 'Other',
  icon: 'Sparkles',
  minutes: 2,
  blurb: 'Describe any legal document in plain language and let AI draft it from scratch.',
  keywords: [],
  fields: [
    text('docType', 'Type of document', { group: 'Document', required: true, placeholder: 'e.g. Settlement agreement, Founders’ agreement, Gift deed' }),
    area('description', 'Describe what you need', { group: 'Document', required: true, rows: 5, placeholder: 'Who is involved, what each side agrees to, amounts, dates, special conditions…' }),
    area('parties', 'Parties (names and addresses)', { group: 'Parties', rows: 3, placeholder: 'Party A: …\nParty B: …' }),
    date('effectiveDate', 'Effective date', { group: 'Document' }),
    jurisdictionField(),
    disputesField(),
  ],
  title: (v) => (v.$docType ? v.$docType.toUpperCase() : 'LEGAL DOCUMENT'),
  intro: (v) => `This document (the “**Agreement**”) is made on ${v.effectiveDate} between the parties identified below.\n\n**Parties:** ${v.parties}`,
  clauses: (v) => [
    {
      title: 'Background',
      paras: () => [`${v.description}`],
    },
    {
      title: 'Definitions and Interpretation',
      paras: () => ['In this Agreement, capitalised terms have the meanings given where they first appear, headings are for convenience only, and references to a person include their successors and permitted assigns.'],
    },
    {
      title: 'Obligations of the Parties',
      paras: () => ['[Obligations of Party A]', '[Obligations of Party B]', 'Each party shall perform its obligations in good faith, with reasonable care, and in compliance with applicable law.'],
    },
    {
      title: 'Consideration and Payment',
      paras: () => ['[Amounts, payment dates and method]'],
    },
    {
      title: 'Term and Termination',
      paras: () => ['This Agreement commences on the effective date and continues until [Term / end date] unless terminated earlier by mutual written agreement or by either party on written notice if the other commits a material breach that is not remedied within thirty (30) days of notice.'],
    },
    {
      title: 'Confidentiality',
      paras: () => ['Each party shall keep the terms of this Agreement and any non-public information received from the other confidential, except as required by law or to its professional advisers.'],
    },
    {
      title: 'Representations',
      paras: () => ['Each party represents that it has full capacity and authority to enter into and perform this Agreement, and that doing so does not breach any other obligation by which it is bound.'],
    },
    {
      title: 'Limitation of Liability',
      paras: () => ['To the extent permitted by law, neither party shall be liable to the other for indirect or consequential loss. Nothing in this Agreement limits liability that cannot be limited by law.'],
    },
    governingLawClause,
    generalClause,
  ],
  signatures: () => signatureTable({ title: 'Party A', name: '[Party A]' }, { title: 'Party B', name: '[Party B]' }),
};
