import { Download, Printer, FileText, FileType2, FileCode2, Copy, ChevronDown } from 'lucide-react';
import { Dropdown } from './ui.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { copyText, downloadDocx, downloadMarkdown, downloadText, printDocument } from '../lib/exportDoc.js';

export default function ExportMenu({ title, content, disabled }) {
  const { toast } = useToast();

  const run = (fn, doneMessage) => async () => {
    try {
      await fn();
      if (doneMessage) toast(doneMessage, { kind: 'success' });
    } catch (err) {
      console.error(err);
      toast('Export failed. Please try again.', { kind: 'error' });
    }
  };

  return (
    <Dropdown
      align="right"
      width={250}
      trigger={({ open, toggle }) => (
        <button className="btn btn--primary btn--sm" onClick={toggle} disabled={disabled} aria-haspopup="menu" aria-expanded={open}>
          <Download size={15} aria-hidden /> Export <ChevronDown size={14} aria-hidden />
        </button>
      )}
    >
      {(close) => {
        const item = (Icon, label, hint, handler) => (
          <button
            role="menuitem"
            className="menu-item"
            onClick={() => {
              close();
              handler();
            }}
          >
            <Icon size={16} aria-hidden />
            <span>
              <strong>{label}</strong>
              <small>{hint}</small>
            </span>
          </button>
        );
        return (
          <>
            {item(Printer, 'Print / Save as PDF', 'Opens the print dialog', () => printDocument(title))}
            {item(FileType2, 'Word document', '.docx, editable in Word', run(() => downloadDocx(title, content), 'Word document downloaded'))}
            {item(FileCode2, 'Markdown', '.md source text', run(() => downloadMarkdown(title, content), 'Markdown downloaded'))}
            {item(FileText, 'Plain text', '.txt without formatting', run(() => downloadText(title, content), 'Text file downloaded'))}
            {item(Copy, 'Copy text', 'To the clipboard', run(async () => (await copyText(content)) || Promise.reject(new Error('copy')), 'Copied to clipboard'))}
          </>
        );
      }}
    </Dropdown>
  );
}
