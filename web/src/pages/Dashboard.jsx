import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, FilePlus2, FileText, FolderOpen, PenLine, CheckCircle2, Type, Sparkles, Plug, Database, Mail, Phone, Check, Loader2 } from 'lucide-react';
import TemplateCard from '../components/TemplateCard.jsx';
import { StatusPill, EmptyState, Disclaimer } from '../components/ui.jsx';
import { TemplateIcon } from '../components/icons.jsx';
import { useDocs } from '../context/DocsContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { TEMPLATES, getTemplate, matchTemplate } from '../../../shared/templates/index.js';
import { timeAgo, wordCount } from '../lib/storage.js';

const EXAMPLES = [
  'A mutual NDA between my startup and a software vendor, 2-year term',
  'Employment agreement for a senior developer with 3-month probation',
  'Rental agreement for a furnished apartment, 11 months, deposit of 3 months’ rent',
  'Legal notice to a client for unpaid invoices',
  'Freelance design contract with 50% upfront payment',
];

function greeting(name) {
  const h = new Date().getHours();
  const part = h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return name ? `${part}, ${name.split(' ')[0]}` : part;
}

const automationBlueprint = [
  { key: 'airtable', label: 'Airtable trigger', icon: Database, detail: 'New lead detected in SAKSHI base', status: 'idle' },
  { key: 'router', label: 'Routing logic', icon: Check, detail: 'Customer matched to voice + email path', status: 'idle' },
  { key: 'vapi', label: 'Vapi call', icon: Phone, detail: 'Outbound call to +91 98765 43210', status: 'idle' },
  { key: 'gmail', label: 'Gmail follow-up', icon: Mail, detail: 'Legal email sent to john@clinic.com', status: 'idle' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { docs } = useDocs();
  const { live, profile, config, currentModel } = useSettings();
  const [brief, setBrief] = useState('');
  const [automationSteps, setAutomationSteps] = useState(automationBlueprint);
  const [automationRunning, setAutomationRunning] = useState(false);

  const start = (e) => {
    e?.preventDefault();
    const text = brief.trim();
    if (!text) return navigate('/new');
    navigate(`/new/${matchTemplate(text).id}`, { state: { brief: text } });
  };

  const runAutomation = async () => {
    setAutomationRunning(true);
    setAutomationSteps(automationBlueprint.map((step) => ({ ...step, status: 'pending' })));

    for (const [index, step] of automationBlueprint.entries()) {
      await new Promise((resolve) => setTimeout(resolve, 550));
      setAutomationSteps((current) => current.map((item, i) => (i === index ? { ...item, status: 'done' } : item)));
    }

    setAutomationRunning(false);
  };

  const drafts = docs.filter((d) => d.status !== 'final').length;
  const finals = docs.filter((d) => d.status === 'final').length;
  const words = docs.reduce((n, d) => n + wordCount(d.content || ''), 0);
  const recent = [...docs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  const popular = TEMPLATES.filter((t) => t.popular).slice(0, 6);

  return (
    <div className="page page--wide">
      <section className="hero">
        <div className="hero__glow" aria-hidden />
        <p className="eyebrow">
          <Sparkles size={14} aria-hidden /> {greeting(profile.name)}
        </p>
        <h1>What legal document do you need today?</h1>
        <p className="hero__sub">Describe it in plain language. We’ll pick the right template, ask only what matters, and draft it with AI in seconds.</p>

        <form className="brief" onSubmit={start}>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            aria-label="Describe the document you need"
            placeholder="e.g. A one-way NDA for a freelance designer, 2-year term, governed by Indian law"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) start(e);
            }}
          />
          <div className="brief__bar">
            <span className="brief__hint">
              {live ? `Drafted by ${currentModel?.label ?? 'AI'}${currentModel?.local ? ' · on this computer' : ''}` : 'Demo drafter · start Ollama or connect Claude for AI drafting'}
            </span>
            <button className="btn btn--primary" type="submit">
              Start drafting <ArrowRight size={16} aria-hidden />
            </button>
          </div>
        </form>

        <div className="chips chips--center">
          {EXAMPLES.map((ex) => (
            <button key={ex} className="chip" onClick={() => setBrief(ex)}>
              {ex}
            </button>
          ))}
        </div>
      </section>

      {!live && !config.loading && !config.error && (
        <Link to="/settings" className="banner banner--demo">
          <Plug size={18} aria-hidden />
          <span>
            <strong>You’re in demo mode.</strong> The demo drafter fills our built-in clause library. Start Ollama to draft, edit and review with a model on this computer, or connect a Claude API key.
          </span>
          <span className="banner__go">
            Set up AI <ArrowRight size={14} aria-hidden />
          </span>
        </Link>
      )}

      <section className="stats" aria-label="Your workspace">
        {[
          [FileText, 'Documents', docs.length],
          [PenLine, 'In draft', drafts],
          [CheckCircle2, 'Finalised', finals],
          [Type, 'Words drafted', words.toLocaleString()],
        ].map(([Icon, label, value]) => (
          <div key={label} className="stat">
            <span className="stat__icon">
              <Icon size={18} aria-hidden />
            </span>
            <span className="stat__value">{value}</span>
            <span className="stat__label">{label}</span>
          </div>
        ))}
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Popular templates</h2>
          <Link to="/new" className="link">
            View all {TEMPLATES.length} <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
        <div className="grid grid--cards">
          {popular.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Automation center</h2>
          <button className="btn btn--primary btn--sm" type="button" onClick={runAutomation} disabled={automationRunning}>
            {automationRunning ? <><Loader2 size={14} className="spin" aria-hidden /> Running</> : 'Run workflow'}
          </button>
        </div>

        <div className="automation-widget card">
          <div className="automation-widget__summary">
            <div>
              <p className="eyebrow eyebrow--compact">Internal workflow</p>
              <h3>Integration Airtable, Vapi, Gmail</h3>
            </div>
            <span className="pill pill--live">Live</span>
          </div>

          <div className="automation-widget__steps">
            {automationSteps.map(({ key, label, detail, icon: Icon, status }) => (
              <div key={key} className={`automation-step-item automation-step-item--${status}`}>
                <span className="automation-step-item__icon">
                  <Icon size={16} aria-hidden />
                </span>
                <div>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </div>
                <span className="automation-step-item__state">
                  {status === 'done' ? 'Done' : status === 'pending' ? 'Pending' : 'Ready'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Recent documents</h2>
          {docs.length > 0 && (
            <Link to="/documents" className="link">
              All documents <ArrowRight size={14} aria-hidden />
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No documents yet"
            action={
              <Link to="/new" className="btn btn--primary">
                <FilePlus2 size={16} aria-hidden /> Create your first document
              </Link>
            }
          >
            Everything you draft is saved here, in your browser.
          </EmptyState>
        ) : (
          <div className="list card">
            {recent.map((d) => {
              const t = getTemplate(d.templateId);
              return (
                <Link key={d.id} to={`/doc/${d.id}`} className="list__row">
                  <span className="list__icon">
                    <TemplateIcon name={t?.icon} size={18} />
                  </span>
                  <span className="list__main">
                    <strong>{d.title}</strong>
                    <small>
                      {t?.name ?? 'Document'} · {wordCount(d.content || '').toLocaleString()} words
                    </small>
                  </span>
                  <StatusPill status={d.status} />
                  <small className="list__time">{timeAgo(d.updatedAt)}</small>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <Disclaimer />
    </div>
  );
}
