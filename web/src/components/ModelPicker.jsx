import { Link } from 'react-router-dom';
import { Sparkles, ChevronDown, Check, Lock } from 'lucide-react';
import { Dropdown } from './ui.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export default function ModelPicker({ align = 'left', compact = false }) {
  const { live, models, preferredModel, update } = useSettings();
  const current = models.find((m) => m.id === preferredModel);

  return (
    <Dropdown
      align={align}
      width={340}
      trigger={({ open, toggle }) => (
        <button className={`model-btn ${compact ? 'model-btn--compact' : ''}`} onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
          {live ? <Sparkles size={15} aria-hidden /> : <Lock size={14} aria-hidden />}
          <span>{live ? current?.label ?? 'Choose model' : 'Demo drafter'}</span>
          <ChevronDown size={14} aria-hidden />
        </button>
      )}
    >
      {(close) =>
        live ? (
          <>
            <div className="menu-label">AI model</div>
            {models.map((m) => (
              <button
                key={m.id}
                role="menuitemradio"
                aria-checked={m.id === preferredModel}
                className={`model-option ${m.id === preferredModel ? 'is-selected' : ''}`}
                onClick={() => {
                  update({ model: m.id });
                  close();
                }}
              >
                <span className="model-option__head">
                  <strong>{m.label}</strong>
                  <span className="tag">{m.tier}</span>
                  {m.id === preferredModel && <Check size={15} aria-hidden />}
                </span>
                <small>{m.blurb}</small>
              </button>
            ))}
          </>
        ) : (
          <div className="model-demo">
            <strong>You are using the offline demo drafter</strong>
            <p>It fills the built-in clause library with your answers. Start Ollama to use a model on this computer, or connect a Claude API key.</p>
            <Link to="/settings" className="btn btn--primary btn--sm" onClick={close}>
              Set up AI
            </Link>
          </div>
        )
      }
    </Dropdown>
  );
}
