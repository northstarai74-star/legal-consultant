import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Clock, FileQuestion, Sparkles, Lightbulb } from 'lucide-react';
import FormField, { JurisdictionList } from '../components/FormField.jsx';
import ModelPicker from '../components/ModelPicker.jsx';
import { TemplateIcon } from '../components/icons.jsx';
import { Disclaimer, EmptyState } from '../components/ui.jsx';
import { useDocs } from '../context/DocsContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { clauseTitles, defaultAnswers, getTemplate } from '../../../shared/templates/index.js';
import { makeTitle } from '../lib/docs.js';

function DraftForm({ template, brief }) {
  const navigate = useNavigate();
  const { createDoc } = useDocs();
  const { profile, live, model, currentModel } = useSettings();

  const [answers, setAnswers] = useState(() => {
    const base = defaultAnswers(template, profile);
    if (brief && template.id === 'custom') base.description = brief;
    return base;
  });
  const [instructions, setInstructions] = useState(brief && template.id !== 'custom' ? brief : '');
  const [errors, setErrors] = useState({});

  const groups = useMemo(() => {
    const map = new Map();
    for (const f of template.fields) {
      const g = f.group ?? 'Details';
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(f);
    }
    return [...map.entries()];
  }, [template]);

  const titles = useMemo(() => clauseTitles(template), [template]);

  const setValue = (key, value) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    const found = {};
    for (const f of template.fields) {
      if (f.required && !String(answers[f.key] ?? '').trim()) found[f.key] = 'This detail is required.';
    }
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      const el = document.getElementById(`f-${first}`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el?.focus({ preventScroll: true });
      return;
    }
    const doc = createDoc({
      title: makeTitle(template, answers),
      templateId: template.id,
      content: '',
      status: 'generating',
      model,
      demo: model === 'demo',
      generation: { answers, instructions: instructions.trim() },
    });
    navigate(`/doc/${doc.id}`, { state: { autostart: true } });
  };

  return (
    <div className="page page--wide">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/new">
          <ArrowLeft size={14} aria-hidden /> All templates
        </Link>
      </nav>

      <div className="form-layout">
        <form id="draft-form" className="card form-main" onSubmit={submit} noValidate>
          <header className="form-main__head">
            <span className="tcard__icon tcard__icon--lg">
              <TemplateIcon name={template.icon} size={26} />
            </span>
            <div>
              <h1>{template.name}</h1>
              <p>{template.blurb}</p>
            </div>
          </header>

          <JurisdictionList />

          {groups.map(([group, fields]) => (
            <fieldset key={group} className="form-group">
              <legend>{group}</legend>
              <div className="form-grid">
                {fields.map((f) => (
                  <FormField key={f.key} field={f} value={answers[f.key] ?? ''} onChange={setValue} error={errors[f.key]} />
                ))}
              </div>
            </fieldset>
          ))}

          <fieldset className="form-group">
            <legend>
              <Sparkles size={14} aria-hidden /> Anything else?
            </legend>
            <div className="field field--wide">
              <label htmlFor="f-instructions">Extra instructions for the AI (optional)</label>
              <textarea
                id="f-instructions"
                rows={3}
                value={instructions}
                disabled={!live}
                placeholder={live ? 'e.g. Keep it short and friendly. Make termination mutual with 30 days’ notice. Add a clause about data protection.' : 'Turn on AI in Settings to give free-text instructions. The demo drafter uses the details above only.'}
                onChange={(e) => setInstructions(e.target.value)}
              />
              {!live && (
                <Link to="/settings" className="link">
                  AI is not set up yet. Start Ollama or add a Claude key to turn this on <ArrowRight size={14} aria-hidden />
                </Link>
              )}
              <small className="field__help">Missing details become [bracketed placeholders] you can fill in later. The AI never invents names, amounts or dates.</small>
            </div>
          </fieldset>
        </form>

        <aside className="form-aside">
          <div className="card aside-card">
            <h2>Ready to draft</h2>
            <div className="aside-row">
              <span className="aside-row__label">Drafted by</span>
              <ModelPicker compact />
            </div>
            <div className="aside-row">
              <span className="aside-row__label">Takes about</span>
              <span className="aside-row__value">
                <Clock size={14} aria-hidden /> {live ? (currentModel?.local ? '1–3 minutes' : '30–90 seconds') : '5 seconds'}
              </span>
            </div>
            <button className="btn btn--primary btn--lg btn--block" type="submit" form="draft-form">
              Draft document <ArrowRight size={17} aria-hidden />
            </button>
            <p className="aside-note">You can edit, refine with AI, review and export it right after.</p>
          </div>

          <div className="card aside-card">
            <h2>What’s included</h2>
            <ul className="checklist">
              {titles.map((t) => (
                <li key={t}>
                  <Check size={14} aria-hidden /> {t}
                </li>
              ))}
            </ul>
            {template.id !== 'custom' && (
              <p className="aside-note">
                <Lightbulb size={13} aria-hidden /> The AI adds any other clauses customary for your jurisdiction.
              </p>
            )}
          </div>
        </aside>
      </div>
      <Disclaimer />
    </div>
  );
}

export default function NewDocument() {
  const { templateId } = useParams();
  const location = useLocation();
  const template = getTemplate(templateId);

  if (!template) {
    return (
      <div className="page">
        <EmptyState
          icon={FileQuestion}
          title="Template not found"
          action={
            <Link to="/new" className="btn btn--primary">
              Browse templates
            </Link>
          }
        />
      </div>
    );
  }
  return <DraftForm key={template.id} template={template} brief={location.state?.brief} />;
}
