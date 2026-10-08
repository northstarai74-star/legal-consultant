import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import TemplateCard from '../components/TemplateCard.jsx';
import { EmptyState } from '../components/ui.jsx';
import { CATEGORIES, TEMPLATES } from '../../../shared/templates/index.js';

export default function Templates() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter((t) => (category === 'All' || t.category === category) && (!q || `${t.name} ${t.blurb} ${t.category} ${(t.keywords || []).join(' ')}`.toLowerCase().includes(q)));
  }, [query, category]);

  const available = new Set(TEMPLATES.map((t) => t.category));

  return (
    <div className="page page--wide">
      <header className="page__head">
        <div>
          <h1>New document</h1>
          <p>Pick a document type. We’ll ask a few questions, then AI drafts the full document for you.</p>
        </div>
      </header>

      <div className="toolbar">
        <label className="search">
          <Search size={16} aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates (e.g. rent, NDA, employee)…" aria-label="Search templates" />
        </label>
        <div className="chips">
          {CATEGORIES.filter((c) => c === 'All' || available.has(c)).map((c) => (
            <button key={c} className={`chip ${category === c ? 'is-on' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {items.length ? (
        <div className="grid grid--cards">
          {items.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Search} title="No templates match">
          Try a different word, or use “Custom Document” and describe what you need.
        </EmptyState>
      )}
    </div>
  );
}
