import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, ShieldAlert, FileText } from 'lucide-react';

export function Spinner({ size = 16 }) {
  return <Loader2 className="spin" size={size} aria-hidden />;
}

export function StatusPill({ status }) {
  const map = {
    draft: ['Draft', 'pill--draft'],
    final: ['Final', 'pill--final'],
    generating: ['Drafting…', 'pill--live'],
  };
  const [label, cls] = map[status] ?? map.draft;
  return <span className={`pill ${cls}`}>{label}</span>;
}

export function EmptyState({ icon: Icon = FileText, title, children, action }) {
  return (
    <div className="empty">
      <div className="empty__icon">
        <Icon size={26} aria-hidden />
      </div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Disclaimer({ compact = false }) {
  return (
    <div className={`disclaimer ${compact ? 'disclaimer--compact' : ''}`} role="note">
      <ShieldAlert size={16} aria-hidden />
      <span>
        AI-generated drafts are not legal advice. Review every document, and have a qualified lawyer check anything important before you sign.
      </span>
    </div>
  );
}

function useClickAway(ref, onAway, active) {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onAway();
    };
    const key = (e) => e.key === 'Escape' && onAway();
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', key);
    };
  }, [ref, onAway, active]);
}

export function Dropdown({ trigger, children, align = 'left', width }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickAway(ref, () => setOpen(false), open);
  return (
    <div className="dropdown" ref={ref}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div className={`dropdown__menu dropdown__menu--${align}`} style={width ? { width } : undefined} role="menu">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function Modal({ title, children, onClose, footer }) {
  useEffect(() => {
    const key = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [onClose]);
  return createPortal(
    <div className="modal-backdrop no-print" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <h3>{title}</h3>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel, danger = true }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onCancel} autoFocus>
            Cancel
          </button>
          <button className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
