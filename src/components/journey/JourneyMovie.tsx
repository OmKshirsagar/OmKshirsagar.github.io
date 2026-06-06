import { Canvas } from '@react-three/fiber';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import CameraRig from './CameraRig';
import Stage from './Stage';
import HeroTitle from './HeroTitle';
import {
  BEAT_CAPTIONS,
  BEAT_NAMES,
  initialCameraState,
  initialSceneState,
} from './lib/state';
import { useJourneyTimeline } from './lib/useJourneyTimeline';

/**
 * Top-level /journey island. Mounts ONCE via Astro's client:only="react".
 * Holds:
 *   - the shared ref state that GSAP writes and R3F reads
 *   - the <Canvas> root with all 3D scene content
 *   - 3 hero-title HTML overlays + one rolling bottom caption
 *   - a per-frame rAF loop that copies opacity / text state from refs onto
 *     the DOM overlays (so React never re-renders during scroll)
 *   - a tiny dev HUD (top-right) showing current beat / progress / camera
 */
export default function JourneyMovie(): ReactElement {
  const scopeRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef({ ...initialCameraState });
  const sceneRef = useRef({ ...initialSceneState });

  // Overlay refs — opacity & text written each frame from the rAF loop
  const hero02Ref = useRef<HTMLDivElement>(null);
  const hero07Ref = useRef<HTMLDivElement>(null);
  const hero12Ref = useRef<HTMLDivElement>(null);
  const captionWrapRef = useRef<HTMLDivElement>(null);
  const captionTextRef = useRef<HTMLSpanElement>(null);

  const showDevHud = true;
  const showMarkers = false;

  // ~10Hz tick just for the dev HUD's text fields. The visual overlays
  // (hero titles + caption) update every frame via the rAF loop below.
  const [, bumpHud] = useState(0);
  useEffect(() => {
    if (!showDevHud) return undefined;
    const id = window.setInterval(() => bumpHud((n) => n + 1), 100);
    return () => window.clearInterval(id);
  }, [showDevHud]);

  // Per-frame DOM mutation loop — keeps overlay opacity / text in lockstep
  // with the GSAP-scrubbed scene state, without any React re-renders.
  useEffect(() => {
    let raf = 0;
    let lastCaption = '';
    const tick = (): void => {
      const s = sceneRef.current;
      if (hero02Ref.current) hero02Ref.current.style.opacity = String(s.hero02Opacity);
      if (hero07Ref.current) hero07Ref.current.style.opacity = String(s.hero07Opacity);
      if (hero12Ref.current) hero12Ref.current.style.opacity = String(s.hero12Opacity);
      if (captionWrapRef.current) captionWrapRef.current.style.opacity = String(s.captionOpacity);
      if (captionTextRef.current) {
        const next = BEAT_CAPTIONS[s.beat] ?? '';
        if (next !== lastCaption) {
          captionTextRef.current.textContent = next;
          lastCaption = next;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useJourneyTimeline({ scopeRef, stageRef, cameraRef, sceneRef, showMarkers });

  return (
    <div ref={scopeRef} className="journey-root">
      <div ref={stageRef} className="movie-stage">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{
            position: [initialCameraState.x, initialCameraState.y, initialCameraState.z],
            fov: initialCameraState.fov,
            near: 0.1,
            far: 100,
          }}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={['#d8a06a']} />
          <fog attach="fog" args={['#d8a06a', 12, 60]} />
          <CameraRig stateRef={cameraRef} />
          <Stage stateRef={sceneRef} />
        </Canvas>

        {/* ===== Hero title overlays (3 of them, opacity-driven) ===== */}
        <HeroTitle
          ref={hero02Ref}
          eyebrow="// FIRST RECOGNITION · OCT 2024"
          title="Trust earned."
          titleEm="earned"
          caption="OUTSTANDING AWARD · DELOITTE"
        />
        <HeroTitle
          ref={hero07Ref}
          eyebrow="// SHIPPED TO PRODUCTION · OCT 2025"
          title="Voice AI goes live."
          titleEm="live"
          caption="REAL-TIME VOICE ASSISTANT · HEALTHCARE CLIENT"
        />
        <HeroTitle
          ref={hero12Ref}
          eyebrow="// TODAY · JUN 1, 2026"
          title="Software Engineer I."
          titleEm="Engineer"
          caption="DELOITTE · STILL BUILDING"
        />

        {/* ===== Rolling bottom caption ===== */}
        <div ref={captionWrapRef} className="caption" style={{ opacity: 0 }}>
          <span ref={captionTextRef} />
        </div>

        {/* ===== Dev HUD ===== */}
        {showDevHud && (
          <div className="hud">
            <div className="hud-row">
              <span className="hud-label">BEAT</span>
              <span className="hud-value">{BEAT_NAMES[sceneRef.current.beat] ?? '—'}</span>
            </div>
            <div className="hud-row">
              <span className="hud-label">PROGRESS</span>
              <span className="hud-value">{(sceneRef.current.progress * 100).toFixed(1)}%</span>
            </div>
            <div className="hud-row">
              <span className="hud-label">CAMERA</span>
              <span className="hud-value">
                {cameraRef.current.x.toFixed(1)},{' '}
                {cameraRef.current.y.toFixed(1)},{' '}
                {cameraRef.current.z.toFixed(1)} · fov {cameraRef.current.fov.toFixed(0)}°
              </span>
            </div>
            <div className="hud-row">
              <span className="hud-label">LOOK AT</span>
              <span className="hud-value">
                {cameraRef.current.lookAtX.toFixed(2)},{' '}
                {cameraRef.current.lookAtY.toFixed(2)},{' '}
                {cameraRef.current.lookAtZ.toFixed(2)}
              </span>
            </div>
            <div className="hud-row">
              <span className="hud-label">GLOBE Y°</span>
              <span className="hud-value">
                {((sceneRef.current.globeRotationY * 180) / Math.PI).toFixed(1)}°
              </span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .journey-root { background: #060609; color: #fff; min-height: 100vh; }
        .movie-stage {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #060609;
        }
        .movie-stage canvas { display: block; width: 100% !important; height: 100% !important; }

        /* Rolling bottom caption (non-hero beats) */
        .caption {
          position: absolute;
          bottom: 8vh;
          left: 50%;
          transform: translateX(-50%);
          padding: 10px 22px;
          background: rgba(20,20,28,0.45);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,210,154,0.18);
          border-radius: 4px;
          font: 700 12px/1.4 'JetBrains Mono', monospace;
          letter-spacing: 0.22em;
          color: #ffd29a;
          text-transform: uppercase;
          z-index: 5;
          will-change: opacity;
          white-space: nowrap;
          pointer-events: none;
        }

        /* Dev HUD */
        .hud {
          position: absolute;
          top: 20px;
          right: 20px;
          padding: 12px 16px;
          background: rgba(20, 20, 28, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 210, 154, 0.18);
          border-radius: 6px;
          font: 500 11px/1.5 'JetBrains Mono', monospace;
          color: #c4b598;
          pointer-events: none;
          z-index: 10;
          min-width: 280px;
        }
        .hud-row { display: flex; gap: 12px; }
        .hud-label {
          font-weight: 700;
          letter-spacing: 0.18em;
          color: #ff9460;
          font-size: 9px;
          min-width: 75px;
          padding-top: 1px;
        }
        .hud-value { color: #ffd29a; }
      `}</style>
    </div>
  );
}
