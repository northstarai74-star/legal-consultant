import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock } from 'lucide-react';
import { TemplateIcon } from './icons.jsx';

export default function TemplateCard({ template, state }) {
  return (
    <Link to={`/new/${template.id}`} state={state} className="tcard">
      <span className="tcard__icon">
        <TemplateIcon name={template.icon} />
      </span>
      <span className="tcard__body">
        <strong>{template.name}</strong>
        <span>{template.blurb}</span>
      </span>
      <span className="tcard__meta">
        <span className="tag">{template.category}</span>
        <span className="tcard__time">
          <Clock size={12} aria-hidden /> ~{template.minutes} min
        </span>
        <ArrowUpRight size={16} className="tcard__arrow" aria-hidden />
      </span>
    </Link>
  );
}
