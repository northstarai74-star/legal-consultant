import { text, area, select, date, jurisdictionField } from './helpers.js';

const terms = (v) => [
  {
    title: 'Acceptance of These Terms',
    paras: () => [`By accessing or using ${v.website} or any related service (the “**Service**”) operated by **${v.businessName}** (“**we**”, “**us**”), you agree to be bound by these Terms of Use. If you do not agree, do not use the Service.`],
  },
  {
    title: 'The Service',
    paras: () => [`We provide the following: ${v.serviceDescription}. We may change, suspend or discontinue any part of the Service at any time, and will give reasonable notice of material changes where practicable.`],
  },
  {
    title: 'Eligibility and Accounts',
    paras: () => [
      `You must be at least ${v.minAge} years old to use the Service. If you create an account, you must provide accurate information, keep your credentials secure, and are responsible for all activity under your account. Notify us promptly of any unauthorised use.`,
    ],
  },
  {
    title: 'Acceptable Use',
    paras: () => ['You agree not to: (a) violate any law or third-party right; (b) upload malicious code or attempt to gain unauthorised access to the Service; (c) scrape, reverse-engineer or interfere with the Service; or (d) use the Service to harass, defraud or harm others.'],
  },
  {
    title: 'Intellectual Property',
    paras: () => [`The Service, including its software, design, text and branding, is owned by ${v.businessName} or its licensors and is protected by intellectual property law. We grant you a limited, non-exclusive, non-transferable, revocable licence to use the Service for its intended purpose. You retain ownership of content you submit, and grant us a licence to host and display it as needed to operate the Service.`],
  },
  {
    title: 'Disclaimers and Limitation of Liability',
    paras: () => [
      'The Service is provided “as is” and “as available”, without warranties of any kind, to the extent permitted by law.',
      `To the maximum extent permitted by law, ${v.businessName} shall not be liable for indirect, incidental or consequential damages, or loss of profits, data or goodwill, arising out of your use of the Service.`,
    ],
  },
  {
    title: 'Termination',
    paras: () => ['We may suspend or terminate your access at any time if you breach these Terms or if required by law. You may stop using the Service at any time.'],
  },
  {
    title: 'Governing Law',
    paras: () => [`These Terms are governed by the laws of ${v.jurisdiction}, and the courts of ${v.jurisdiction} shall have exclusive jurisdiction over any dispute arising from them.`],
  },
  {
    title: 'Changes and Contact',
    paras: () => [`We may update these Terms from time to time and will post the updated version with a new effective date. Questions can be sent to ${v.contactEmail}.`],
  },
];

const privacy = (v) => [
  {
    title: 'Who We Are',
    paras: () => [`${v.businessName}, of ${v.businessAddress}, is the controller of personal data collected through ${v.website}. Contact: ${v.contactEmail}.`],
  },
  {
    title: 'Information We Collect',
    paras: () => [`We collect the following categories of personal data: ${v.dataCollected}. We collect it directly from you, automatically through your use of the Service (such as device and usage data), and from third parties where permitted.`],
  },
  {
    title: 'How We Use Information',
    paras: () => ['We use personal data to provide and improve the Service, process transactions, communicate with you, maintain security, prevent fraud, and comply with legal obligations. Where required by law, we rely on your consent, contract performance, legitimate interests or legal obligation as our basis for processing.'],
  },
  {
    title: 'Sharing',
    paras: () => [`We do not sell your personal data. We share it with service providers who help us operate the Service (${v.thirdParties}), where required by law, or in connection with a business transfer, under appropriate safeguards.`],
  },
  {
    title: 'Retention and Security',
    paras: () => ['We retain personal data only as long as necessary for the purposes described or as required by law, and apply reasonable technical and organisational measures to protect it. No method of transmission or storage is completely secure.'],
  },
  {
    title: 'Your Rights',
    paras: () => [`Depending on where you live, you may have the right to access, correct, delete or port your personal data, to object to or restrict processing, and to withdraw consent. To exercise these rights, contact ${v.contactEmail}. You may also lodge a complaint with your local data protection authority.`],
  },
  {
    title: 'Cookies',
    paras: () => ['We use cookies and similar technologies for essential functionality, analytics and, where you consent, personalisation. You can manage cookies through your browser settings.'],
  },
  {
    title: 'Children',
    paras: () => [`The Service is not directed to children under ${v.minAge}, and we do not knowingly collect their personal data.`],
  },
];

export default {
  id: 'terms',
  name: 'Website Terms & Privacy Policy',
  category: 'Digital',
  icon: 'Globe',
  minutes: 3,
  blurb: 'Terms of use and a privacy policy for your website, app or online service.',
  keywords: ['terms', 'privacy', 'policy', 'website', 'terms of service', 'terms and conditions', 'gdpr', 'app'],
  fields: [
    text('businessName', 'Business name', { group: 'Business', required: true, prefill: 'organization' }),
    text('website', 'Website / app', { group: 'Business', placeholder: 'www.example.com' }),
    text('businessAddress', 'Registered address', { group: 'Business', prefill: 'address' }),
    text('contactEmail', 'Contact email', { group: 'Business', placeholder: 'legal@example.com' }),
    select('include', 'Include', ['Terms of Use and Privacy Policy', 'Terms of Use only', 'Privacy Policy only'], { group: 'Document' }),
    date('effectiveDate', 'Effective date', { group: 'Document' }),
    area('serviceDescription', 'What your service does', { group: 'Service', required: true, rows: 3, placeholder: 'An online marketplace connecting tutors and students' }),
    text('minAge', 'Minimum age', { group: 'Service', default: '18' }),
    area('dataCollected', 'Personal data you collect', { group: 'Privacy', rows: 3, placeholder: 'Name, email, phone, payment details, usage analytics' }),
    area('thirdParties', 'Third parties you share data with', { group: 'Privacy', rows: 2, placeholder: 'Payment processors, cloud hosting, analytics providers' }),
    jurisdictionField(),
  ],
  title: (v) => (v.$include === 'Privacy Policy only' ? 'PRIVACY POLICY' : v.$include === 'Terms of Use only' ? 'TERMS OF USE' : 'TERMS OF USE AND PRIVACY POLICY'),
  intro: (v) => `**${v.businessName}** · Effective date: ${v.effectiveDate}`,
  clauses: (v) => {
    const t = terms(v);
    const p = privacy(v);
    if (v.$include === 'Terms of Use only') return t;
    if (v.$include === 'Privacy Policy only') return p;
    return [...t, ...p.map((c) => ({ ...c, title: `Privacy: ${c.title}` }))];
  },
};
