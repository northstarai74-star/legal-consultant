import { text, area, select, date, jurisdictionField, disputesField, governingLawClause, generalClause, signatureTable } from './helpers.js';

export default {
  id: 'loan',
  name: 'Loan Agreement',
  category: 'Finance',
  icon: 'Landmark',
  minutes: 3,
  blurb: 'Lend or borrow money with interest, repayment schedule, security and default terms.',
  keywords: ['loan', 'lend', 'borrow', 'promissory', 'credit', 'money lending', 'debt'],
  fields: [
    text('lender', 'Lender', { group: 'Parties', required: true, prefill: 'organization' }),
    text('lenderAddress', 'Lender address', { group: 'Parties', prefill: 'address' }),
    text('borrower', 'Borrower', { group: 'Parties', required: true }),
    text('borrowerAddress', 'Borrower address', { group: 'Parties' }),
    text('principal', 'Loan amount', { group: 'Loan', required: true, placeholder: 'INR 5,00,000' }),
    date('disbursementDate', 'Disbursement date', { group: 'Loan' }),
    text('interest', 'Interest rate', { group: 'Loan', placeholder: '8% per annum, simple interest' }),
    area('repayment', 'Repayment schedule', { group: 'Loan', placeholder: '12 equal monthly instalments of INR 43,500 starting 1 Dec 2026' }),
    date('maturityDate', 'Final repayment date', { group: 'Loan' }),
    text('lateFee', 'Late payment charge', { group: 'Loan', default: '2% per month on overdue amounts' }),
    select('security', 'Security', ['Unsecured', 'Secured by collateral'], { group: 'Security' }),
    area('collateral', 'Collateral description (if secured)', { group: 'Security', rows: 2 }),
    jurisdictionField(),
    disputesField(),
  ],
  title: () => 'LOAN AGREEMENT',
  intro: (v) =>
    `This Loan Agreement (the “**Agreement**”) is made between **${v.lender}**, of ${v.lenderAddress} (the “**Lender**”), and **${v.borrower}**, of ${v.borrowerAddress} (the “**Borrower**”).`,
  clauses: (v) => [
    {
      title: 'Loan',
      paras: () => [
        `The Lender agrees to lend to the Borrower, and the Borrower agrees to borrow, the principal sum of ${v.principal} (the “**Loan**”).`,
        `The Loan shall be disbursed on ${v.disbursementDate} by bank transfer to the account the Borrower designates in writing. The Borrower’s signature below constitutes a receipt for the Loan on disbursement.`,
      ],
    },
    {
      title: 'Interest',
      paras: () => [`Interest shall accrue on the outstanding principal at the rate of ${v.interest}, calculated from the date of disbursement until the Loan is repaid in full.`],
    },
    {
      title: 'Repayment',
      paras: () => [
        `The Borrower shall repay the Loan and accrued interest as follows: ${v.repayment}.`,
        `All outstanding principal, interest and charges shall in any event be paid in full on or before ${v.maturityDate} (the “**Maturity Date**”).`,
        'Payments shall be made without set-off or deduction, and shall be applied first to charges, then to interest, then to principal.',
      ],
    },
    {
      title: 'Prepayment',
      paras: () => ['The Borrower may prepay all or part of the Loan at any time without penalty, on [Prepayment notice] prior written notice, together with accrued interest on the amount prepaid.'],
    },
    {
      title: 'Security',
      paras: () =>
        v.$security === 'Secured by collateral'
          ? [
              `The Borrower’s obligations are secured by the following collateral: ${v.collateral}. The Borrower warrants that it owns the collateral free from other encumbrances and shall not sell, transfer or encumber it while any amount remains outstanding.`,
              'On default, the Lender may enforce its rights over the collateral in accordance with applicable law. The Lender shall release the security promptly once the Loan is repaid in full.',
            ]
          : ['The Loan is unsecured. The Lender’s rights are limited to the Borrower’s personal obligation to repay under this Agreement.'],
    },
    {
      title: 'Representations',
      paras: () => ['The Borrower represents that it has full capacity and authority to enter into this Agreement, that the information it has provided to the Lender is true and complete, and that it is not aware of any circumstance that would impair its ability to repay the Loan.'],
    },
    {
      title: 'Late Payment',
      paras: () => [`If any amount is not paid when due, the Borrower shall pay a late payment charge of ${v.lateFee} from the due date until payment in full.`],
    },
    {
      title: 'Events of Default',
      paras: () => [
        'Each of the following is an event of default: (a) the Borrower fails to pay any amount when due and the failure continues for [Cure period] days; (b) the Borrower breaches any other obligation under this Agreement; (c) any representation proves to have been materially untrue; or (d) the Borrower becomes insolvent or subject to insolvency proceedings.',
        'On an event of default the Lender may, by written notice, declare the entire outstanding Loan, together with accrued interest and charges, immediately due and payable.',
      ],
    },
    governingLawClause,
    generalClause,
  ],
  signatures: (v) => signatureTable({ title: 'The Lender', name: v.lender }, { title: 'The Borrower', name: v.borrower }),
};
