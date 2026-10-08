import { Children, memo, useLayoutEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Pencil, Sparkles, Plus, Trash2 } from 'lucide-react';

export const splitBlocks = (content) => {
  const text = (content ?? '').replace(/\r\n/g, '\n').trim();
  return text ? text.split(/\n{2,}/) : [];
};
export const joinBlocks = (blocks) => blocks.join('\n\n') + '\n';

const PLACEHOLDER = /(\[[^\]\n]{2,80}\])/g;

function mark(children) {
  return Children.map(children, (child) =>
    typeof child === 'string'
      ? child.split(PLACEHOLDER).map((part, i) =>
          i % 2 ? (
            <mark key={i} className="ph" title="Fill in this detail">
              {part}
            </mark>
          ) : (
            part
          ),
        )
      : child,
  );
}

const wrap = (Tag) =>
  function Wrapped({ node, children, ...props }) {
    return <Tag {...props}>{mark(children)}</Tag>;
  };

const COMPONENTS = {
  p: wrap('p'),
  li: wrap('li'),
  td: wrap('td'),
  th: wrap('th'),
  strong: wrap('strong'),
  em: wrap('em'),
  h1: wrap('h1'),
  h2: wrap('h2'),
  h3: wrap('h3'),
};

export const Markdown = memo(function Markdown({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
      {children}
    </ReactMarkdown>
  );
});

function BlockEditor({ initial, onCommit, onCancel, onDelete }) {
  const [value, setValue] = useState(initial);
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);

  useLayoutEffect(() => {
    ref.current?.focus();
    const len = ref.current?.value.length ?? 0;
    ref.current?.setSelectionRange(len, len);
  }, []);

  return (
    <div
      className="block-editor"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onCommit(value);
      }}
    >
      <textarea
        ref={ref}
        value={value}
        spellCheck
        aria-label="Edit paragraph (Markdown)"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onCommit(value);
          }
        }}
      />
      <div className="block-editor__bar">
        <span className="block-editor__hint">Markdown supported · Ctrl+Enter to save · Esc to cancel</span>
        <button className="btn btn--ghost btn--sm" onClick={onDelete}>
          <Trash2 size={14} aria-hidden /> Remove
        </button>
        <button className="btn btn--ghost btn--sm" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn--primary btn--sm" onClick={() => onCommit(value)}>
          Save
        </button>
      </div>
    </div>
  );
}

const Block = memo(function Block({ index, text, editable, editing, aiEnabled, override, onEdit, onAsk, onAdd, onCommit, onCancel, onDelete }) {
  if (editing) {
    return <BlockEditor initial={text} onCommit={(v) => onCommit(index, v)} onCancel={() => onCancel(index)} onDelete={() => onDelete(index)} />;
  }
  const interactive = editable && override == null;
  return (
    <div
      className={`block ${override != null ? 'block--ai' : ''}`}
      tabIndex={interactive ? 0 : undefined}
      onDoubleClick={interactive ? () => onEdit(index) : undefined}
      onKeyDown={interactive ? (e) => e.key === 'Enter' && e.target === e.currentTarget && onEdit(index) : undefined}
    >
      {editable && override == null && (
        <div className="block__tools no-print" role="toolbar" aria-label="Paragraph tools">
          <button title="Edit paragraph (or double-click)" aria-label="Edit paragraph" onClick={() => onEdit(index)}>
            <Pencil size={14} />
          </button>
          {aiEnabled && (
            <button title="Improve with AI" aria-label="Improve with AI" className="is-ai" onClick={() => onAsk(index, text)}>
              <Sparkles size={14} />
            </button>
          )}
          <button title="Add paragraph below" aria-label="Add paragraph below" onClick={() => onAdd(index)}>
            <Plus size={14} />
          </button>
        </div>
      )}
      <Markdown>{override ?? text}</Markdown>
    </div>
  );
});

// blockOverride: { index, text } renders streamed AI text in place of one block.
export default function Paper({ content, streaming = false, editable = false, aiEnabled = false, blockOverride, onChange, onAsk, renderAfter }) {
  const blocks = splitBlocks(content);
  const [editing, setEditing] = useState(null);

  const commit = (index, value) => {
    const base = editing?.pending ?? blocks;
    setEditing(null);
    const next = [...base];
    const trimmed = value.trim();
    if (trimmed) next[index] = trimmed;
    else next.splice(index, 1);
    if (next.join('\n\n') !== blocks.join('\n\n')) onChange(next.length ? joinBlocks(next) : '');
  };
  const remove = (index) => {
    const base = editing?.pending ?? blocks;
    setEditing(null);
    const next = base.filter((_, i) => i !== index);
    if (next.join('\n\n') !== blocks.join('\n\n')) onChange(next.length ? joinBlocks(next) : '');
  };
  const add = (index) => {
    const next = [...blocks];
    next.splice(index + 1, 0, '');
    // An empty block is only kept in local state: it is removed again if left empty.
    setEditing({ index: index + 1, pending: next });
  };

  const view = editing?.pending ?? blocks;

  return (
    <article className="paper" aria-busy={streaming}>
      <div className="paper__inner">
        {view.map((text, i) => (
          <div key={i} className="block-wrap">
            <Block
              index={i}
              text={text}
              editable={editable && !streaming}
              editing={editing?.index === i}
              aiEnabled={aiEnabled}
              override={blockOverride?.index === i ? blockOverride.text : undefined}
              onEdit={(idx) => setEditing({ index: idx })}
              onAsk={onAsk}
              onAdd={add}
              onCommit={(idx, v) => commit(idx, v)}
              onCancel={() => setEditing(null)}
              onDelete={remove}
            />
            {renderAfter?.(i)}
          </div>
        ))}
        {streaming && <span className="caret" aria-hidden />}
      </div>
    </article>
  );
}

export function PaperSkeleton({ label }) {
  return (
    <article className="paper paper--skeleton" aria-busy="true">
      <div className="paper__inner">
        <div className="skel skel--title" />
        <div className="skel" style={{ width: '92%' }} />
        <div className="skel" style={{ width: '97%' }} />
        <div className="skel" style={{ width: '60%' }} />
        <div className="skel skel--h" />
        <div className="skel" style={{ width: '95%' }} />
        <div className="skel" style={{ width: '88%' }} />
        <div className="skel" style={{ width: '94%' }} />
        <div className="skel" style={{ width: '40%' }} />
        <p className="paper-skeleton__label">{label}</p>
      </div>
    </article>
  );
}
