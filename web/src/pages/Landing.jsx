import { Link } from 'react-router-dom';
import { ArrowRight, FileDown, MessageSquareText, PenLine, Phone, Scale, ShieldAlert, Sparkles } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { TemplateIcon } from '../components/icons.jsx';
import { TEMPLATES } from '../../../shared/templates/index.js';
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_HREF } from '../lib/support.js';

const STEPS = [
  {
    icon: MessageSquareText,
    title: 'Describe it',
    text: 'Say what you need in plain language, or pick a template. We ask only the questions that matter.',
  },
  {
    icon: Sparkles,
    title: 'Draft with AI',
    text: 'A Claude model, or a model running privately on your own computer, writes the full document clause by clause, tailored to your parties, terms and jurisdiction.',
  },
  {
    icon: PenLine,
    title: 'Refine and review',
    text: 'Ask for edits in plain English, or run a review that flags risky or missing clauses before you sign.',
  },
  {
    icon: FileDown,
    title: 'Export',
    text: 'Download as a Word document, Markdown or plain text, or print it straight from the editor.',
  },
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="lp-nav">
        <div className="lp-nav__inner">
          <Link to="/" aria-label="LEGAL LAW home">
            <Logo />
          </Link>
          <nav className="lp-nav__links" aria-label="Page sections">
            <a href="#how">How it works</a>
            <a href="#documents">Documents</a>
          </nav>
          <Link to="/app" className="btn btn--primary btn--sm">
            Open the app <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </header>

      <main>
        <section className="lp-hero" aria-labelledby="lp-quote">
          <div className="lp-hero__glow" aria-hidden />
          <div className="lp-hero__grid" aria-hidden />

          <div className="lp-mark" aria-hidden>
            <span className="lp-mark__ring lp-mark__ring--a" />
            <span className="lp-mark__ring lp-mark__ring--b" />
            <span className="lp-mark__tile">
              <Scale size={44} strokeWidth={1.75} />
            </span>
          </div>

          <p className="lp-brand">
            LEGAL LAW <span aria-hidden>·</span> AI Document Studio
          </p>

          <figure className="lp-quote">
            <blockquote id="lp-quote">
              <p>
                The law is a <em>weapon</em> if you know how to use it.
              </p>
            </blockquote>
            <figcaption>
              <span className="lp-quote__rule" aria-hidden />
              <cite>Lawerance Joseph</cite>
              <span className="lp-quote__rule" aria-hidden />
            </figcaption>
          </figure>

          <p className="lp-hero__sub">
            Legal Law puts the know-how in your hands. Describe the document you need and AI drafts it in seconds, ready to refine, review and export.
          </p>

          <div className="lp-hero__cta">
            <Link to="/new" className="btn btn--primary btn--lg">
              Start drafting <ArrowRight size={17} aria-hidden />
            </Link>
            <Link to="/app" className="btn btn--ghost btn--lg">
              Open the app
            </Link>
          </div>
        </section>

        <section className="lp-section" id="how" aria-labelledby="lp-how">
          <div className="lp-section__head">
            <p className="lp-kicker">How it works</p>
            <h2 id="lp-how">From a sentence to a signed-ready draft</h2>
          </div>
          <ol className="lp-steps">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="lp-step">
                <span className="lp-step__num" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="lp-step__icon">
                  <Icon size={20} aria-hidden />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="lp-section" id="documents" aria-labelledby="lp-docs">
          <div className="lp-section__head">
            <p className="lp-kicker">Documents</p>
            <h2 id="lp-docs">{TEMPLATES.length} document types, ready to draft</h2>
            <p>Pick one to start, or describe something else and let the custom drafter handle it.</p>
          </div>
          <div className="lp-docs">
            {TEMPLATES.map((t) => (
              <Link key={t.id} to={`/new/${t.id}`} className="lp-doc">
                <span className="lp-doc__icon">
                  <TemplateIcon name={t.icon} size={20} />
                </span>
                <span className="lp-doc__body">
                  <strong>{t.name}</strong>
                  <small>{t.category}</small>
                </span>
                <ArrowRight size={16} className="lp-doc__arrow" aria-hidden />
              </Link>
            ))}
          </div>
        </section>

        <section className="lp-final" aria-labelledby="lp-final">
          <div className="lp-final__glow" aria-hidden />
          <h2 id="lp-final">Ready to put it to use?</h2>
          <p>No account needed. Your documents are saved in your browser.</p>
          <Link to="/new" className="btn btn--primary btn--lg">
            Create your first document <ArrowRight size={17} aria-hidden />
          </Link>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer__top">
          <Logo />
          <a href={SUPPORT_PHONE_HREF} className="lp-footer__phone">
            <Phone size={15} aria-hidden /> Customer support · {SUPPORT_PHONE_DISPLAY}
          </a>
        </div>
        <p className="lp-footer__note" role="note">
          <ShieldAlert size={15} aria-hidden />
          <span>
            AI-generated drafts are not legal advice. Review every document, and have a qualified lawyer check anything important before you sign.
          </span>
        </p>
      </footer>
    </div>
  );
}
