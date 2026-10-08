import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Square, History, RotateCcw, ScanSearch, Plug, Wand2 } from 'lucide-react';
import { Markdown } from './Paper.jsx';
import { Spinner } from './ui.jsx';
import { timeAgo, wordCount } from '../lib/storage.js';

export const QUICK_ACTIONS = [
  { label: 'Simplify language', prompt: 'Rewrite the document in plainer, simpler English while keeping the legal meaning exactly the same.' },
  { label: 'Make more formal', prompt: 'Make the wording more formal and precise, in the style of a senior commercial lawyer.' },
  { label: 'Make it balanced', prompt: 'Revise any one-sided terms so obligations and protections are balanced between the parties.' },
  { label: 'Protect the first party', prompt: 'Revise the terms to be more protective of the first-named party while remaining commercially reasonable.' },
  { label: 'Add missing clauses', prompt: 'Add any standard clauses a careful practitioner would expect for this type of document that are currently missing.' },
  { label: 'Shorten', prompt: 'Shorten the document by removing redundancy and tightening wording without dropping any substantive protection.' },
  { label: 'Fix consistency', prompt: 'Fix grammar, defined-term usage, clause numbering and cross-references so the whole document is consistent.' },
];

export const BLOCK_ACTIONS = [
  { label: 'Simplify', prompt: 'Rewrite this passage in plainer English, keeping the legal meaning identical.' },
  { label: 'More formal', prompt: 'Make this passage more formal and precise.' },
  { label: 'More protective', prompt: 'Make this passage more protective of the first-named party, while staying reasonable.' },
  { label: 'Make mutual', prompt: 'Make this obligation apply equally to both parties.' },
  { label: 'Shorten', prompt: 'Shorten this passage without losing any substantive protection.' },
];

function ConnectCallout() {
  return (
    <div className="callout">
      <Plug size={18} aria-hidden />
      <div>
        <strong>Turn on AI to use this</strong>
        <p>Start Ollama to use a model on this computer, or add a Claude API key in Settings, to refine, rewrite and review documents with AI.</p>
        <Link to="/settings" className="btn btn--primary btn--sm">
          Set up AI
        </Link>
      </div>
    </div>
  );
}

export function AssistantPanel({ live, busy, running, onRun, onStop, log }) {
  const [text, setText] = useState('');
  const submit = () => {
    if (!text.trim() || busy) return;
    onRun(text.trim());
    setText('');
  };

  return (
    <div className="panel-section">
      {!live && <ConnectCallout />}
      <label className="panel-label" htmlFor="assistant-input">
        Tell the AI what to change in the whole document
      </label>
      <textarea
        id="assistant-input"
        className="textarea"
        rows={4}
        value={text}
        disabled={!live || busy}
        placeholder="e.g. Add a 30-day cure period to the termination clause"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="panel-actions">
        {running ? (
          <button className="btn btn--ghost btn--sm" onClick={onStop}>
            <Square size={13} aria-hidden /> Stop
          </button>
        ) : (
          <button className="btn btn--primary btn--sm" onClick={submit} disabled={!live || busy || !text.trim()}>
            <Wand2 size={15} aria-hidden /> Apply changes
          </button>
        )}
        <span className="panel-hint">Ctrl+Enter</span>
      </div>

      <div className="panel-label">Quick actions</div>
      <div className="chips">
        {QUICK_ACTIONS.map((a) => (
          <button key={a.label} className="chip" disabled={!live || busy} onClick={() => setText(a.prompt)}>
            {a.label}
          </button>
        ))}
      </div>

      <p className="panel-tip">
        <Sparkles size={13} aria-hidden /> Tip: hover any paragraph in the document and click the sparkle to improve just that clause.
      </p>

      {log?.length > 0 && (
        <>
          <div className="panel-label">Recent AI edits</div>
          <ul className="log">
            {log.slice(0, 6).map((entry, i) => (
              <li key={i}>
                <span>{entry.instruction}</span>
                <small>{timeAgo(entry.at)}</small>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function ReviewPanel({ live, review, job, onRun, onStop }) {
  const running = job?.status === 'running';
  const text = running ? job.text : review?.text;
  return (
    <div className="panel-section">
      <p className="panel-intro">
        {live
          ? 'Get an AI review of risks, missing clauses and unfilled placeholders before you sign or send.'
          : 'Run a quick checklist of clauses and placeholders. Turn on AI for a full risk review.'}
      </p>
      <div className="panel-actions">
        {running ? (
          <button className="btn btn--ghost btn--sm" onClick={onStop}>
            <Square size={13} aria-hidden /> Stop
          </button>
        ) : (
          <button className="btn btn--primary btn--sm" onClick={onRun}>
            <ScanSearch size={15} aria-hidden /> {review ? 'Run review again' : live ? 'Review this document' : 'Run checklist'}
          </button>
        )}
        {running && (
          <span className="panel-hint">
            <Spinner size={13} /> Reviewing…
          </span>
        )}
        {!running && review && <span className="panel-hint">{timeAgo(review.at)}{review.demo ? ' · checklist' : ''}</span>}
      </div>
      {job?.status === 'error' && <div className="inline-error">{job.error.message}</div>}
      {text ? (
        <div className="prose">
          <Markdown>{text}</Markdown>
        </div>
      ) : (
        !running && <div className="panel-empty">No review yet.</div>
      )}
    </div>
  );
}

export function HistoryPanel({ doc, onRestore }) {
  const versions = doc.versions ?? [];
  return (
    <div className="panel-section">
      <p className="panel-intro">A snapshot is saved before every AI edit and regeneration, so you can always go back.</p>
      {versions.length === 0 ? (
        <div className="panel-empty">
          <History size={18} aria-hidden /> No earlier versions yet.
        </div>
      ) : (
        <ul className="versions">
          {versions.map((v) => (
            <li key={v.id}>
              <div>
                <strong>{v.label}</strong>
                <small>
                  {timeAgo(v.at)} · {wordCount(v.content).toLocaleString()} words
                </small>
              </div>
              <button className="btn btn--ghost btn--sm" onClick={() => onRestore(v)}>
                <RotateCcw size={13} aria-hidden /> Restore
              </button>
            </li>
          ))}
        </ul>
      )}
      <dl className="meta">
        <div>
          <dt>Created</dt>
          <dd>{new Date(doc.createdAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Drafted with</dt>
          <dd>{doc.demo ? 'Demo drafter' : doc.model?.startsWith('ollama:') ? `${doc.model.slice(7)} (local)` : doc.model}</dd>
        </div>
        <div>
          <dt>Stored</dt>
          <dd>In this browser only</dd>
        </div>
      </dl>
    </div>
  );
}
