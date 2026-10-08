import { Scale } from 'lucide-react';

export default function Logo({ compact = false }) {
  return (
    <div className="logo">
      <span className="logo__mark">
        <Scale size={20} aria-hidden />
      </span>
      {!compact && (
        <span className="logo__text">
          <span className="logo__name">LEGAL LAW</span>
          <span className="logo__tag">AI Document Studio</span>
        </span>
      )}
    </div>
  );
}
