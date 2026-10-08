const FONT = 'Times New Roman';
const BODY_SIZE = 24; // half-points = 12pt

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const decode = (s) => s.replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m]);

export function safeFilename(title, ext) {
  const base = (title || 'document').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'document';
  return `${base}.${ext}`;
}

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadMarkdown(title, content) {
  download(new Blob([content], { type: 'text/markdown;charset=utf-8' }), safeFilename(title, 'md'));
}

export function toPlainText(content) {
  return content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\\([\\`*_{}[\]()#+\-.!|~<>])/g, '$1')
    .replace(/^\|\s*-{3,}.*$/gm, '')
    .replace(/^\|(.*)\|\s*$/gm, (_, row) =>
      row
        .split('|')
        .map((c) => c.trim())
        .join('\t'),
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function downloadText(title, content) {
  download(new Blob([toPlainText(content)], { type: 'text/plain;charset=utf-8' }), safeFilename(title, 'txt'));
}

export async function copyText(content) {
  const text = toPlainText(content);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export function printDocument(title) {
  const previous = document.title;
  document.title = title || 'Document';
  const restore = () => {
    document.title = previous;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.print();
}

export async function downloadDocx(title, content) {
  const [docx, { marked }] = await Promise.all([import('docx'), import('marked')]);
  const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, Footer, PageNumber, ShadingType } = docx;

  const runs = (tokens = [], style = {}) => {
    const out = [];
    for (const t of tokens) {
      switch (t.type) {
        case 'strong':
          out.push(...runs(t.tokens, { ...style, bold: true }));
          break;
        case 'em':
          out.push(...runs(t.tokens, { ...style, italics: true }));
          break;
        case 'del':
          out.push(...runs(t.tokens, { ...style, strike: true }));
          break;
        case 'codespan':
          out.push(new TextRun({ text: decode(t.text), font: 'Courier New', ...style }));
          break;
        case 'br':
          out.push(new TextRun({ break: 1 }));
          break;
        case 'link':
          out.push(...runs(t.tokens, style));
          break;
        case 'escape':
          out.push(new TextRun({ text: t.text, ...style }));
          break;
        case 'text':
          if (t.tokens?.length) out.push(...runs(t.tokens, style));
          else out.push(new TextRun({ text: decode(t.text), ...style }));
          break;
        default:
          if (t.raw) out.push(new TextRun({ text: decode(t.raw), ...style }));
      }
    }
    return out;
  };

  const base = { font: FONT, size: BODY_SIZE };
  const withBase = (children) => children.map((c) => c);

  const para = (tokens, opts = {}, style = {}) =>
    new Paragraph({
      children: withBase(runs(tokens, { ...base, ...style })),
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 160, line: 276 },
      ...opts,
    });

  const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB' };
  const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

  const blocks = [];
  const walk = (tokens) => {
    for (const t of tokens) {
      switch (t.type) {
        case 'heading': {
          if (t.depth === 1) {
            blocks.push(para(t.tokens, { alignment: AlignmentType.CENTER, spacing: { before: 120, after: 320 } }, { bold: true, size: 30 }));
          } else {
            blocks.push(para(t.tokens, { alignment: AlignmentType.LEFT, keepNext: true, spacing: { before: 280, after: 120 } }, { bold: true, size: t.depth === 2 ? 25 : 24 }));
          }
          break;
        }
        case 'paragraph':
          blocks.push(para(t.tokens));
          break;
        case 'list':
          t.items.forEach((item, i) => {
            const marker = t.ordered ? `${Number(t.start || 1) + i}.` : '•';
            const inline = item.tokens.flatMap((x) => (x.type === 'text' || x.type === 'paragraph' ? x.tokens ?? [] : []));
            blocks.push(
              new Paragraph({
                children: [new TextRun({ text: `${marker}\t`, ...base }), ...runs(inline, base)],
                alignment: AlignmentType.JUSTIFIED,
                indent: { left: 540, hanging: 360 },
                tabStops: [{ type: 'left', position: 540 }],
                spacing: { after: 100, line: 276 },
              }),
            );
          });
          break;
        case 'table': {
          const rows = [t.header, ...t.rows].map(
            (cells, r) =>
              new TableRow({
                cantSplit: true,
                children: cells.map(
                  (cell) =>
                    new TableCell({
                      borders,
                      margins: { top: 80, bottom: 80, left: 120, right: 120 },
                      shading: r === 0 ? { type: ShadingType.CLEAR, fill: 'F2F2F2', color: 'auto' } : undefined,
                      children: [new Paragraph({ children: runs(cell.tokens, { ...base, bold: r === 0 || undefined }), spacing: { after: 60 } })],
                    }),
                ),
              }),
          );
          blocks.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
          blocks.push(new Paragraph({ children: [], spacing: { after: 160 } }));
          break;
        }
        case 'hr':
          blocks.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999', space: 1 } }, spacing: { after: 160 } }));
          break;
        case 'blockquote':
          walk(t.tokens);
          break;
        case 'code':
          blocks.push(new Paragraph({ children: [new TextRun({ text: t.text, font: 'Courier New', size: 22 })], spacing: { after: 160 } }));
          break;
        default:
          break;
      }
    }
  };
  walk(marked.lexer(content));

  const doc = new Document({
    creator: 'LEGAL LAW',
    title: title || 'Document',
    styles: { default: { document: { run: { font: FONT, size: BODY_SIZE } } } },
    sections: [
      {
        properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], font: FONT, size: 18, color: '777777' }),
                ],
              }),
            ],
          }),
        },
        children: blocks,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  download(blob, safeFilename(title, 'docx'));
}
