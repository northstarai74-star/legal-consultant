import { text, area, select, date, jurisdictionField, disputesField, governingLawClause, generalClause, signatureTable } from './helpers.js';

export default {
  id: 'service',
  name: 'Service Agreement',
  category: 'Business',
  icon: 'FileSignature',
  minutes: 3,
  blurb: 'A B2B master services agreement covering scope, fees, liability and termination.',
  keywords: ['service agreement', 'services agreement', 'msa', 'master services', 'vendor', 'supply of services'],
  fields: [
    text('provider', 'Service provider', { group: 'Parties', required: true, prefill: 'organization' }),
    text('providerAddress', 'Provider address', { group: 'Parties', prefill: 'address' }),
    text('client', 'Client', { group: 'Parties', required: true }),
    text('clientAddress', 'Client address', { group: 'Parties' }),
    date('effectiveDate', 'Effective date', { group: 'Scope' }),
    area('services', 'Description of services', { group: 'Scope', required: true, placeholder: 'Managed IT support, including…' }),
    area('serviceLevels', 'Service levels / standards (optional)', { group: 'Scope', placeholder: 'Response within 4 business hours…' }),
    text('term', 'Initial term', { group: 'Scope', default: '12 months' }),
    text('fees', 'Fees', { group: 'Payment', placeholder: 'INR 75,000 per month' }),
    select('paymentTerms', 'Payment terms', ['Within 30 days of invoice', 'Within 15 days of invoice', 'Monthly in advance', 'On milestone completion'], { group: 'Payment' }),
    select('liabilityCap', 'Liability cap', ['Fees paid in the preceding 12 months', 'Total fees payable under this Agreement', 'Direct losses, without a monetary cap'], { group: 'Legal terms' }),
    jurisdictionField(),
    disputesField(),
  ],
  title: () => 'SERVICE AGREEMENT',
  intro: (v) =>
    `This Service Agreement (the “**Agreement**”) is made on ${v.effectiveDate} between **${v.provider}**, of ${v.providerAddress} (the “**Provider**”), and **${v.client}**, of ${v.clientAddress} (the “**Client**”).`,
  clauses: (v) => [
    {
      title: 'Services',
      paras: () => [
        `The Provider shall provide the following services to the Client (the “**Services**”): ${v.services}.`,
        ...(v.$serviceLevels ? [`The Provider shall meet the following service standards: ${v.serviceLevels}.`] : []),
        'The Provider shall perform the Services with reasonable skill and care, using suitably qualified personnel, and in compliance with applicable law.',
      ],
    },
    {
      title: 'Term and Renewal',
      paras: () => [`This Agreement commences on the Effective Date and continues for ${v.term} (the “**Initial Term**”), after which it renews for successive periods of equal length unless either party gives at least [Non-renewal notice] written notice of non-renewal.`],
    },
    {
      title: 'Fees and Payment',
      paras: () => [
        `The Client shall pay the Provider ${v.fees}. Invoices are payable: ${v.paymentTerms}.`,
        'Fees are exclusive of applicable taxes, which the Client shall pay where required by law. Overdue amounts shall bear interest at [Late interest rate] from the due date until payment.',
      ],
    },
    {
      title: 'Client Responsibilities',
      paras: () => ['The Client shall provide timely access to information, systems, personnel and decisions reasonably required for the Provider to perform the Services, and acknowledges that delays caused by the Client may affect timelines and fees.'],
    },
    {
      title: 'Confidentiality',
      paras: () => ['Each party shall keep confidential all non-public information of the other received under this Agreement, use it only to perform or receive the Services, and not disclose it to third parties except to personnel and advisers who need to know it or as required by law. This obligation survives termination for [Confidentiality period].'],
    },
    {
      title: 'Data Protection',
      paras: () => ['Each party shall comply with data protection laws applicable to it. To the extent the Provider processes personal data on behalf of the Client, it shall do so only on the Client’s documented instructions and shall implement appropriate technical and organisational security measures.'],
    },
    {
      title: 'Intellectual Property',
      paras: () => ['Each party retains ownership of its pre-existing intellectual property. Unless otherwise agreed in writing, materials created specifically for the Client under this Agreement shall be owned by the Client upon payment, and the Provider retains ownership of its tools, methodologies and general know-how.'],
    },
    {
      title: 'Warranties',
      paras: () => ['Each party warrants that it has authority to enter into this Agreement. The Provider warrants that the Services will conform in all material respects to the description in this Agreement. Except as expressly stated, all other warranties are excluded to the extent permitted by law.'],
    },
    {
      title: 'Limitation of Liability',
      paras: () => [
        `Subject to the next paragraph, each party’s total liability arising out of this Agreement shall not exceed: ${v.liabilityCap}.`,
        'Nothing in this Agreement limits liability for death or personal injury caused by negligence, fraud, wilful misconduct, or any liability that cannot be limited by law. Neither party shall be liable for loss of profit or indirect or consequential loss.',
      ],
    },
    {
      title: 'Indemnity',
      paras: () => ['Each party shall indemnify the other against third-party claims to the extent arising from its breach of confidentiality, its infringement of third-party intellectual property rights, or its wilful misconduct, subject to prompt notice of the claim and reasonable cooperation.'],
    },
    {
      title: 'Termination',
      paras: () => [
        'Either party may terminate this Agreement immediately by written notice if the other party commits a material breach that is not remedied within thirty (30) days of written notice, or becomes insolvent.',
        'On termination, the Client shall pay for Services performed up to the termination date, and each party shall return or destroy the other’s confidential information. Clauses intended to survive termination shall continue in force.',
      ],
    },
    governingLawClause,
    generalClause,
  ],
  signatures: (v) => signatureTable({ title: 'For the Provider', name: v.provider }, { title: 'For the Client', name: v.client }),
};
