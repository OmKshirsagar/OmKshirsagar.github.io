import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { CaseStudy } from '@/data/select';
import ArchDiagram from './ArchDiagram';

interface Props {
  cases: Record<string, CaseStudy>;
}

const STATUS_LABEL: Record<CaseStudy['status'], string> = {
  production: 'IN PRODUCTION',
  shipped: 'SHIPPED',
  'in-progress': 'IN PROGRESS',
  demo: 'DEMO',
};

export default function ProjectModal({ cases }: Props): ReactElement | null {
  const [slug, setSlug] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Listen for global open events from FeaturedBand
  useEffect(() => {
    const handler = (e: Event): void => {
      const detail = (e as CustomEvent<{ slug: string }>).detail;
      if (detail?.slug && cases[detail.slug]) {
        setSlug(detail.slug);
      }
    };
    window.addEventListener('open-case-study', handler);
    return () => window.removeEventListener('open-case-study', handler);
  }, [cases]);

  // ESC handler + body scroll lock + focus management
  useEffect(() => {
    if (!slug) return undefined;
    const esc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setSlug(null);
    };
    document.addEventListener('keydown', esc);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus close button on next tick so the panel exists
    const t = window.setTimeout(() => closeRef.current?.focus(), 0);
    // Scroll panel to top
    if (panelRef.current) panelRef.current.scrollTop = 0;
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [slug]);

  const close = useCallback((): void => setSlug(null), []);
  const stop = useCallback((e: MouseEvent): void => e.stopPropagation(), []);

  if (!slug) return null;
  const cs = cases[slug];
  if (!cs) return null;

  return (
    <div
      className="cs-backdrop"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cs-title"
    >
      <div className="cs-panel" ref={panelRef} onClick={stop}>
        <header className="cs-head">
          <div className="cs-meta">
            <span className={`cs-status cs-status-${cs.status}`}>
              <span className="cs-dot" aria-hidden="true" />
              {STATUS_LABEL[cs.status]}
            </span>
            <span className="cs-slug">// {cs.slug}</span>
          </div>
          <h2 id="cs-title" className="cs-title">
            {cs.title}
          </h2>
          <button
            ref={closeRef}
            className="cs-close"
            onClick={close}
            aria-label="Close case study"
          >
            ×
          </button>
        </header>

        <div className="cs-body">
          {cs.headline && <p className="cs-headline">{cs.headline}</p>}

          {cs.problem && (
            <Section label="01 // problem" title="The problem">
              <p className="cs-prose">{cs.problem}</p>
            </Section>
          )}

          {cs.approach && (
            <Section label="02 // approach" title="The approach">
              <p
                className="cs-prose"
                // approach text may contain <code> tags from YAML
                dangerouslySetInnerHTML={{ __html: cs.approach }}
              />
            </Section>
          )}

          {cs.architecture.nodes.length > 0 && (
            <Section label="03 // architecture" title="System architecture">
              <ArchDiagram
                nodes={cs.architecture.nodes}
                edges={cs.architecture.edges}
              />
            </Section>
          )}

          {cs.keyFeatures.length > 0 && (
            <Section label="04 // features" title="Key features">
              <ul className="cs-list">
                {cs.keyFeatures.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </Section>
          )}

          {cs.myContributions.length > 0 && (
            <Section label="05 // contributions" title="What I did">
              <ul className="cs-list">
                {cs.myContributions.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </Section>
          )}

          {Object.keys(cs.stack).length > 0 && (
            <Section label="06 // stack" title="Stack">
              <div className="cs-stack">
                {Object.entries(cs.stack).map(([layer, items]) => (
                  <div key={layer} className="cs-stack-group">
                    <div className="cs-stack-label">
                      {layer.replace(/_/g, ' ')}
                    </div>
                    <div className="cs-chips">
                      {items.map((t) => (
                        <span className="cs-chip" key={t}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {cs.patterns.length > 0 && (
            <Section label="07 // patterns" title="Notable engineering patterns">
              <ul className="cs-list">
                {cs.patterns.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </Section>
          )}

          {cs.outcomes.length > 0 && (
            <Section label="08 // outcomes" title="Outcomes">
              <ul className="cs-list cs-outcomes">
                {cs.outcomes.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>

      <style>{`
        .cs-backdrop {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(6, 6, 9, 0.78);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: cs-fade 0.18s ease-out;
        }
        .cs-panel {
          position: relative;
          width: 100%;
          max-width: 940px;
          max-height: 92vh;
          background: linear-gradient(180deg, #14141c 0%, #0e0e15 100%);
          border: 1px solid rgba(255, 210, 154, 0.18);
          border-radius: 10px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
          overflow-y: auto;
          overflow-x: hidden;
          animation: cs-rise 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes cs-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cs-rise {
          from { transform: translateY(12px) scale(0.98); opacity: 0; }
          to { transform: none; opacity: 1; }
        }

        .cs-head {
          position: sticky;
          top: 0;
          z-index: 2;
          padding: 22px 28px 18px;
          background: rgba(14, 14, 21, 0.95);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(255, 210, 154, 0.1);
        }
        .cs-meta { display: flex; align-items: center; gap: 12px; font: 700 9px/1 'JetBrains Mono', monospace; letter-spacing: 0.22em; }
        .cs-status {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 8px;
          border-radius: 3px;
          background: rgba(255, 210, 154, 0.08);
          color: #ffd29a;
        }
        .cs-status-production { background: rgba(124, 224, 152, 0.12); color: #7ce098; }
        .cs-status-in-progress { background: rgba(255, 148, 96, 0.14); color: #ff9460; }
        .cs-status-shipped { background: rgba(255, 210, 154, 0.12); color: #ffd29a; }
        .cs-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 8px currentColor;
        }
        .cs-slug { color: #888094; }
        .cs-title {
          font: 700 30px/1.1 'Sora', 'Inter', system-ui, sans-serif;
          letter-spacing: -0.03em;
          color: #fff;
          margin: 12px 0 0;
          padding-right: 50px;
        }
        .cs-close {
          position: absolute;
          top: 14px;
          right: 16px;
          width: 36px; height: 36px;
          border: 1px solid rgba(255, 210, 154, 0.2);
          background: rgba(20, 20, 28, 0.8);
          color: #ffd29a;
          border-radius: 50%;
          font: 400 24px/1 system-ui;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          padding: 0 0 2px;
          transition: border-color 0.2s, background 0.2s;
        }
        .cs-close:hover { border-color: rgba(255, 210, 154, 0.5); background: rgba(40, 30, 20, 0.9); }
        .cs-close:focus-visible { outline: 2px solid #ffd29a; outline-offset: 2px; }

        .cs-body {
          padding: 24px 28px 56px;
        }
        .cs-headline {
          font: 400 17px/1.5 'Inter', system-ui, sans-serif;
          color: #d6c9ad;
          margin: 8px 0 28px;
          padding-left: 14px;
          border-left: 2px solid var(--accent-warm);
        }

        .cs-section { margin: 32px 0 0; }
        .cs-section-label { font: 700 9px/1 'JetBrains Mono', monospace; letter-spacing: 0.22em; color: #ff9460; }
        .cs-section-title {
          font: 700 20px/1.15 'Sora', 'Inter', system-ui, sans-serif;
          letter-spacing: -0.02em;
          color: #fff;
          margin: 8px 0 14px;
        }
        .cs-section-body { color: #c4b598; }
        .cs-prose {
          font: 400 15px/1.6 'Inter', system-ui, sans-serif;
          color: #c4b598;
          margin: 0;
          max-width: 720px;
        }
        .cs-prose code {
          font: 600 13px/1 'JetBrains Mono', monospace;
          background: rgba(255, 210, 154, 0.1);
          color: #ffd29a;
          padding: 2px 5px;
          border-radius: 3px;
        }

        .cs-list {
          margin: 0; padding: 0; list-style: none;
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 640px) {
          .cs-list { grid-template-columns: 1fr 1fr; gap: 10px 28px; }
        }
        .cs-list li {
          position: relative;
          padding-left: 18px;
          font: 400 14px/1.5 'Inter', system-ui, sans-serif;
          color: #c4b598;
        }
        .cs-list li::before {
          content: '';
          position: absolute;
          left: 0; top: 9px;
          width: 6px; height: 6px;
          background: var(--accent-warm);
          border-radius: 50%;
          opacity: 0.7;
        }
        .cs-outcomes li::before { background: #7ce098; }

        .cs-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .cs-stack-group {
          padding: 12px 14px;
          background: rgba(255, 210, 154, 0.03);
          border-left: 2px solid rgba(255, 210, 154, 0.2);
          border-radius: 0 4px 4px 0;
        }
        .cs-stack-label {
          font: 700 9px/1 'JetBrains Mono', monospace;
          letter-spacing: 0.22em;
          color: #888094;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .cs-chips { display: flex; flex-wrap: wrap; gap: 5px; }
        .cs-chip {
          font: 600 11px/1 'JetBrains Mono', monospace;
          letter-spacing: 0.04em;
          padding: 5px 9px;
          background: rgba(255, 210, 154, 0.06);
          color: #c4b598;
          border-radius: 3px;
          border: 1px solid rgba(255, 210, 154, 0.12);
        }

        @media (max-width: 640px) {
          .cs-backdrop { padding: 0; }
          .cs-panel { max-height: 100vh; height: 100vh; border-radius: 0; border: 0; }
          .cs-body { padding: 18px 18px 60px; }
          .cs-head { padding: 18px 20px 14px; }
          .cs-title { font-size: 24px; padding-right: 44px; }
          .cs-close { top: 10px; right: 10px; width: 32px; height: 32px; }
          .cs-section-title { font-size: 17px; }
          .cs-headline { font-size: 15px; }
        }
      `}</style>
    </div>
  );
}

interface SectionProps {
  label: string;
  title: string;
  children: ReactNode;
}

function Section({ label, title, children }: SectionProps): ReactElement {
  return (
    <section className="cs-section">
      <div className="cs-section-label">{label}</div>
      <h3 className="cs-section-title">{title}</h3>
      <div className="cs-section-body">{children}</div>
    </section>
  );
}
