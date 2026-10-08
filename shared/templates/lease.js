import { text, area, select, date, jurisdictionField, disputesField, governingLawClause, generalClause, signatureTable, witnessBlock } from './helpers.js';

export default {
  id: 'lease',
  name: 'Rental / Lease Agreement',
  category: 'Property',
  icon: 'Home',
  popular: true,
  minutes: 3,
  blurb: 'Residential tenancy with rent, deposit, maintenance, notice and lock-in terms.',
  keywords: ['lease', 'rent', 'rental', 'tenant', 'landlord', 'tenancy', 'flat', 'apartment', 'house', 'property rent'],
  fields: [
    text('landlord', 'Landlord / Lessor', { group: 'Parties', required: true }),
    text('landlordAddress', 'Landlord address', { group: 'Parties' }),
    text('tenant', 'Tenant / Lessee', { group: 'Parties', required: true }),
    text('tenantAddress', 'Tenant permanent address', { group: 'Parties' }),
    area('propertyAddress', 'Property address', { group: 'Property', required: true, rows: 2 }),
    select('furnishing', 'Furnishing', ['Unfurnished', 'Semi-furnished', 'Fully furnished'], { group: 'Property' }),
    date('startDate', 'Lease start date', { group: 'Term' }),
    text('term', 'Lease term', { group: 'Term', default: '11 months' }),
    text('lockIn', 'Lock-in period', { group: 'Term', default: '3 months' }),
    text('noticePeriod', 'Notice period', { group: 'Term', default: '1 month' }),
    text('rent', 'Monthly rent', { group: 'Money', placeholder: 'INR 35,000 per month' }),
    text('rentDue', 'Rent due date', { group: 'Money', default: 'by the 5th day of each month' }),
    text('deposit', 'Security deposit', { group: 'Money', placeholder: 'INR 1,05,000 (refundable)' }),
    text('utilities', 'Utilities & maintenance', { group: 'Money', default: 'Tenant pays electricity, water, internet and gas; Landlord bears structural repairs and property tax' }),
    jurisdictionField(),
    disputesField(),
  ],
  title: () => 'RESIDENTIAL LEASE AGREEMENT',
  intro: (v) =>
    `This Lease Agreement (the “**Agreement**”) is made between **${v.landlord}**, of ${v.landlordAddress} (the “**Landlord**”), and **${v.tenant}**, of ${v.tenantAddress} (the “**Tenant**”).`,
  clauses: (v) => [
    {
      title: 'Premises and Use',
      paras: () => [
        `The Landlord lets to the Tenant the ${v.furnishing.toLowerCase()} residential premises located at ${v.propertyAddress} (the “**Premises**”), together with the fixtures and fittings listed in the inventory annexed to this Agreement.`,
        'The Premises shall be used solely as a private residence for the Tenant and their immediate family, and not for any commercial or unlawful purpose.',
      ],
    },
    {
      title: 'Term',
      paras: () => [`The lease commences on ${v.startDate} and continues for ${v.term}, unless renewed or terminated earlier in accordance with this Agreement. Any renewal shall be by mutual written agreement, on such revised rent as the parties agree.`],
    },
    {
      title: 'Rent',
      paras: () => [
        `The Tenant shall pay rent of ${v.rent}, payable in advance ${v.rentDue}, by bank transfer or such other method as the Landlord notifies in writing.`,
        'If rent is not paid within [Grace period] days of the due date, the Landlord may charge interest at [Late interest rate] on the overdue amount, without prejudice to any other remedy.',
      ],
    },
    {
      title: 'Security Deposit',
      paras: () => [
        `On signing this Agreement the Tenant shall pay a security deposit of ${v.deposit}. The deposit is interest-free, is not to be treated as advance rent, and may be applied towards unpaid rent, utilities or damage beyond normal wear and tear.`,
        'The Landlord shall refund the balance within [Refund period] days after the Tenant vacates and returns the Premises, subject to lawful deductions itemised in writing.',
      ],
    },
    {
      title: 'Utilities and Maintenance',
      paras: () => [
        `Utilities and maintenance responsibilities are as follows: ${v.utilities}.`,
        'The Tenant shall keep the Premises in good and clean condition, promptly report defects, and be liable for damage caused by the Tenant or their visitors, other than normal wear and tear.',
      ],
    },
    {
      title: 'Alterations and Sub-letting',
      paras: () => ['The Tenant shall not make structural alterations, nor sub-let, assign or part with possession of the Premises, without the Landlord’s prior written consent.'],
    },
    {
      title: 'Landlord’s Access',
      paras: () => ['The Landlord may enter the Premises at reasonable times on at least [Access notice] prior notice to inspect, carry out repairs, or show the Premises to prospective tenants or buyers, and at any time in an emergency.'],
    },
    {
      title: 'Lock-in and Termination',
      paras: () => [
        `Neither party may terminate this Agreement during the initial lock-in period of ${v.lockIn}. After the lock-in period, either party may terminate by giving ${v.noticePeriod} written notice.`,
        'The Landlord may terminate immediately on written notice if the Tenant fails to pay rent within [Default period] days of the due date, materially breaches this Agreement, or uses the Premises unlawfully.',
      ],
    },
    {
      title: 'Handover on Expiry',
      paras: () => ['On expiry or termination, the Tenant shall vacate and hand over peaceful possession of the Premises in the condition received, fair wear and tear excepted, together with all keys and fittings, and shall clear all dues.'],
    },
    governingLawClause,
    generalClause,
  ],
  signatures: (v) => `${signatureTable({ title: 'The Landlord', name: v.landlord }, { title: 'The Tenant', name: v.tenant })}\n\n${witnessBlock()}`,
};
