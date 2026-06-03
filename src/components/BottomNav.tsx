import { useEffect, useState, type ReactElement } from 'react';

const sections = [
  { id: 'home', label: 'Home' },
  { id: 'work', label: 'Work' },
  { id: 'arc', label: 'Arc' },
  { id: 'recognized', label: 'Recognized' },
  { id: 'more', label: 'More' },
  { id: 'contact', label: 'Contact' },
];

export default function BottomNav(): ReactElement {
  const [active, setActive] = useState<string>('home');

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="bnav-wrap">
      <nav className="bnav" aria-label="In-page navigation">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`item ${active === s.id ? 'active' : ''}`}
            aria-current={active === s.id ? 'true' : undefined}
          >
            {s.label}
          </a>
        ))}
      </nav>
      <style>{`
        .bnav-wrap {
          display: flex;
          justify-content: center;
          position: sticky;
          bottom: 20px;
          padding: 28px 16px;
          z-index: 50;
          pointer-events: none;
          max-width: 100vw;
        }
        .bnav {
          padding: 8px 12px;
          background: rgba(20, 20, 28, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 210, 154, 0.18);
          border-radius: 100px;
          display: inline-flex;
          gap: 4px;
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
          pointer-events: auto;
          max-width: 100%;
        }
        .bnav .item {
          padding: 8px 14px;
          font: 600 11px/1 'Inter', system-ui, sans-serif;
          color: #888094;
          border-radius: 100px;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.2s, background 0.2s;
          white-space: nowrap;
        }
        .bnav .item:hover { color: #c4b598; }
        .bnav .item.active {
          background: rgba(255, 210, 154, 0.15);
          color: #ffd29a;
        }

        /* Mobile: tighter padding + smaller font + drop Home/More labels */
        @media (max-width: 640px) {
          .bnav { padding: 6px 8px; gap: 2px; }
          .bnav .item { padding: 7px 10px; font-size: 10px; letter-spacing: -0.01em; }
        }
        @media (max-width: 420px) {
          /* On very narrow screens, hide Home + More (least essential) */
          .bnav .item[href="#home"], .bnav .item[href="#more"] { display: none; }
        }
      `}</style>
    </div>
  );
}
