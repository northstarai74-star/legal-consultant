import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, FilePlus2, FolderOpen, MoreVertical, Search, Trash2, ExternalLink } from 'lucide-react';
import { ConfirmDialog, Dropdown, EmptyState, StatusPill } from '../components/ui.jsx';
import { TemplateIcon } from '../components/icons.jsx';
import { useDocs } from '../context/DocsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getTemplate, TEMPLATES } from '../../../shared/templates/index.js';
import { snippet } from '../lib/docs.js';
import { timeAgo, wordCount } from '../lib/storage.js';

export default function Library() {
  const { docs, deleteDoc, duplicateDoc } = useDocs();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('updated');
  const [toDelete, setToDelete] = useState(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs
      .filter((d) => (status === 'all' || (status === 'final' ? d.status === 'final' : d.status !== 'final')) && (type === 'all' || d.templateId === type) && (!q || `${d.title} ${d.content}`.toLowerCase().includes(q)))
      .sort((a, b) => (sort === 'title' ? a.title.localeCompare(b.title) : b.updatedAt.localeCompare(a.updatedAt)));
  }, [docs, query, status, type, sort]);

  const usedTypes = TEMPLATES.filter((t) => docs.some((d) => d.templateId === t.id));

  return (
    <div className="page page--wide">
      <header className="page__head">
        <div>
          <h1>My documents</h1>
          <p>{docs.length ? `${docs.length} document${docs.length === 1 ? '' : 's'} saved in this browser.` : 'Everything you draft shows up here.'}</p>
        </div>
        <Link to="/new" className="btn btn--primary">
          <FilePlus2 size={16} aria-hidden /> New document
        </Link>
      </header>

      {docs.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Nothing here yet"
          action={
            <Link to="/new" className="btn btn--primary">
              Draft your first document
            </Link>
          }
        >
          Start from a template or describe what you need in plain language.
        </EmptyState>
      ) : (
        <>
          <div className="toolbar">
            <label className="search">
              <Search size={16} aria-hidden />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles and contents…" aria-label="Search documents" />
            </label>
            <div className="toolbar__filters">
              <div className="segmented" role="group" aria-label="Filter by status">
                {[
                  ['all', 'All'],
                  ['draft', 'Drafts'],
                  ['final', 'Final'],
                ].map(([k, label]) => (
                  <button key={k} className={status === k ? 'is-on' : ''} onClick={() => setStatus(k)}>
                    {label}
                  </button>
                ))}
              </div>
              <select className="select" value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type">
                <option value="all">All types</option>
                {usedTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
                <option value="updated">Recently edited</option>
                <option value="title">Title A–Z</option>
              </select>
            </div>
          </div>

          {items.length === 0 ? (
            <EmptyState icon={Search} title="No documents match your filters" />
          ) : (
            <div className="grid grid--docs">
              {items.map((d) => {
                const t = getTemplate(d.templateId);
                return (
                  <article key={d.id} className="dcard">
                    <Link to={`/doc/${d.id}`} className="dcard__link" aria-label={`Open ${d.title}`} />
                    <div className="dcard__top">
                      <span className="tcard__icon">
                        <TemplateIcon name={t?.icon} size={20} />
                      </span>
                      <StatusPill status={d.status} />
                      <Dropdown
                        align="right"
                        width={190}
                        trigger={({ toggle }) => (
                          <button className="icon-btn icon-btn--sm dcard__menu" aria-label={`Actions for ${d.title}`} aria-haspopup="menu" onClick={toggle}>
                            <MoreVertical size={16} />
                          </button>
                        )}
                      >
                        {(close) => (
                          <>
                            <button className="menu-item" role="menuitem" onClick={() => navigate(`/doc/${d.id}`)}>
                              <ExternalLink size={16} aria-hidden />
                              <span>
                                <strong>Open</strong>
                              </span>
                            </button>
                            <button
                              className="menu-item"
                              role="menuitem"
                              onClick={() => {
                                close();
                                duplicateDoc(d.id);
                                toast('Duplicated', { kind: 'success' });
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
                                setToDelete(d);
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
                    <h3>{d.title}</h3>
                    <p className="dcard__snippet">{snippet(d.content) || 'No content yet.'}</p>
                    <div className="dcard__foot">
                      <span>{t?.name ?? 'Document'}</span>
                      <span>
                        {wordCount(d.content || '').toLocaleString()} words · {timeAgo(d.updatedAt)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete this document?"
          message={`“${toDelete.title}” and its version history will be permanently removed from this browser.`}
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            deleteDoc(toDelete.id);
            setToDelete(null);
            toast('Document deleted', { kind: 'success' });
          }}
        />
      )}
    </div>
  );
}
