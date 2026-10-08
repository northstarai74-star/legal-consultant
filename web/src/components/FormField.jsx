import { JURISDICTIONS } from '../../../shared/templates/index.js';

export const JURISDICTION_LIST_ID = 'dl-jurisdictions';

export function JurisdictionList() {
  return (
    <datalist id={JURISDICTION_LIST_ID}>
      {JURISDICTIONS.map((j) => (
        <option key={j} value={j} />
      ))}
    </datalist>
  );
}

export default function FormField({ field, value, onChange, error }) {
  const id = `f-${field.key}`;
  const common = {
    id,
    name: field.key,
    value,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-err` : field.help ? `${id}-help` : undefined,
    onChange: (e) => onChange(field.key, e.target.value),
  };

  let control;
  if (field.type === 'textarea') {
    control = <textarea {...common} rows={field.rows ?? 3} placeholder={field.placeholder} />;
  } else if (field.type === 'select') {
    control = (
      <select {...common}>
        {field.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  } else if (field.type === 'date') {
    control = <input {...common} type="date" />;
  } else {
    control = <input {...common} type="text" placeholder={field.placeholder} list={field.suggest ? JURISDICTION_LIST_ID : undefined} autoComplete="off" />;
  }

  return (
    <div className={`field ${field.type === 'textarea' ? 'field--wide' : ''} ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>
        {field.label}
        {field.required && (
          <span className="req" title="Required">
            {' '}
            *
          </span>
        )}
      </label>
      {control}
      {error ? (
        <small id={`${id}-err`} className="field__error" role="alert">
          {error}
        </small>
      ) : (
        field.help && (
          <small id={`${id}-help`} className="field__help">
            {field.help}
          </small>
        )
      )}
    </div>
  );
}
