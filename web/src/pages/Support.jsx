import { ExternalLink, Phone } from 'lucide-react';
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_HREF } from '../lib/support.js';

const FORM_URL = 'https://tally.so/embed/PdMdYd?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1';
const FORM_PAGE_URL = 'https://tally.so/r/PdMdYd';

export default function SupportPage() {
  return (
    <div className="page page--wide">
      <section className="section">
        <p className="eyebrow">LEGAL LAW · CUSTOMER SUPPORT</p>
        <h1>How can we help?</h1>
        <p className="hero__sub support-page__intro">
          Send our team your question using the form below. We’ll use your details to follow up about your request.
        </p>
        <a className="support-page__phone" href={SUPPORT_PHONE_HREF}>
          <Phone size={17} aria-hidden />
          Call customer support: {SUPPORT_PHONE_DISPLAY}
        </a>
      </section>

      <section className="support-form card" aria-label="Customer support form">
        <iframe
          className="support-form__frame"
          src={FORM_URL}
          title="LEGAL LAW customer support form"
          loading="lazy"
          allow="clipboard-write"
        />
        <p className="support-form__fallback">
          If the form does not load,{' '}
          <a href={FORM_PAGE_URL} target="_blank" rel="noreferrer">
            open it in a new tab <ExternalLink size={13} aria-hidden />
          </a>
          .
        </p>
      </section>
    </div>
  );
}
