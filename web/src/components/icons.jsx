import { ShieldCheck, Briefcase, Handshake, FileSignature, Home, Landmark, Stamp, Users, Gavel, Globe, Sparkles, FileText } from 'lucide-react';

const MAP = { ShieldCheck, Briefcase, Handshake, FileSignature, Home, Landmark, Stamp, Users, Gavel, Globe, Sparkles };

export function TemplateIcon({ name, size = 22 }) {
  const Icon = MAP[name] ?? FileText;
  return <Icon size={size} aria-hidden />;
}
