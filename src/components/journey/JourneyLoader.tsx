import { useEffect, useRef, useState, type ReactElement } from 'react';
import * as THREE from 'three';

/**
 * Boot loader overlay for /journey.
 *
 * Three.js's `DefaultLoadingManager` is shared by drei's `useTexture` AND the
 * VOXLoader (and GLTFLoader). It calls our hooks for each load start / progress
 * / completion, so we get one accurate progress signal across the whole scene
 * without instrumenting every loader.
 *
 * The overlay sits above the <Canvas> so the canvas can already start mounting
 * behind it (which is how the textures begin downloading in the first place).
 * It fades out smoothly once we've hit 100% AND a minimum display time has
 * passed (so it doesn't flash and feel broken on a fast desktop).
 *
 * It also blocks scroll while loading — otherwise on slow mobile a user
 * scrolls past the missing Earth before it's done downloading and gets
 * confused.
 */
export default function JourneyLoader(): ReactElement | null {
  // pct 0..100, "real" once at least one asset has started
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const [removed, setRemoved] = useState(false);
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    // Hide the static pre-hydration loader the instant the React loader
    // mounts — this avoids any double-loader flash and gives us the
    // animated 0->100 numeric progress as soon as JS is alive.
    const staticEl = document.getElementById('journey-static-loader');
    if (staticEl) staticEl.setAttribute('aria-hidden', 'true');

    const mgr = THREE.DefaultLoadingManager;

    // Lock body scroll until loaded — otherwise the user can scroll past the
    // not-yet-rendered Earth and miss the opener entirely.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onProgress = (_url: string, loaded: number, total: number): void => {
      // Three's loaded/total is per-item count, not bytes — but it's the only
      // reliable signal across all loaders. Good enough for a UX progress bar.
      const next = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
      setPct((cur) => (next > cur ? next : cur));
    };

    const onLoad = (): void => {
      setPct(100);
      // Minimum display time so the bar doesn't flash on instant cache hits.
      const elapsed = performance.now() - startTimeRef.current;
      const remaining = Math.max(0, 600 - elapsed);
      window.setTimeout(() => setDone(true), remaining);
    };

    const onError = (url: string): void => {
      // Don't block forever on a single asset failure — log and continue.
      console.warn('[JourneyLoader] asset failed:', url);
    };

    // Three.js never calls onLoad if NO assets are ever loaded — so if the
    // scene never registers any (shouldn't happen, but defensive), we time
    // out after 8s and let users in anyway.
    const safetyId = window.setTimeout(() => {
      onLoad();
    }, 8000);

    const prevProgress = mgr.onProgress;
    const prevOnLoad = mgr.onLoad;
    const prevOnError = mgr.onError;

    mgr.onProgress = (url, loaded, total): void => {
      onProgress(url, loaded, total);
      prevProgress?.(url, loaded, total);
    };
    mgr.onLoad = (): void => {
      onLoad();
      prevOnLoad?.();
    };
    mgr.onError = (url): void => {
      onError(url);
      prevOnError?.(url);
    };

    return () => {
      window.clearTimeout(safetyId);
      mgr.onProgress = prevProgress;
      mgr.onLoad = prevOnLoad;
      mgr.onError = prevOnError;
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Re-enable scroll the moment we hit 100% (don't wait for fade-out).
  useEffect(() => {
    if (done) document.body.style.overflow = '';
  }, [done]);

  // After the fade-out finishes, fully remove the DOM so it can never block
  // pointer events even with `pointer-events: none`. Also remove the static
  // pre-hydration loader from the DOM so it doesn't sit there forever.
  useEffect(() => {
    if (!done) return undefined;
    const id = window.setTimeout(() => {
      setRemoved(true);
      const staticEl = document.getElementById('journey-static-loader');
      staticEl?.parentElement?.removeChild(staticEl);
    }, 700); // matches CSS transition
    return () => window.clearTimeout(id);
  }, [done]);

  if (removed) return null;

  return (
    <div className={`journey-loader${done ? ' is-done' : ''}`} aria-hidden={done}>
      <div className="jl-stars" />
      <div className="jl-content">
        <div className="jl-eyebrow">// THE JOURNEY</div>
        <div className="jl-percent">
          {String(pct).padStart(3, '0')}<span>%</span>
        </div>
        <div className="jl-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="jl-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="jl-status">{pct < 100 ? 'Loading the world…' : 'Ready.'}</div>
      </div>
      <style>{`
        .journey-loader {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: #060810;
          color: #ffd29a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          opacity: 1;
          transition: opacity 0.6s ease-out;
          pointer-events: auto;
        }
        .journey-loader.is-done {
          opacity: 0;
          pointer-events: none;
        }
        /* Subtle starfield via radial gradients (no extra request needed) */
        .jl-stars {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(1px 1px at 12% 18%, #fff8 50%, transparent 51%),
            radial-gradient(1px 1px at 82% 28%, #fff7 50%, transparent 51%),
            radial-gradient(1px 1px at 28% 72%, #fff8 50%, transparent 51%),
            radial-gradient(1px 1px at 64% 88%, #fff6 50%, transparent 51%),
            radial-gradient(1px 1px at 48% 38%, #fff4 50%, transparent 51%),
            radial-gradient(1px 1px at 92% 62%, #fff5 50%, transparent 51%),
            radial-gradient(1px 1px at 8% 78%, #fff5 50%, transparent 51%),
            radial-gradient(2px 2px at 22% 42%, #fff6 50%, transparent 51%),
            radial-gradient(1px 1px at 70% 58%, #fff5 50%, transparent 51%);
          background-size: 100% 100%;
          opacity: 0.55;
        }
        .jl-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 0 24px;
          text-align: center;
        }
        .jl-eyebrow {
          font-size: 11px;
          letter-spacing: 0.34em;
          font-weight: 700;
          color: #ff9460;
          text-transform: uppercase;
        }
        .jl-percent {
          font: 800 clamp(56px, 12vw, 128px)/1 'Inter', system-ui, sans-serif;
          color: #ffd29a;
          letter-spacing: -0.04em;
          font-feature-settings: 'tnum';
          font-variant-numeric: tabular-nums;
        }
        .jl-percent span {
          font-size: 0.42em;
          color: #c4b598;
          margin-left: 4px;
          letter-spacing: 0;
        }
        .jl-bar {
          width: min(72vw, 360px);
          height: 2px;
          background: rgba(255, 210, 154, 0.12);
          overflow: hidden;
          border-radius: 1px;
        }
        .jl-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff9460, #ffd29a);
          transition: width 0.18s ease-out;
          will-change: width;
        }
        .jl-status {
          font-size: 11px;
          letter-spacing: 0.22em;
          font-weight: 600;
          color: #6f6a5e;
          text-transform: uppercase;
        }
        @media (prefers-reduced-motion: reduce) {
          .journey-loader { transition: opacity 0.2s; }
          .jl-bar-fill { transition: none; }
        }
      `}</style>
    </div>
  );
}
