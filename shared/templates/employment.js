import { text, area, select, date, jurisdictionField, disputesField, governingLawClause, generalClause, signatureTable } from './helpers.js';

export default {
  id: 'employment',
  name: 'Employment Agreement',
  category: 'Employment',
  icon: 'Briefcase',
  popular: true,
  minutes: 3,
  blurb: 'Hire an employee with clear duties, pay, notice, confidentiality and IP terms.',
  keywords: ['employment', 'employee', 'job', 'hire', 'hiring', 'offer letter', 'appointment'],
  fields: [
    text('employer', 'Employer', { group: 'Parties', required: true, prefill: 'organization' }),
    text('employerAddress', 'Employer address', { group: 'Parties', prefill: 'address' }),
    text('employee', 'Employee full name', { group: 'Parties', required: true }),
    text('employeeAddress', 'Employee address', { group: 'Parties' }),
    text('jobTitle', 'Job title', { group: 'Role', required: true, placeholder: 'Senior Software Engineer' }),
    date('startDate', 'Start date', { group: 'Role' }),
    text('workLocation', 'Place of work', { group: 'Role', placeholder: 'Bengaluru office / Remote' }),
    text('hours', 'Working hours', { group: 'Role', default: '40 hours per week, Monday to Friday' }),
    text('salary', 'Salary / compensation', { group: 'Pay & leave', placeholder: 'INR 18,00,000 per annum, paid monthly' }),
    text('leave', 'Annual leave', { group: 'Pay & leave', default: '18 days of paid leave per year' }),
    text('probation', 'Probation period', { group: 'Pay & leave', default: '3 months' }),
    text('noticePeriod', 'Notice period', { group: 'Pay & leave', default: '30 days' }),
    select('covenants', 'Restrictive covenants', ['None', 'Non-solicitation only', 'Non-solicitation and non-compete'], { group: 'Legal terms', help: 'Non-competes are unenforceable or restricted in many jurisdictions.' }),
    jurisdictionField(),
    disputesField(),
  ],
  title: () => 'EMPLOYMENT AGREEMENT',
  intro: (v) =>
    `This Employment Agreement (the “**Agreement**”) is made between **${v.employer}**, of ${v.employerAddress} (the “**Employer**”), and **${v.employee}**, of ${v.employeeAddress} (the “**Employee**”).`,
  clauses: (v) => [
    {
      title: 'Appointment and Duties',
      paras: () => [
        `The Employer appoints the Employee as ${v.jobTitle}, commencing on ${v.startDate} (the “**Start Date**”).`,
        'The Employee shall perform the duties reasonably assigned by the Employer, devote their full working time to the role, comply with the Employer’s lawful instructions and policies, and act with diligence and in good faith.',
      ],
    },
    {
      title: 'Probation',
      paras: () => [
        `The first ${v.probation} of employment is a probationary period, during which performance will be assessed. The Employer may confirm, extend or end the employment during or at the end of probation in accordance with applicable law and this Agreement.`,
      ],
    },
    {
      title: 'Place of Work and Hours',
      paras: () => [
        `The Employee’s place of work is ${v.workLocation}. The Employee’s normal working hours are ${v.hours}, and the Employee may be reasonably required to work additional hours where the role demands, subject to applicable law.`,
      ],
    },
    {
      title: 'Compensation and Benefits',
      paras: () => [
        `The Employee shall receive ${v.salary}, subject to statutory deductions and withholdings.`,
        'The Employee shall be entitled to such benefits, allowances and reimbursements of reasonable business expenses as are provided under the Employer’s policies from time to time. Compensation will be reviewed periodically at the Employer’s discretion.',
      ],
    },
    {
      title: 'Leave',
      paras: () => [
        `The Employee is entitled to ${v.leave}, together with public holidays and any statutory leave (including sick and parental leave) required by applicable law.`,
      ],
    },
    {
      title: 'Confidentiality',
      paras: () => [
        'The Employee shall not, during or after employment, use or disclose any confidential information of the Employer or its clients, including business plans, financial information, customer data, technical information and trade secrets, except as required for the proper performance of their duties or by law.',
      ],
    },
    {
      title: 'Intellectual Property',
      paras: () => [
        'All inventions, works, designs, software and other materials created by the Employee in the course of employment or using the Employer’s resources (“**Work Product**”) shall belong to the Employer. The Employee assigns all rights in the Work Product to the Employer and shall sign any documents reasonably required to give effect to this clause.',
      ],
    },
    ...(v.$covenants === 'None'
      ? []
      : [
          {
            title: 'Restrictive Covenants',
            paras: () => [
              'For twelve (12) months after employment ends, the Employee shall not, directly or indirectly, solicit or entice away any employee, contractor or client of the Employer with whom the Employee had material dealings in the preceding twelve (12) months.',
              ...(v.$covenants === 'Non-solicitation and non-compete'
                ? ['For [Non-compete period] after employment ends, the Employee shall not engage in a business that directly competes with the Employer within [Territory], to the extent permitted by applicable law. The parties acknowledge these restrictions are reasonable and necessary to protect the Employer’s legitimate business interests.']
                : []),
            ],
          },
        ]),
    {
      title: 'Termination',
      paras: () => [
        `Either party may terminate this Agreement by giving ${v.noticePeriod} written notice (or pay in lieu of notice at the Employer’s option).`,
        'The Employer may terminate employment immediately, without notice or payment in lieu, for serious misconduct, material breach of this Agreement, fraud, or any other ground permitted by applicable law.',
      ],
    },
    {
      title: 'Return of Property',
      paras: () => [
        'On termination, the Employee shall promptly return all property, documents, devices, credentials and materials belonging to the Employer, and shall not retain any copies.',
      ],
    },
    governingLawClause,
    generalClause,
  ],
  signatures: (v) => signatureTable({ title: 'For the Employer', name: v.employer }, { title: 'The Employee', name: v.employee }),
};
