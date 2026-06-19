import { Canvas } from '@react-three/fiber';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { SheetProvider } from '@theatre/r3f';
import { Perf } from 'r3f-perf';
import { Leva } from 'leva';
import CameraRig from './CameraRig';
import Stage from './Stage';
import PostFX from './PostFX';
import HeroTitle from './HeroTitle';
import JourneyLoader from './JourneyLoader';
import { journeySheet, initJourneyStudio } from './lib/theatre';
import {
  BEAT_CAPTIONS,
  BEAT_NAMES,
  initialCameraState,
  initialSceneState,
} from './lib/state';
import { useJourneyTimeline } from './lib/useJourneyTimeline';

const DEV = import.meta.env.DEV;

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
  const fadeBlackRef = useRef<HTMLDivElement>(null);
  const comingSoonRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const degreeRef = useRef<HTMLDivElement>(null);

  const showDevHud = DEV;
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
      if (fadeBlackRef.current) fadeBlackRef.current.style.opacity = String(s.fadeBlack);
      if (comingSoonRef.current) comingSoonRef.current.style.opacity = String(s.comingSoonOpacity);
      if (scrollHintRef.current) scrollHintRef.current.style.opacity = String(Math.max(0, 1 - s.progress * 60));
      if (degreeRef.current) {
        const f = s.degreeFlip;
        degreeRef.current.style.opacity = String(Math.min(1, f * 1.4));
        degreeRef.current.style.transform =
          `perspective(1500px) rotateX(${(1 - f) * 82}deg) scale(${0.66 + 0.34 * f})`;
      }
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

  // Theatre.js Studio (dev-only visual editor + gizmos for placing objects).
  useEffect(() => {
    void initJourneyStudio();
  }, []);

  // ---- mobile/perf budget: cap DPR, drop shadows + heavy MSAA on phones ----
  const [perf] = useState(() => {
    if (typeof window === 'undefined') return { mobile: false, dpr: [1, 2] as [number, number] };
    const mobile = (window.matchMedia?.('(pointer: coarse)').matches ?? false) || window.innerWidth < 820;
    return { mobile, dpr: (mobile ? [1, 1.3] : [1, 1.75]) as [number, number] };
  });

  return (
    <div ref={scopeRef} className="journey-root">
      {/* 0->100 boot loader (sits above the canvas; hooks DefaultLoadingManager) */}
      <JourneyLoader />
      {/* leva live-tuning panel (dev only; hidden in production) */}
      <Leva hidden={!DEV} collapsed />
      <div ref={stageRef} className="movie-stage">
        <Canvas
          shadows={!perf.mobile}
          dpr={perf.dpr}
          camera={{
            position: [initialCameraState.x, initialCameraState.y, initialCameraState.z],
            fov: initialCameraState.fov,
            near: 0.1,
            far: 100,
          }}
          gl={{ antialias: !perf.mobile, alpha: false, powerPreference: 'high-performance' }}
        >
          <CameraRig stateRef={cameraRef} />
          <SheetProvider sheet={journeySheet()}>
            <Stage stateRef={sceneRef} />
          </SheetProvider>
          <PostFX low={perf.mobile} />
          {DEV && <Perf position="bottom-left" />}
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

        {/* ===== Scroll-to-begin hint (first frame; fades as you scroll) ===== */}
        <div ref={scrollHintRef} className="scroll-hint">
          <span className="sh-label">Scroll to begin the journey</span>
          <span className="sh-mouse"><span className="sh-wheel" /></span>
          <span className="sh-chevrons"><i /><i /></span>
        </div>

        {/* ===== Full-screen black wipe for hard scene cuts ===== */}
        <div ref={fadeBlackRef} className="fade-black" style={{ opacity: 0 }} />

        {/* ===== Graduation degree — flips up to fill the screen ===== */}
        <div ref={degreeRef} className="degree" style={{ opacity: 0 }}>
          <div className="degree-card">
            <div className="degree-seal">U</div>
            <div className="degree-uni">University of Mumbai</div>
            <div className="degree-uni-mr">मुंबई विद्यापीठ</div>
            <div className="degree-rule" />
            <div className="degree-body">
              This is to certify that
              <div className="degree-name">OM KSHIRSAGAR</div>
              of Jai Hind College, Churchgate, has been awarded the degree of
              <div className="degree-deg">Bachelor of Science — Information Technology</div>
              in the First Class with Distinction · CGPA 9.89 / 10
            </div>
            <div className="degree-foot">
              <span>Convocation · Mumbai</span>
              <span className="degree-sign">conferred 2023</span>
            </div>
          </div>
        </div>

        {/* ===== End-of-(shipped)-journey "more coming soon" card ===== */}
        <div ref={comingSoonRef} className="coming-soon" style={{ opacity: 0 }}>
          <div className="cs-eyebrow">// THE JOURNEY · TO BE CONTINUED</div>
          <div className="cs-title">More <em>coming soon</em></div>
          <div className="cs-sub">
            The rest of the story — first projects, the outstanding award, real-time voice AI,
            and the road ahead — is being built.
          </div>
          <div className="cs-hint">↑ scroll up to replay</div>
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

        /* Full-screen black wipe (hard cuts between scene locations) */
        .fade-black {
          position: absolute;
          inset: 0;
          background: #000;
          z-index: 6;
          will-change: opacity;
          pointer-events: none;
        }

        /* "More coming soon" end card (sits above the black wipe) */
        .coming-soon {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 14px;
          padding: 0 8vw;
          z-index: 7;
          will-change: opacity;
          pointer-events: none;
          background: radial-gradient(circle at 50% 45%, rgba(28,26,38,0.0) 0%, #060609 75%);
        }
        .cs-eyebrow {
          font: 700 12px/1.4 'JetBrains Mono', monospace;
          letter-spacing: 0.32em;
          color: #ff9460;
          text-transform: uppercase;
        }
        .cs-title {
          font: 800 clamp(38px, 7vw, 88px)/1.05 'Inter', system-ui, sans-serif;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .cs-title em { color: #ffd29a; font-style: normal; }
        .cs-sub {
          max-width: 620px;
          font: 400 clamp(14px, 1.6vw, 18px)/1.6 'Inter', system-ui, sans-serif;
          color: #b9b2a4;
        }
        .cs-hint {
          margin-top: 10px;
          font: 600 11px/1.4 'JetBrains Mono', monospace;
          letter-spacing: 0.22em;
          color: #6f6a5e;
          text-transform: uppercase;
        }

        /* Scroll-to-begin hint on the opening frame */
        .scroll-hint {
          position: absolute;
          bottom: 6vh;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          z-index: 8;
          will-change: opacity;
          pointer-events: none;
        }
        .sh-label {
          font: 600 12px/1.4 'JetBrains Mono', monospace;
          letter-spacing: 0.26em;
          color: #ffd29a;
          text-transform: uppercase;
        }
        .sh-mouse {
          width: 24px;
          height: 38px;
          border: 2px solid rgba(255,210,154,0.7);
          border-radius: 13px;
          display: flex;
          justify-content: center;
          padding-top: 6px;
        }
        .sh-wheel {
          width: 3px;
          height: 7px;
          border-radius: 2px;
          background: #ffd29a;
          animation: sh-wheel 1.5s ease-in-out infinite;
        }
        .sh-chevrons { display: flex; flex-direction: column; align-items: center; margin-top: -4px; }
        .sh-chevrons i {
          width: 9px; height: 9px;
          border-right: 2px solid rgba(255,210,154,0.7);
          border-bottom: 2px solid rgba(255,210,154,0.7);
          transform: rotate(45deg);
          margin-top: -3px;
          animation: sh-bounce 1.5s ease-in-out infinite;
        }
        .sh-chevrons i:nth-child(2) { animation-delay: 0.18s; opacity: 0.6; }
        @keyframes sh-wheel { 0% { transform: translateY(0); opacity: 1; } 70% { transform: translateY(12px); opacity: 0; } 100% { opacity: 0; } }
        @keyframes sh-bounce { 0%, 100% { transform: rotate(45deg) translate(0,0); } 50% { transform: rotate(45deg) translate(2px,2px); } }

        /* Graduation degree certificate (flips up to fill the screen) */
        .degree {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 7;
          transform-origin: center 60%;
          will-change: opacity, transform;
          pointer-events: none;
        }
        .degree-card {
          width: min(66vw, 760px);
          aspect-ratio: 1.42 / 1;
          background: linear-gradient(160deg, #fdf6e6 0%, #f2e7cd 100%);
          border: 3px solid #8e2b2b;
          outline: 5px solid #b9933f;
          outline-offset: 4px;
          border-radius: 3px;
          box-shadow: 0 36px 90px rgba(0,0,0,0.6), inset 0 0 0 2px #b9933f;
          padding: clamp(16px, 2.6vw, 38px) clamp(24px, 5vw, 66px);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          color: #3a2a1a;
          font-family: Georgia, 'Times New Roman', serif;
        }
        .degree-seal {
          width: 50px; height: 50px; border-radius: 50%;
          border: 3px solid #8e2b2b; color: #8e2b2b;
          display: grid; place-items: center;
          font: 800 26px/1 Georgia, serif; margin-bottom: 4px;
        }
        .degree-uni { font-size: clamp(22px, 3.4vw, 40px); font-weight: 800; color: #7a1f1f; }
        .degree-uni-mr { font-size: clamp(13px, 1.8vw, 20px); color: #8e2b2b; margin-top: 2px; }
        .degree-rule { width: 58%; height: 2px; background: #b9933f; margin: 9px 0 13px; }
        .degree-body { font-size: clamp(12px, 1.5vw, 17px); line-height: 1.65; color: #4a3623; max-width: 92%; }
        .degree-name { font-size: clamp(18px, 2.4vw, 28px); font-weight: 800; color: #243a7a; margin: 5px 0; letter-spacing: 0.04em; }
        .degree-deg { font-size: clamp(14px, 2vw, 22px); font-weight: 700; color: #7a1f1f; margin: 5px 0; }
        .degree-foot { margin-top: auto; padding-top: 12px; width: 100%; display: flex; justify-content: space-between; font-size: clamp(10px, 1.2vw, 13px); color: #6a553a; letter-spacing: 0.05em; }
        .degree-sign { font-style: italic; }

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
