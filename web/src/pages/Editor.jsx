import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Copy, FileQuestion, Info, MoreHorizontal, RotateCcw, Sparkles, Square, Trash2, Wand2, X } from 'lucide-react';
import Paper, { PaperSkeleton, joinBlocks, splitBlocks } from '../components/Paper.jsx';
import ModelPicker from '../components/ModelPicker.jsx';
import ExportMenu from '../components/ExportMenu.jsx';
import { AssistantPanel, BLOCK_ACTIONS, HistoryPanel, ReviewPanel } from '../components/EditorPanels.jsx';
import { ConfirmDialog, Disclaimer, Dropdown, EmptyState, Spinner } from '../components/ui.jsx';
import { useDocs } from '../context/DocsContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getJob, startJob, useJob } from '../lib/jobs.js';
import { wordCount } from '../lib/storage.js';
import { readMinutes } from '../lib/docs.js';
import { getTemplate } from '../../../shared/templates/index.js';

const short = (s, n = 44) => (s.length > n ? `${s.slice(0, n).trim()}…` : s);

function BlockAskCard({ running, error, onRun, onStop, onClose }) {
  const [text, setText] = useState('');
  return (
    <div className="ask-card no-print">
      <div className="ask-card__head">
        <span>
          <Sparkles size={14} aria-hidden /> Improve this paragraph with AI
        </span>
        <button className="icon-btn icon-btn--sm" aria-label="Close" onClick={onClose}>
          <X size={14} />
        </button>
      </div>
      <div className="chips">
        {BLOCK_ACTIONS.map((a) => (
          <button key={a.label} className="chip" disabled={running} onClick={() => onRun(a.prompt)}>
            {a.label}
          </button>
        ))}
      </div>
      <form
        className="ask-card__form"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim() && !running) onRun(text.trim());
        }}
      >
        <input className="input" value={text} disabled={running} placeholder="Or describe the change you want…" onChange={(e) => setText(e.target.value)} autoFocus />
        {running ? (
          <button type="button" className="btn btn--ghost btn--sm" onClick={onStop}>
            <Square size={13} aria-hidden /> Stop
          </button>
        ) : (
          <button type="submit" className="btn btn--primary btn--sm" disabled={!text.trim()}>
            <Wand2 size={14} aria-hidden /> Rewrite
          </button>
        )}
      </form>
      {error && <div className="inline-error">{error}</div>}
    </div>
  );
}

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { getDoc, updateDoc, addVersion, deleteDoc, duplicateDoc } = useDocs();
  const { live, model, apiKey, models, preferredModel } = useSettings();

  const doc = getDoc(id);
  const docJob = useJob(`${id}:doc`);
  const blockJob = useJob(`${id}:block`);
  const reviewJob = useJob(`${id}:review`);

  const [tab, setTab] = useState('assistant');
  const [ask, setAsk] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const docRef = useRef(doc);
  docRef.current = doc;
  const cfg = useRef({});
  cfg.current = { model, apiKey };
  const askRef = useRef(null);
  askRef.current = ask;

  const canvasRef = useRef(null);
  const stick = useRef(true);

  const genRunning = docJob?.status === 'running' && docJob.task === 'generate';
  const refineRunning = docJob?.status === 'running' && docJob.task === 'refine';
  const blockRunning = blockJob?.status === 'running';
  const busy = genRunning || refineRunning || blockRunning;

  // ---------------------------------------------------------------- AI actions

  const runGenerate = useCallback(
    (regenerate = false) => {
      const d = docRef.current;
      if (!d?.generation) return;
      if (regenerate && d.content) addVersion(id, 'Before regenerating');
      const { model: m, apiKey: key } = cfg.current;
      updateDoc(id, { status: 'generating', interrupted: false, partial: false, error: null });
      startJob({
        key: `${id}:doc`,
        task: 'generate',
        body: { templateId: d.templateId, answers: d.generation.answers, instructions: d.generation.instructions, model: m },
        apiKey: key,
        onDone: (job) => {
          const text = job.text.trim();
          if (job.status === 'stopped') {
            updateDoc(id, text ? { content: `${text}\n`, status: 'draft', partial: true } : { status: 'draft', interrupted: true });
            return;
          }
          updateDoc(id, { content: `${text}\n`, status: 'draft', partial: Boolean(job.result?.truncated), model: job.meta?.model ?? m, demo: Boolean(job.meta?.demo) });
          addVersion(id, regenerate ? 'Regenerated draft' : 'First draft', `${text}\n`);
        },
        onError: (job) => updateDoc(id, { status: 'draft', error: job.error.message, ...(job.text ? { content: job.text, partial: true } : {}) }),
      });
    },
    [id, addVersion, updateDoc],
  );

  useEffect(() => {
    if (doc && location.state?.autostart && !getJob(`${id}:doc`)) {
      navigate(location.pathname, { replace: true, state: null });
      runGenerate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id]);

  const logEdit = (instruction) => (d) => ({ log: [{ at: new Date().toISOString(), instruction }, ...(d.log ?? [])].slice(0, 30) });

  const runRefine = (instruction) => {
    const before = docRef.current.content;
    startJob({
      key: `${id}:doc`,
      task: 'refine',
      body: { document: before, instruction, model: cfg.current.model },
      apiKey: cfg.current.apiKey,
      onDone: (job) => {
        if (job.status === 'stopped') return;
        const text = job.text.trim();
        if (!text) return;
        if (job.result?.truncated) {
          toast('The revised document was too long to finish, so it was not applied. Try a smaller change.', { kind: 'error', duration: 8000 });
          return;
        }
        addVersion(id, `Before: ${short(instruction)}`, before);
        updateDoc(id, (d) => ({ content: `${text}\n`, ...logEdit(instruction)(d) }));
        toast('Document updated', { kind: 'success', action: { label: 'Undo', onClick: () => updateDoc(id, { content: before }) } });
      },
      onError: (job) => toast(job.error.message, { kind: 'error', duration: 8000 }),
    });
  };

  const runBlock = (instruction) => {
    const target = askRef.current;
    if (!target) return;
    const before = docRef.current.content;
    startJob({
      key: `${id}:block`,
      task: 'refine',
      body: { document: before, selection: target.text, instruction, model: cfg.current.model },
      apiKey: cfg.current.apiKey,
      onDone: (job) => {
        if (job.status === 'stopped') return;
        const replacement = job.text.trim();
        if (!replacement || job.result?.truncated) return;
        const blocks = splitBlocks(docRef.current.content);
        if (blocks[target.index] !== target.text) {
          toast('The paragraph changed while the AI was working, so the rewrite was not applied.', { kind: 'error' });
          return;
        }
        blocks[target.index] = replacement;
        addVersion(id, `Before: ${short(instruction)}`, before);
        updateDoc(id, (d) => ({ content: joinBlocks(blocks), ...logEdit(instruction)(d) }));
        setAsk(null);
        toast('Paragraph rewritten', { kind: 'success', action: { label: 'Undo', onClick: () => updateDoc(id, { content: before }) } });
      },
    });
  };

  const runReview = () =>
    startJob({
      key: `${id}:review`,
      task: 'review',
      body: { document: docRef.current.content, model: cfg.current.model },
      apiKey: cfg.current.apiKey,
      onDone: (job) => {
        if (job.status === 'stopped') return;
        updateDoc(id, { review: { at: new Date().toISOString(), text: job.text.trim(), demo: Boolean(job.meta?.demo) } });
      },
    });

  const restore = (version) => {
    const current = docRef.current.content;
    if (current && current !== version.content) addVersion(id, 'Before restore', current);
    updateDoc(id, { content: version.content, partial: false });
    toast('Version restored', { kind: 'success' });
  };

  // ---------------------------------------------------------------- derived view state

  const shownContent = genRunning || (refineRunning && docJob.text) ? docJob.text : doc?.content ?? '';

  useEffect(() => {
    if (genRunning && stick.current && canvasRef.current) {
      canvasRef.current.scrollTop = canvasRef.current.scrollHeight;
    }
  }, [docJob?.text, genRunning]);

  // When a draft finishes streaming, return to the top so it can be read from the start.
  const wasGenerating = useRef(false);
  useEffect(() => {
    if (wasGenerating.current && !genRunning) canvasRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    wasGenerating.current = genRunning;
  }, [genRunning]);

  if (!doc) {
    return (
      <div className="page">
        <EmptyState
          icon={FileQuestion}
          title="Document not found"
          action={
            <Link to="/documents" className="btn btn--primary">
              Back to my documents
            </Link>
          }
        >
          It may have been deleted, or it was created in a different browser.
        </EmptyState>
      </div>
    );
  }

  const template = getTemplate(doc.templateId);
  const modelLabel = models.find((m) => m.id === (genRunning ? docJob.meta?.model ?? preferredModel : preferredModel))?.label;
  const words = wordCount(shownContent);
  const hasContent = Boolean(shownContent.trim());

  const askCard = (index) =>
    ask?.index === index ? (
      <BlockAskCard
        running={blockRunning}
        error={blockJob?.status === 'error' ? blockJob.error.message : null}
        onRun={runBlock}
        onStop={() => blockJob?.stop()}
        onClose={() => setAsk(null)}
      />
    ) : null;

  let banner = null;
  if (genRunning) {
    banner = (
      <div className="banner banner--info banner--sticky">
        <Spinner size={16} />
        <span>
          {docJob.text ? 'Drafting' : docJob.meta?.demo ? 'Preparing your draft' : `${modelLabel ?? 'The AI'} is working on your document`}
          … you can leave this page and it will keep going.
        </span>
        <button className="btn btn--ghost btn--sm" onClick={() => docJob.stop()}>
          <Square size={13} aria-hidden /> Stop
        </button>
      </div>
    );
  } else if (refineRunning) {
    banner = (
      <div className="banner banner--info banner--sticky">
        <Spinner size={16} />
        <span>The AI is revising the whole document. Your current version is saved in History.</span>
        <button className="btn btn--ghost btn--sm" onClick={() => docJob.stop()}>
          <Square size={13} aria-hidden /> Stop
        </button>
      </div>
    );
  } else if (doc.error) {
    banner = (
      <div className="banner banner--error">
        <AlertTriangle size={16} aria-hidden />
        <span>{doc.error}</span>
        {doc.generation && (
          <button className="btn btn--ghost btn--sm" onClick={() => runGenerate(Boolean(doc.content))}>
            <RotateCcw size={13} aria-hidden /> Try again
          </button>
        )}
      </div>
    );
  } else if (doc.interrupted || doc.partial) {
    banner = (
      <div className="banner banner--warn">
        <AlertTriangle size={16} aria-hidden />
        <span>{doc.interrupted && !doc.content ? 'Drafting was interrupted before any text was produced.' : 'This draft may be incomplete because generation stopped early.'}</span>
        {doc.generation && (
          <button className="btn btn--ghost btn--sm" onClick={() => runGenerate(Boolean(doc.content))}>
            <RotateCcw size={13} aria-hidden /> Regenerate
          </button>
        )}
      </div>
    );
  } else if (doc.demo && hasContent) {
    banner = (
      <div className="banner banner--info">
        <Info size={16} aria-hidden />
        {live ? (
          <>
            <span>This draft came from the offline demo drafter. Regenerate it with {modelLabel ?? 'AI'} for a fully tailored AI draft.</span>
            {doc.generation && (
              <button className="btn btn--ghost btn--sm" onClick={() => runGenerate(true)}>
                <RotateCcw size={13} aria-hidden /> Regenerate with AI
              </button>
            )}
          </>
        ) : (
          <>
            <span>This draft came from the offline demo drafter. Start Ollama or connect Claude in Settings to draft, edit and review with AI.</span>
            <Link to="/settings" className="btn btn--ghost btn--sm">
              Set up AI
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="editor">
      <div className="editor-bar no-print">
        <Link to="/documents" className="icon-btn" aria-label="Back to my documents" title="My documents">
          <ArrowLeft size={18} />
        </Link>
        <div className="editor-bar__title">
          <input
            className="title-input"
            value={doc.title}
            aria-label="Document title"
            onChange={(e) => updateDoc(id, { title: e.target.value })}
            placeholder="Untitled document"
          />
          <div className="editor-bar__meta">
            <span>{template?.name ?? 'Document'}</span>
            <span aria-hidden>·</span>
            <span>
              {words.toLocaleString()} words{hasContent ? ` · ${readMinutes(shownContent)} min read` : ''}
            </span>
            <span aria-hidden>·</span>
            <span>Saved in this browser</span>
          </div>
        </div>
        <div className="editor-bar__actions">
          <div className="segmented" role="group" aria-label="Document status">
            {['draft', 'final'].map((s) => (
              <button
                key={s}
                className={doc.status === s || (s === 'draft' && doc.status === 'generating') ? 'is-on' : ''}
                onClick={() => !busy && updateDoc(id, { status: s })}
              >
                {s === 'draft' ? 'Draft' : 'Final'}
              </button>
            ))}
          </div>
          <ModelPicker align="right" compact />
          <ExportMenu title={doc.title} content={doc.content} disabled={!doc.content || busy} />
          <Dropdown
            align="right"
            width={200}
            trigger={({ toggle }) => (
              <button className="icon-btn" aria-label="More actions" aria-haspopup="menu" onClick={toggle}>
                <MoreHorizontal size={18} />
              </button>
            )}
          >
            {(close) => (
              <>
                {doc.generation && (
                  <button
                    className="menu-item"
                    role="menuitem"
                    disabled={busy}
                    onClick={() => {
                      close();
                      runGenerate(Boolean(doc.content));
                    }}
                  >
                    <RotateCcw size={16} aria-hidden />
                    <span>
                      <strong>Regenerate</strong>
                    </span>
                  </button>
                )}
                <button
                  className="menu-item"
                  role="menuitem"
                  onClick={() => {
                    close();
                    const copy = duplicateDoc(id);
                    if (copy) {
                      toast('Duplicated', { kind: 'success' });
                      navigate(`/doc/${copy.id}`);
                    }
                  }}
                >
                  <Copy size={16} aria-hidden />
                  <span>
                    <strong>Duplicate</strong>
                  </span>
                </button>
                <button
                  className="menu-item menu-item--danger"
                  role="menuitem"
                  onClick={() => {
                    close();
                    setConfirmDelete(true);
                  }}
                >
                  <Trash2 size={16} aria-hidden />
                  <span>
                    <strong>Delete</strong>
                  </span>
                </button>
              </>
            )}
          </Dropdown>
        </div>
      </div>

      <div className="editor-body">
        <section
          className="canvas"
          ref={canvasRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
          }}
        >
          <div className="canvas__inner">
            {banner}
            {genRunning && !docJob.text ? (
              <PaperSkeleton label={docJob.meta?.demo ? 'Preparing your draft…' : 'Reading your details and planning the clauses…'} />
            ) : hasContent ? (
              <>
                {!busy && <p className="paper-hint no-print">Double-click or tap a paragraph to edit it, and hover or tap for AI tools. Highlighted [brackets] are details left for you to fill in.</p>}
                <Paper
                  content={shownContent}
                  streaming={genRunning || (refineRunning && Boolean(docJob.text))}
                  editable={!busy}
                  aiEnabled={live}
                  blockOverride={blockRunning && ask ? { index: ask.index, text: blockJob.text || '…' } : undefined}
                  onChange={(content) => updateDoc(id, { content, partial: false })}
                  onAsk={(index, text) => setAsk({ index, text })}
                  renderAfter={askCard}
                />
              </>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="This document is empty"
                action={
                  doc.generation ? (
                    <button className="btn btn--primary" onClick={() => runGenerate(false)}>
                      Draft it now
                    </button>
                  ) : null
                }
              >
                There is no text yet.
              </EmptyState>
            )}
            <Disclaimer />
          </div>
        </section>

        <aside className="side no-print" aria-label="AI tools">
          <div className="tabs" role="tablist">
            {[
              ['assistant', 'Assistant'],
              ['review', 'Review'],
              ['history', 'History'],
            ].map(([key, label]) => (
              <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'is-on' : ''} onClick={() => setTab(key)}>
                {label}
                {key === 'history' && (doc.versions?.length ?? 0) > 0 && <span className="tabs__count">{doc.versions.length}</span>}
              </button>
            ))}
          </div>
          <div className="side__scroll">
            {tab === 'assistant' && (
              <AssistantPanel live={live} busy={busy || !hasContent} running={refineRunning} onRun={runRefine} onStop={() => docJob?.stop()} log={doc.log} />
            )}
            {tab === 'review' && (
              <ReviewPanel live={live} review={doc.review} job={reviewJob} onRun={runReview} onStop={() => reviewJob?.stop()} />
            )}
            {tab === 'history' && <HistoryPanel doc={doc} onRestore={restore} />}
          </div>
        </aside>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this document?"
          message={`“${doc.title}” and its version history will be permanently removed from this browser.`}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteDoc(id);
            toast('Document deleted', { kind: 'success' });
            navigate('/documents');
          }}
        />
      )}
    </div>
  );
}
