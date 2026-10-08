import { text, area, select, date, jurisdictionField, disputesField, governingLawClause, generalClause, signatureTable } from './helpers.js';

export default {
  id: 'freelance',
  name: 'Freelance / Contractor Agreement',
  category: 'Business',
  icon: 'Handshake',
  popular: true,
  minutes: 3,
  blurb: 'Engage an independent contractor with defined scope, payment and IP ownership.',
  keywords: ['freelance', 'freelancer', 'contractor', 'consultant', 'consulting', 'independent contractor'],
  fields: [
    text('client', 'Client', { group: 'Parties', required: true, prefill: 'organization' }),
    text('clientAddress', 'Client address', { group: 'Parties', prefill: 'address' }),
    text('contractor', 'Contractor / freelancer', { group: 'Parties', required: true }),
    text('contractorAddress', 'Contractor address', { group: 'Parties' }),
    area('services', 'Services to be performed', { group: 'Scope', required: true, placeholder: 'Design and develop a marketing website…' }),
    area('deliverables', 'Deliverables', { group: 'Scope', placeholder: 'Source files, final designs, documentation…' }),
    date('startDate', 'Start date', { group: 'Scope' }),
    text('duration', 'Duration / end date', { group: 'Scope', default: '3 months' }),
    text('fee', 'Fee', { group: 'Payment', placeholder: 'USD 4,500 fixed fee' }),
    select('paymentTerms', 'Payment terms', ['Within 30 days of invoice', 'Within 15 days of invoice', 'On milestone completion', '50% upfront, 50% on delivery'], { group: 'Payment' }),
    text('revisions', 'Revisions included', { group: 'Payment', default: 'Two rounds of revisions' }),
    select('ip', 'Intellectual property', ['Client owns all deliverables on payment', 'Contractor retains ownership and licenses the client'], { group: 'Legal terms' }),
    jurisdictionField(),
    disputesField(),
  ],
  title: () => 'INDEPENDENT CONTRACTOR AGREEMENT',
  intro: (v) =>
    `This Independent Contractor Agreement (the “**Agreement**”) is made between **${v.client}**, of ${v.clientAddress} (the “**Client**”), and **${v.contractor}**, of ${v.contractorAddress} (the “**Contractor**”).`,
  clauses: (v) => [
    {
      title: 'Services',
      paras: () => [
        `The Contractor shall provide the following services to the Client (the “**Services**”): ${v.services}.`,
        `The Contractor shall deliver the following (the “**Deliverables**”): ${v.deliverables}.`,
        'The Contractor shall perform the Services with reasonable skill, care and diligence, in a professional manner, and in accordance with any reasonable specifications supplied by the Client.',
      ],
    },
    {
      title: 'Term',
      paras: () => [`This Agreement begins on ${v.startDate} and continues for ${v.duration}, unless terminated earlier in accordance with this Agreement.`],
    },
    {
      title: 'Fees and Payment',
      paras: () => [
        `The Client shall pay the Contractor ${v.fee} for the Services. Payment shall be made: ${v.paymentTerms}.`,
        'Unless otherwise agreed in writing, the fee is exclusive of applicable taxes, which shall be payable in addition where required by law. The Contractor is responsible for their own income taxes and statutory contributions.',
        'Reasonable pre-approved expenses incurred in performing the Services shall be reimbursed by the Client on production of receipts.',
      ],
    },
    {
      title: 'Review and Acceptance',
      paras: () => [
        `The Client shall review each Deliverable within [Review period] of receipt. The fee includes: ${v.revisions}. Additional work beyond this scope shall be agreed in writing and charged separately.`,
      ],
    },
    {
      title: 'Independent Contractor Status',
      paras: () => [
        'The Contractor is an independent contractor and not an employee, partner or agent of the Client. The Contractor controls the manner and means of performing the Services, supplies their own tools, and is not entitled to employee benefits. Neither party may bind the other.',
      ],
    },
    {
      title: 'Intellectual Property',
      paras: () =>
        v.$ip === 'Contractor retains ownership and licenses the client'
          ? [
              'The Contractor retains ownership of all intellectual property in the Deliverables. Upon full payment, the Contractor grants the Client a non-exclusive, perpetual, worldwide, royalty-free licence to use, reproduce and modify the Deliverables for the Client’s business purposes.',
              'The Client retains ownership of all materials it supplies to the Contractor.',
            ]
          : [
              'Upon full payment, the Contractor assigns to the Client all right, title and interest in the Deliverables, including all intellectual property rights. The Contractor retains ownership of pre-existing materials and general know-how, and grants the Client a perpetual, worldwide, royalty-free licence to use such materials as incorporated in the Deliverables.',
              'The Contractor shall sign any documents reasonably required to give effect to this assignment.',
            ],
    },
    {
      title: 'Confidentiality',
      paras: () => [
        'The Contractor shall keep confidential, and use only for the purpose of the Services, all non-public information of the Client received under this Agreement, during the term and for [Confidentiality period] afterwards, except where disclosure is required by law.',
      ],
    },
    {
      title: 'Warranties',
      paras: () => [
        'The Contractor warrants that the Deliverables will be original (or properly licensed), will not knowingly infringe any third party’s rights, and that the Contractor has the right to enter into this Agreement.',
      ],
    },
    {
      title: 'Termination',
      paras: () => [
        'Either party may terminate this Agreement on [Notice period] written notice. Either party may terminate immediately on written notice if the other commits a material breach that is not remedied within ten (10) days of notice.',
        'On termination, the Client shall pay for Services properly performed up to the date of termination, and the Contractor shall deliver all work in progress.',
      ],
    },
    {
      title: 'Limitation of Liability',
      paras: () => [
        'To the extent permitted by law, neither party shall be liable for indirect or consequential loss, and the Contractor’s total liability under this Agreement shall not exceed the fees paid or payable under it.',
      ],
    },
    governingLawClause,
    generalClause,
  ],
  signatures: (v) => signatureTable({ title: 'For the Client', name: v.client }, { title: 'The Contractor', name: v.contractor }),
};
