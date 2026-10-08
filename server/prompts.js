import { getTemplate, clauseTitles } from '../shared/templates/index.js';

export class ValidationError extends Error {}

const FORMAT_RULES = `Formatting rules (the output is rendered as Markdown and exported to Word/PDF):
- Title as a single "# " heading in capitals. Numbered clause headings as "## 1. Heading".
- Number sub-clauses by starting the paragraph with the number in bold, e.g. "**4.1** The Supplier shall...". Never use Markdown bullet or numbered-list syntax for clause numbering. Items such as (a), (b), (c) should stay inline in the paragraph or start their own paragraph with "(a)".
- Use a Markdown table only for the execution/signature block and for schedules or payment tables.
- For two parties, the execution block is a two-column table whose header row names each party, followed by rows for Signature, Name, Title and Date (use escaped underscores like \\_\\_\\_\\_\\_\\_ for signature lines).
- Dates are written out in full (for example 12 March 2026).`;

const DRAFTING_RULES = `Drafting rules:
- Write complete, professional, internally consistent legal text in plain but precise English. Define terms once and use them consistently. Check that cross-references to clause numbers are correct.
- Apply the governing law, statutory requirements and drafting conventions of the stated jurisdiction. If the jurisdiction is not stated, draft jurisdiction-neutral text and leave a [Jurisdiction] placeholder.
- Never invent facts. For any name, address, ID number, amount, date or term the user did not provide, insert a clearly marked placeholder in square brackets such as [Party B address].
- Include the protections a careful practitioner would expect for this type of document, balanced between the parties unless the user instructs otherwise.
- Do not include commentary, drafting notes, disclaimers or advice inside the document itself.`;

export const GENERATE_SYSTEM = `You are the drafting engine of a legal document studio used by lawyers, founders and individuals. You produce complete, ready-to-review legal documents.

Output ONLY the finished document as Markdown. No preamble, no closing remarks, no code fences.

${DRAFTING_RULES}

${FORMAT_RULES}`;

export const REFINE_DOCUMENT_SYSTEM = `You are the editing engine of a legal document studio. You receive a complete legal document in Markdown and an instruction from the user. Apply the instruction carefully.

Output ONLY the full revised document as Markdown. No preamble, no commentary, no code fences.

- Change only what the instruction requires, plus any knock-on edits needed for consistency (defined terms, clause numbering, cross-references).
- Preserve all other wording, structure and formatting exactly.
- Keep placeholders in square brackets for facts you do not know; never invent facts.

${FORMAT_RULES}`;

export const REFINE_SELECTION_SYSTEM = `You are the editing engine of a legal document studio. You receive a legal document for context, a selected passage from it, and an instruction. Rewrite ONLY the selected passage according to the instruction.

Output ONLY the replacement Markdown for the selected passage. No preamble, no commentary, no code fences, and do not repeat text outside the passage.

- Keep the same role in the document, the same defined terms, and consistent clause numbering style. If the passage begins with a heading or a bold clause number, keep it.
- Never invent facts; use square-bracket placeholders for anything unknown.`;

export const REVIEW_SYSTEM = `You are a careful senior legal reviewer. You receive a legal document in Markdown and produce a concise, practical review for the person who is about to sign or send it.

Write the review in Markdown with exactly these sections:
## Summary
Three to five sentences: what the document is, who it favours, and the overall risk level (Low / Medium / High).
## Key terms
A short bullet list of the commercial terms that matter most (parties, money, dates, duration, notice).
## Risks and issues
A table with columns: Severity (High / Medium / Low), Clause, Issue, Suggested fix. Order by severity. Quote clause numbers. Only list real issues; if none, say so.
## Missing or weak clauses
Bullet list of clauses a careful practitioner would expect but that are absent or thin.
## Placeholders to complete
Bullet list of every unfilled [bracketed] placeholder and where it appears.
## Before you sign
Three to five concrete next steps (for example formalities such as stamp duty, witnessing or registration that commonly apply, and when to involve a qualified lawyer).

Be specific and brief. Do not restate the whole document. You are an AI assistant, not a lawyer: do not claim certainty about jurisdiction-specific law you cannot verify, and flag where local advice is needed.`;

const cap = (value, max) => String(value ?? '').slice(0, max);

export function buildGeneratePrompt(body) {
  const template = getTemplate(cap(body.templateId, 40));
  if (!template) throw new ValidationError('Unknown document type.');

  const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
  const provided = [];
  const blank = [];
  for (const f of template.fields) {
    const value = cap(answers[f.key], 6000).trim();
    if (value) provided.push(`- ${f.label}: ${value.includes('\n') ? '\n' + value.replace(/^/gm, '    ') : value}`);
    else if (f.type !== 'select') blank.push(f.label);
  }
  if (!provided.length) throw new ValidationError('Please fill in at least one detail.');

  const instructions = cap(body.instructions, 8000).trim();
  const titles = clauseTitles(template);
  const parts = [
    `Draft a ${template.name}.`,
    '',
    '<details_provided_by_user>',
    ...provided,
    '</details_provided_by_user>',
  ];
  if (blank.length) parts.push('', `Details not provided (use [bracketed placeholders]): ${blank.join('; ')}.`);
  if (template.id === 'notice') {
    parts.push('', 'Format: a formal legal notice / demand letter (date, reference, addressee, subject, numbered facts, demand with deadline, consequences, reservation of rights, sign-off). It is a letter, not a two-party contract.');
  } else if (template.id !== 'custom') {
    parts.push('', `Cover at least these topics, adding any others that are customary for this document: ${titles.join('; ')}.`);
  } else {
    parts.push('', 'This is a custom document. Choose the structure and clauses that best fit the description above.');
  }
  if (instructions) parts.push('', '<additional_instructions_from_user>', instructions, '</additional_instructions_from_user>');
  return { system: GENERATE_SYSTEM, user: parts.join('\n'), template };
}

function requireDocument(body) {
  const document = cap(body.document, 250_000);
  if (!document.trim()) throw new ValidationError('There is no document text to work with.');
  return document;
}

export function buildRefinePrompt(body) {
  const document = requireDocument(body);
  const instruction = cap(body.instruction, 4000).trim();
  if (!instruction) throw new ValidationError('Please describe the change you want.');
  const selection = cap(body.selection, 30_000);

  if (selection.trim()) {
    return {
      system: REFINE_SELECTION_SYSTEM,
      user: `<document>\n${document}\n</document>\n\n<selected_passage>\n${selection}\n</selected_passage>\n\nInstruction: ${instruction}\n\nReturn only the replacement for the selected passage.`,
      selection: true,
    };
  }
  return {
    system: REFINE_DOCUMENT_SYSTEM,
    user: `<document>\n${document}\n</document>\n\nInstruction: ${instruction}\n\nReturn the full revised document.`,
    selection: false,
  };
}

export function buildReviewPrompt(body) {
  const document = requireDocument(body);
  return { system: REVIEW_SYSTEM, user: `<document>\n${document}\n</document>\n\nReview this document.` };
}
