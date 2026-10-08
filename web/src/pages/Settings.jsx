import { useRef, useState } from 'react';
import { CheckCircle2, Download, Eye, EyeOff, KeyRound, Phone, RefreshCw, Trash2, Upload, XCircle, Check } from 'lucide-react';
import { JurisdictionList, JURISDICTION_LIST_ID } from '../components/FormField.jsx';
import { ConfirmDialog, Spinner } from '../components/ui.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useDocs } from '../context/DocsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { testApiKey } from '../lib/api.js';
import { download } from '../lib/exportDoc.js';
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_HREF } from '../lib/support.js';

function Section({ title, description, children }) {
  return (
    <section className="card settings-card">
      <header>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </header>
      {children}
    </section>
  );
}

function LocalModels() {
  const { config, refreshConfig, currentModel } = useSettings();
  const [checking, setChecking] = useState(false);
  const { reachable, count } = config.ollama ?? { reachable: false, count: 0 };
  const ready = reachable && count > 0;

  const recheck = async () => {
    setChecking(true);
    await refreshConfig();
    setChecking(false);
  };

  let message = 'Ollama was not found on this computer. Open the Ollama app, then press Check again.';
  if (ready) {
    message = `Ollama is running with ${count} model${count === 1 ? '' : 's'} installed.${currentModel?.local ? ` Using ${currentModel.label}.` : ''}`;
  } else if (reachable) {
    message = 'Ollama is running but has no models yet.';
  }

  return (
    <Section title="Local AI (Ollama)" description="Run an AI model on this computer. It is free, works offline, and your documents never leave your machine.">
      <div className={`conn conn--${ready ? 'on' : 'off'}`}>
        {ready ? <CheckCircle2 size={18} aria-hidden /> : <XCircle size={18} aria-hidden />}
        <span>{message}</span>
      </div>
      <div className="settings-actions">
        <button className="btn btn--ghost btn--sm" onClick={recheck} disabled={checking}>
          {checking ? <Spinner size={14} /> : <RefreshCw size={14} aria-hidden />} Check again
        </button>
      </div>
      <details className="how">
        <summary>{ready ? 'Tips for local models' : 'How do I set it up?'}</summary>
        <p>
          {ready ? (
            <>Bigger models write better but run slower. If drafting feels slow or Ollama runs out of memory, pick a smaller model below. To add one, run <code>ollama pull mistral</code> in a terminal, then press Check again. Set <code>OLLAMA_MODEL</code> in <code>.env</code> to choose the default.</>
          ) : (
            <>Install Ollama from ollama.com and open it, then download a model by running <code>ollama pull gemma4</code> in a terminal. Come back here and press Check again.</>
          )}
        </p>
      </details>
    </Section>
  );
}

function AIConnection() {
  const { settings, update, config, cloudReady: live, apiKey } = useSettings();
  const { toast } = useToast();
  const [value, setValue] = useState(settings.apiKey);
  const [show, setShow] = useState(false);
  const [test, setTest] = useState(null); // { state: 'running' | 'ok' | 'error', message? }

  const dirty = value.trim() !== apiKey;

  const runTest = async () => {
    setTest({ state: 'running' });
    try {
      await testApiKey(value.trim());
      setTest({ state: 'ok' });
    } catch (err) {
      setTest({ state: 'error', message: err.message });
    }
  };

  return (
    <Section title="Claude connection (optional)" description="Add an Anthropic API key to also use Claude models in the cloud. You do not need one if you use a local model.">
      <div className={`conn conn--${live ? 'on' : 'off'}`}>
        {live ? <CheckCircle2 size={18} aria-hidden /> : <XCircle size={18} aria-hidden />}
        <span>
          {live
            ? apiKey
              ? 'Connected using the API key saved in this browser.'
              : 'Connected using the ANTHROPIC_API_KEY configured on the server.'
            : 'Not connected. Claude models are off.'}
        </span>
      </div>

      <div className="field field--wide">
        <label htmlFor="api-key">Claude API key</label>
        <div className="input-group">
          <KeyRound size={16} aria-hidden />
          <input
            id="api-key"
            type={show ? 'text' : 'password'}
            value={value}
            placeholder="sk-ant-…"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setValue(e.target.value);
              setTest(null);
            }}
          />
          <button type="button" className="icon-btn icon-btn--sm" aria-label={show ? 'Hide key' : 'Show key'} onClick={() => setShow((s) => !s)}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <small className="field__help">
          Your key stays in this browser’s storage and is sent only to this app’s server to make requests to Anthropic. It is never logged or saved on the server. Create a key in the Anthropic Console (console.anthropic.com).
        </small>
      </div>

      <div className="settings-actions">
        <button
          className="btn btn--primary btn--sm"
          disabled={!dirty}
          onClick={() => {
            update({ apiKey: value.trim() });
            setTest(null);
            toast(value.trim() ? 'API key saved' : 'API key removed', { kind: 'success' });
          }}
        >
          Save key
        </button>
        <button className="btn btn--ghost btn--sm" onClick={runTest} disabled={test?.state === 'running' || (!value.trim() && !config.serverKey)}>
          {test?.state === 'running' ? <Spinner size={14} /> : null} Test connection
        </button>
        {apiKey && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setValue('');
              update({ apiKey: '' });
              setTest(null);
              toast('API key removed', { kind: 'success' });
            }}
          >
            Remove key
          </button>
        )}
        {test?.state === 'ok' && (
          <span className="test test--ok">
            <CheckCircle2 size={15} aria-hidden /> Connection works
          </span>
        )}
        {test?.state === 'error' && (
          <span className="test test--err">
            <XCircle size={15} aria-hidden /> {test.message}
          </span>
        )}
      </div>

      <details className="how">
        <summary>Prefer to configure it on the server?</summary>
        <p>
          Put <code>ANTHROPIC_API_KEY=your-key</code> in the <code>.env</code> file next to <code>server.js</code> and restart the app. The server key can only be used from the machine running the app unless you set <code>ALLOW_REMOTE_AI=true</code>.
        </p>
      </details>
    </Section>
  );
}

function ModelChoice() {
  const { live, cloudReady, models, preferredModel, update } = useSettings();
  return (
    <Section title="Default AI model" description="Used for drafting, rewriting and reviewing. You can change it any time from the editor.">
      <div className="radio-cards" role="radiogroup" aria-label="Default model">
        {models.map((m) => (
          <button key={m.id} role="radio" aria-checked={preferredModel === m.id} disabled={!live} className={`radio-card ${preferredModel === m.id ? 'is-on' : ''}`} onClick={() => update({ model: m.id })}>
            <span className="radio-card__head">
              <strong>{m.label}</strong>
              {preferredModel === m.id && <Check size={15} aria-hidden />}
            </span>
            <span className="tag">{m.tier}</span>
            <small>{m.blurb}</small>
          </button>
        ))}
      </div>
      {!live && <p className="field__help">Start Ollama or connect Claude to choose a model.</p>}
      {live && !cloudReady && <p className="field__help">Add a Claude API key below to also choose Claude models.</p>}
    </Section>
  );
}

function Profile() {
  const { settings, update } = useSettings();
  const fields = [
    ['name', 'Your name', 'Used to personalise the dashboard and pre-fill signatory fields'],
    ['organization', 'Company / firm name', 'Pre-filled as your side of agreements'],
    ['address', 'Address', 'Pre-filled in party details'],
    ['jurisdiction', 'Default governing law', 'e.g. India (Maharashtra), England and Wales'],
  ];
  return (
    <Section title="Your details" description="Saved in this browser and used to pre-fill new documents, so you type them once.">
      <JurisdictionList />
      <div className="form-grid">
        {fields.map(([key, label, help]) => (
          <div className="field" key={key}>
            <label htmlFor={`s-${key}`}>{label}</label>
            <input id={`s-${key}`} type="text" value={settings[key]} list={key === 'jurisdiction' ? JURISDICTION_LIST_ID : undefined} onChange={(e) => update({ [key]: e.target.value })} autoComplete="off" />
            <small className="field__help">{help}</small>
          </div>
        ))}
      </div>
    </Section>
  );
}

function DataTools() {
  const { docs, replaceAll } = useDocs();
  const { settings } = useSettings();
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [confirm, setConfirm] = useState(false);

  const exportBackup = () => {
    const { apiKey, ...safeSettings } = settings;
    const blob = new Blob([JSON.stringify({ app: 'legal-law-studio', version: 1, exportedAt: new Date().toISOString(), settings: safeSettings, docs }, null, 2)], { type: 'application/json' });
    download(blob, `legal-law-backup-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const importBackup = async (file) => {
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.docs)) throw new Error('bad file');
      const incoming = data.docs.filter((d) => d && typeof d.id === 'string' && typeof d.title === 'string');
      const ids = new Set(docs.map((d) => d.id));
      const fresh = incoming.filter((d) => !ids.has(d.id));
      replaceAll([...fresh, ...docs]);
      toast(`Imported ${fresh.length} document${fresh.length === 1 ? '' : 's'}${incoming.length - fresh.length ? ` (${incoming.length - fresh.length} already existed)` : ''}`, { kind: 'success' });
    } catch {
      toast('That file is not a valid backup.', { kind: 'error' });
    }
  };

  return (
    <Section title="Your data" description="Documents are stored only in this browser. Export a backup to keep them safe or move them to another device.">
      <div className="settings-actions">
        <button className="btn btn--ghost btn--sm" onClick={exportBackup} disabled={!docs.length}>
          <Download size={15} aria-hidden /> Export backup
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()}>
          <Upload size={15} aria-hidden /> Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importBackup(f);
            e.target.value = '';
          }}
        />
        <button className="btn btn--danger-ghost btn--sm" onClick={() => setConfirm(true)} disabled={!docs.length}>
          <Trash2 size={15} aria-hidden /> Delete all documents
        </button>
      </div>
      {confirm && (
        <ConfirmDialog
          title="Delete all documents?"
          message={`This permanently removes all ${docs.length} documents from this browser. Export a backup first if you might need them.`}
          confirmLabel="Delete everything"
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            replaceAll([]);
            setConfirm(false);
            toast('All documents deleted', { kind: 'success' });
          }}
        />
      )}
    </Section>
  );
}

function Support() {
  return (
    <Section title="Customer support" description="Questions about the app or trouble with a document? Call us.">
      <div className="settings-actions">
        <a className="btn btn--ghost btn--sm" href={SUPPORT_PHONE_HREF}>
          <Phone size={15} aria-hidden /> {SUPPORT_PHONE_DISPLAY}
        </a>
      </div>
    </Section>
  );
}

export default function SettingsPage() {
  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1>Settings</h1>
          <p>Set up AI (a local model or Claude), choose your default model, and set the details used to pre-fill documents.</p>
        </div>
      </header>
      <div className="stack">
        <LocalModels />
        <ModelChoice />
        <AIConnection />
        <Profile />
        <DataTools />
        <Support />
      </div>
    </div>
  );
}
