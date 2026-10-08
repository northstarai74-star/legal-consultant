import { text, area, select, date, jurisdictionField, governingLawClause, signatureTable, witnessBlock } from './helpers.js';

export default {
  id: 'poa',
  name: 'Power of Attorney',
  category: 'Personal',
  icon: 'Stamp',
  minutes: 2,
  blurb: 'Authorise a trusted person to act for you in financial, property or specific matters.',
  keywords: ['power of attorney', 'poa', 'attorney', 'authorise', 'authorize', 'agent', 'representative'],
  fields: [
    text('principal', 'Principal (person granting power)', { group: 'Parties', required: true, prefill: 'name' }),
    text('principalAddress', 'Principal address', { group: 'Parties', prefill: 'address' }),
    text('agent', 'Attorney / agent', { group: 'Parties', required: true }),
    text('agentAddress', 'Agent address', { group: 'Parties' }),
    select('scope', 'Type of authority', ['General (broad authority)', 'Financial and banking', 'Property and real estate', 'Limited to specific matters'], { group: 'Powers' }),
    area('powers', 'Specific powers or limits', { group: 'Powers', placeholder: 'e.g. sell the flat at…, operate account no…, represent me before the Sub-Registrar' }),
    select('effective', 'When it takes effect', ['Immediately', 'Only if the principal becomes incapacitated'], { group: 'Powers' }),
    text('duration', 'Duration', { group: 'Powers', default: 'Until revoked in writing' }),
    date('executionDate', 'Date of execution', { group: 'Execution' }),
    jurisdictionField({ help: 'Execution formalities (stamp duty, notarisation, registration) vary by place.' }),
  ],
  title: () => 'POWER OF ATTORNEY',
  intro: (v) =>
    `KNOW ALL PERSONS BY THESE PRESENTS that I, **${v.principal}**, of ${v.principalAddress} (the “**Principal**”), hereby appoint **${v.agent}**, of ${v.agentAddress} (the “**Attorney**”), as my true and lawful attorney on the terms set out below. Made on ${v.executionDate}.`,
  clauses: (v) => [
    {
      title: 'Appointment',
      paras: () => [`The Principal appoints the Attorney to act in the Principal’s name and on the Principal’s behalf in respect of the following authority: ${v.scope}.`],
    },
    {
      title: 'Powers Granted',
      paras: () => [
        `Within the scope above, the Attorney is authorised to do the following: ${v.powers}.`,
        'The Attorney may sign, execute, deliver and register all documents, appear before any authority, court, bank or registrar, and do all acts reasonably incidental to exercising these powers, as fully as the Principal could if personally present.',
      ],
    },
    {
      title: 'Limits on Authority',
      paras: () => [
        'Unless expressly stated above, the Attorney has no authority to make gifts of the Principal’s property, to change the Principal’s will, to delegate the whole of this authority, or to act in a manner that benefits the Attorney personally.',
      ],
    },
    {
      title: 'Effectiveness and Duration',
      paras: () => [`This Power of Attorney takes effect: ${v.effective}. It continues: ${v.duration}, unless revoked earlier or terminated by operation of law.`],
    },
    {
      title: 'Duties of the Attorney',
      paras: () => ['The Attorney shall act in good faith and in the best interests of the Principal, keep the Principal’s property separate from their own, keep accurate records of all transactions, and account to the Principal on request.'],
    },
    {
      title: 'Reliance by Third Parties',
      paras: () => ['Any person dealing with the Attorney under this instrument may rely on it unless they have received written notice of its revocation, and shall not be obliged to enquire into the Attorney’s exercise of authority.'],
    },
    {
      title: 'Revocation',
      paras: () => ['The Principal may revoke this Power of Attorney at any time by written notice to the Attorney and, where appropriate, to any third party who has been relying on it.'],
    },
    {
      title: 'Ratification',
      paras: () => ['The Principal agrees to ratify and confirm all lawful acts done by the Attorney in exercise of the powers granted by this instrument.'],
    },
    {
      title: 'Governing Law',
      paras: () => [`This Power of Attorney shall be governed by and construed in accordance with the laws of ${v.jurisdiction}. [Notarisation, stamp duty or registration details if required]`],
    },
  ],
  signatures: (v) =>
    `${signatureTable({ title: 'The Principal', name: v.principal }, { title: 'Accepted by the Attorney', name: v.agent })}\n\n${witnessBlock()}`,
};
