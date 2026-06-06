import { forwardRef } from 'react';

interface Props {
  eyebrow: string;
  title: string;
  /** Italic-styled accent word inside `title` (will be highlighted in cream). */
  titleEm?: string;
  caption?: string;
}

/**
 * HTML overlay rendered absolutely over the canvas. Used for hero beats
 * (02 · Trust Earned, 07 · Voice AI Live, 12 · Today).
 *
 * Opacity is mutated externally via the forwarded ref — the parent runs a
 * requestAnimationFrame loop that copies sceneState.heroXXOpacity onto
 * `ref.style.opacity` each frame. React never re-renders during scroll.
 */
const HeroTitle = forwardRef<HTMLDivElement, Props>(function HeroTitle(
  { eyebrow, title, titleEm, caption },
  ref,
) {
  const parts = titleEm ? title.split(titleEm) : null;

  return (
    <div
      ref={ref}
      className="hero-title"
      style={{ opacity: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <div className="ht-eyebrow">{eyebrow}</div>
      <h1 className="ht-title">
        {parts ? (
          <>
            {parts[0]}
            <em>{titleEm}</em>
            {parts[1] ?? ''}
          </>
        ) : (
          title
        )}
      </h1>
      {caption && <div className="ht-caption">{caption}</div>}

      <style>{`
        .hero-title {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 5;
          text-align: center;
          color: #fff;
          font-family: 'Sora', 'Inter', system-ui, sans-serif;
          width: min(92vw, 760px);
          padding: 0 20px;
          will-change: opacity;
          transition: opacity 0.04s linear; /* tiny smoothing for sub-frame jitter */
        }
        .ht-eyebrow {
          font: 700 11px/1 'JetBrains Mono', monospace;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #ff9460;
          margin-bottom: 18px;
          text-shadow: 0 2px 14px rgba(0,0,0,0.6);
        }
        .ht-title {
          font: 800 clamp(40px, 7vw, 88px)/0.95 'Sora', 'Inter', system-ui, sans-serif;
          letter-spacing: -0.045em;
          color: #fff;
          margin: 0;
          text-shadow: 0 4px 28px rgba(0,0,0,0.7);
        }
        .ht-title em {
          font-family: 'Fraunces', 'Sora', serif;
          font-style: italic;
          font-weight: 400;
          color: #ffd29a;
        }
        .ht-caption {
          margin-top: 22px;
          font: 500 13px/1.4 'JetBrains Mono', monospace;
          letter-spacing: 0.12em;
          color: #c4b598;
          text-shadow: 0 2px 10px rgba(0,0,0,0.6);
        }
      `}</style>
    </div>
  );
});

export default HeroTitle;
