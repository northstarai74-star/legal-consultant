import { text, area, select, date, jurisdictionField, disputesField, governingLawClause, generalClause, signatureTable } from './helpers.js';

export default {
  id: 'nda',
  name: 'Non-Disclosure Agreement',
  category: 'Business',
  icon: 'ShieldCheck',
  popular: true,
  minutes: 2,
  blurb: 'Protect confidential information shared with a partner, vendor, investor or employee.',
  keywords: ['nda', 'non-disclosure', 'non disclosure', 'confidentiality', 'confidential'],
  fields: [
    select('ndaType', 'Type of NDA', ['Mutual', 'One-way'], { group: 'Basics', help: 'Mutual: both sides share secrets. One-way: only Party A shares.' }),
    date('effectiveDate', 'Effective date', { group: 'Basics' }),
    text('partyA', 'Party A (discloser)', { group: 'Parties', required: true, prefill: 'organization', placeholder: 'Acme Technologies Pvt. Ltd.' }),
    text('partyAAddress', 'Party A address', { group: 'Parties', prefill: 'address' }),
    text('partyB', 'Party B (recipient)', { group: 'Parties', required: true, placeholder: 'Jane Doe' }),
    text('partyBAddress', 'Party B address', { group: 'Parties' }),
    area('purpose', 'Purpose of sharing information', { group: 'Terms', placeholder: 'Evaluating a potential software development partnership' }),
    text('term', 'Agreement term', { group: 'Terms', default: '2 years' }),
    text('survival', 'Confidentiality survives for', { group: 'Terms', default: '3 years', help: 'How long after the term ends the duty of confidence continues.' }),
    jurisdictionField(),
    disputesField(),
  ],
  title: (v) => (v.$ndaType === 'One-way' ? 'ONE-WAY NON-DISCLOSURE AGREEMENT' : 'MUTUAL NON-DISCLOSURE AGREEMENT'),
  intro: (v) =>
    `This Non-Disclosure Agreement (the “**Agreement**”) is made on ${v.effectiveDate} (the “**Effective Date**”) between **${v.partyA}**, of ${v.partyAAddress} (“**Party A**”), and **${v.partyB}**, of ${v.partyBAddress} (“**Party B**”). ${
      v.$ndaType === 'One-way'
        ? 'Party A wishes to disclose certain confidential information to Party B, who agrees to receive it on the terms below.'
        : 'Each party may disclose confidential information to the other, and both agree to protect it on the terms below.'
    }`,
  clauses: (v) => {
    const mutual = v.$ndaType !== 'One-way';
    const who = mutual ? 'one party (the “**discloser**”)' : 'Party A (the “**discloser**”)';
    const recipient = mutual ? 'the other party (the “**recipient**”)' : 'Party B (the “**recipient**”)';
    return [
      {
        title: 'Definitions',
        paras: () => [
          `“**Confidential Information**” means all non-public information, in any form, disclosed by or on behalf of ${who} to ${recipient}, whether before or after the Effective Date, that is marked confidential or that a reasonable person would understand to be confidential given its nature and the circumstances of disclosure. This includes business plans, financial data, customer and supplier information, technical data, source code, designs, know-how and trade secrets.`,
          `“**Purpose**” means ${v.purpose}.`,
        ],
      },
      {
        title: 'Obligations of the Receiving Party',
        paras: () => [
          `${mutual ? 'Each party, as recipient,' : 'Party B'} shall: (a) use Confidential Information solely for the Purpose; (b) keep it strictly confidential and protect it with at least the same degree of care it uses for its own confidential information, and no less than reasonable care; and (c) not disclose it to any third party except as permitted by this Agreement.`,
          'Disclosure is permitted only to those directors, employees, advisers and contractors who need to know the information for the Purpose and who are bound by confidentiality obligations no less protective than those in this Agreement. The recipient is responsible for any breach by such persons.',
        ],
      },
      {
        title: 'Exclusions',
        paras: () => [
          'Confidential Information does not include information that: (a) is or becomes publicly available other than through a breach of this Agreement; (b) was lawfully known to the recipient before disclosure; (c) is lawfully received from a third party without a duty of confidentiality; or (d) is independently developed by the recipient without use of or reference to the Confidential Information.',
        ],
      },
      {
        title: 'Compelled Disclosure',
        paras: () => [
          'If the recipient is required by law, regulation or court order to disclose Confidential Information, it shall (where lawful) give the discloser prompt written notice, cooperate in seeking protective measures, and disclose only the portion legally required.',
        ],
      },
      {
        title: 'Return and Destruction',
        paras: () => [
          'On written request, or on termination or expiry of this Agreement, the recipient shall promptly return or securely destroy all Confidential Information and copies, and confirm in writing that it has done so. Copies held in routine electronic backups may be retained provided they remain subject to this Agreement.',
        ],
      },
      {
        title: 'Term and Survival',
        paras: () => [
          `This Agreement remains in effect for ${v.term} from the Effective Date unless terminated earlier by either party on written notice.`,
          `The obligations of confidentiality shall survive expiry or termination for a period of ${v.survival}, and trade secrets shall remain protected for as long as they qualify as trade secrets under applicable law.`,
        ],
      },
      {
        title: 'No Licence; No Warranty',
        paras: () => [
          'All Confidential Information remains the property of the discloser. No licence or other right in any intellectual property is granted by this Agreement. Confidential Information is provided “as is”, without warranty of accuracy or completeness.',
        ],
      },
      {
        title: 'Remedies',
        paras: () => [
          'The parties acknowledge that unauthorised use or disclosure of Confidential Information may cause irreparable harm for which damages alone would be an inadequate remedy, and that the discloser is entitled to seek injunctive or other equitable relief, in addition to any other remedy available at law.',
        ],
      },
      governingLawClause,
      generalClause,
    ];
  },
  signatures: (v) => signatureTable({ title: 'For and on behalf of Party A', name: v.partyA }, { title: 'For and on behalf of Party B', name: v.partyB }),
};
