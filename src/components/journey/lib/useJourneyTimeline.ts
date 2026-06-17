import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { type MutableRefObject, type RefObject } from 'react';
import type { CameraState, SceneState } from './state';
import { MUMBAI_FACING_ROTATION_Y } from '../scenes/Scene01Globe';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface Args {
  scopeRef: RefObject<HTMLDivElement>;
  stageRef: RefObject<HTMLDivElement>;
  cameraRef: MutableRefObject<CameraState>;
  sceneRef: MutableRefObject<SceneState>;
  showMarkers?: boolean;
}

/**
 * Master GSAP timeline + Lenis smooth scroll for the /journey movie.
 *
 * The full descent, in 4 phases:
 *   A. EARTH       — photoreal globe spins + camera flies in to Mumbai
 *   B. CLOUD DIVE  — globe fades, sky warms to dusk, camera dives through clouds
 *   C. CITY FLYOVER— voxel Mumbai skyline + mountains revealed, camera sweeps in
 *   D. COLLEGE WALK— voxel-Om walks the path to the Jai Hind facade
 *
 * Only mutates plain JS refs (cameraRef/sceneRef); R3F reads them in useFrame
 * so React never re-renders during scroll.
 */
export function useJourneyTimeline(args: Args): void {
  const { scopeRef, stageRef, cameraRef, sceneRef, showMarkers = false } = args;

  useGSAP(
    () => {
      // Mobile address-bar show/hide resizes the viewport and makes the pinned
      // ScrollTrigger jump — tell GSAP to ignore that resize.
      ScrollTrigger.config({ ignoreMobileResize: true });

      // Touch devices: let GSAP own/normalize scrolling (kills the address-bar
      // jank + the Lenis-vs-pin "vibration"). Desktop keeps Lenis smoothing.
      const isTouch =
        typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches ?? false);
      let cleanupScroll = (): void => {};
      if (isTouch) {
        ScrollTrigger.normalizeScroll(true);
        cleanupScroll = () => {
          ScrollTrigger.normalizeScroll(false);
        };
      } else {
        const lenis = new Lenis({ smoothWheel: true, duration: 0.9 });
        const raf = (time: number): void => lenis.raf(time * 1000);
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
        cleanupScroll = () => {
          gsap.ticker.remove(raf);
          lenis.destroy();
        };
      }

      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut', duration: 1 },
        scrollTrigger: {
          trigger: stageRef.current,
          start: 'top top',
          end: '+=21000',
          scrub: 0.5,
          pin: true,
          pinType: 'transform',
          anticipatePin: 1,
          markers: showMarkers,
          onUpdate: (self) => {
            sceneRef.current.progress = self.progress;
          },
        },
      });

      const cam = cameraRef.current;
      const scene = sceneRef.current;

      // ---- Initial state: deep space, looking at the Earth ----
      gsap.set(cam, { x: 0, y: 3.0, z: 11, lookAtX: 0, lookAtY: 1.6, lookAtZ: 0, fov: 45 });
      Object.assign(scene, {
        beat: 0,
        globeVisible: 1,
        globeRotationY: 0,
        skyWarmth: 0,
        cloudsVisible: 0,
        cityVisible: 0,
        collegeVisible: 0,
        characterOpacity: 0,
        characterX: 0,
        characterZ: 9,
        characterRotationY: Math.PI,
        omWalkPhase: 0,
        signGlow: 1,
        captionOpacity: 0,
      });

      // ====================================================================
      // PHASE A · EARTH (t 0 -> 3)
      // ====================================================================
      tl.addLabel('earth', 0)
        .to(
          scene,
          { globeRotationY: 2 * Math.PI + MUMBAI_FACING_ROTATION_Y, duration: 3, ease: 'power2.out' },
          0,
        )
        .fromTo(
          cam,
          { x: 0, y: 3.0, z: 11, lookAtX: 0, lookAtY: 1.6, lookAtZ: 0, fov: 45 },
          {
            x: 0, y: 2.27, z: 4.3, lookAtX: 0, lookAtY: 2.27, lookAtZ: 1.93, fov: 32,
            duration: 3, ease: 'power2.inOut',
          },
          0,
        )
        .to(scene, { captionOpacity: 1, duration: 0.5 }, 2.2); // "MUMBAI · INDIA"

      // ====================================================================
      // PHASE B · CLOUD DIVE (t 3 -> 5.5)
      // Globe fades, sky warms to dusk, camera cuts to high city-sky and dives
      // through the voxel clouds (cloud cover masks the world swap).
      // ====================================================================
      tl.addLabel('dive', 3)
        // sky starts warming a touch early — reads as entering the atmosphere,
        // so the clouds never appear on a hard black sky
        .to(scene, { skyWarmth: 1, duration: 1.8, ease: 'power1.inOut' }, 2.6)
        .to(scene, { globeVisible: 0, captionOpacity: 0, duration: 0.6 }, 3.0)
        .to(scene, { cloudsVisible: 1, duration: 0.4 }, 3.0)
        .set(cam, { x: -6, y: 60, z: 34, lookAtX: 10, lookAtY: 26, lookAtZ: -14, fov: 58 }, 3.2)
        .to(
          cam,
          { x: -8, y: 34, z: 20, lookAtX: 10, lookAtY: 12, lookAtZ: -22, duration: 2.3, ease: 'power1.in' },
          3.2,
        )
        .to(scene, { cityVisible: 1, duration: 0.6 }, 3.9);

      // ====================================================================
      // PHASE C · CITY FLYOVER (t 5.5 -> 8)
      // Sweep down along the Marine Drive coast — city on the left, the bay +
      // ocean filling the right — toward the college.
      // ====================================================================
      tl.addLabel('city', 5.5)
        .to(
          cam,
          {
            x: -8, y: 16, z: 13, lookAtX: 14, lookAtY: 3, lookAtZ: -32, fov: 56,
            duration: 2.5, ease: 'power1.inOut',
          },
          5.5,
        );

      // ====================================================================
      // PHASE D · COLLEGE WALK (t 8 -> end)
      // College + Om fade up; camera settles to the walk start; Om walks in.
      // ====================================================================
      tl.addLabel('college', 8)
        .to(scene, { collegeVisible: 1, characterOpacity: 1, duration: 0.6 }, 7.9)
        .set(scene, { beat: 1 }, 8) // "2024 · JAI HIND COLLEGE · CHURCHGATE"
        .to(
          cam,
          {
            x: 0, y: 5.0, z: 15, lookAtX: 0, lookAtY: 1.6, lookAtZ: -5, fov: 50,
            duration: 1.6, ease: 'power2.inOut',
          },
          8,
        )
        .to(scene, { captionOpacity: 1, duration: 0.6 }, 8.4)
        // establishing push-in (stays well behind Om as he sets off)
        .to(cam, { y: 3.4, z: 13, lookAtY: 1.5, lookAtZ: -6, fov: 47, duration: 2, ease: 'power2.inOut' }, 9.8)
        // Om walks the path (8 strides) z9 -> z-3
        .to(scene, { omWalkPhase: 8, duration: 6, ease: 'none' }, 9.8)
        .to(scene, { characterZ: -3, duration: 6, ease: 'power1.inOut' }, 9.8)
        // camera tracks to a 3/4 hero framing (Om now mid/near path, kept at distance)
        .to(
          cam,
          {
            x: 5, z: 6, y: 2.6, lookAtX: 0, lookAtY: 1.2, lookAtZ: -7,
            duration: 4, ease: 'power1.inOut',
          },
          11.8,
        )
        // sign glow pulse near arrival
        .to(scene, { signGlow: 1.4, duration: 1, yoyo: true, repeat: 1 }, 14.8)
        // settle into the hero arrival shot
        .to(
          cam,
          {
            x: 3.2, z: 1.0, y: 1.9, lookAtX: 0.2, lookAtY: 1.2, lookAtZ: -4.5, fov: 40,
            duration: 2, ease: 'power2.inOut',
          },
          15.8,
        );

      // ====================================================================
      // PHASE E · PUBLISHED PAPER (t 18 -> 23) — interior desk, hard cut
      // Fade to black, teleport to the warm study; the laptop reveals the
      // "PUBLISHED PAPER / JETIR 2022" card; hold; fade back to black.
      // ====================================================================
      tl.addLabel('paper', 18)
        .to(scene, { captionOpacity: 0, duration: 0.4 }, 17.6)
        .to(scene, { fadeBlack: 1, duration: 0.6, ease: 'power1.in' }, 17.8)
        // --- at black: teleport into the interior ---
        .set(scene, {
          interior: 1, paperVisible: 1, paperReveal: 0,
          collegeVisible: 0, characterOpacity: 0, gradVisible: 0, beat: 2,
        }, 18.4)
        .set(cam, {
          x: 1.8, y: 42.6, z: 8.0, lookAtX: -1.0, lookAtY: 41.3, lookAtZ: 0, fov: 42,
        }, 18.4)
        .to(scene, { fadeBlack: 0, duration: 0.8, ease: 'power1.out' }, 18.4)
        .to(scene, { captionOpacity: 1, duration: 0.5 }, 19.2)
        // screen card reveal + slow push-in on the laptop
        .to(scene, { paperReveal: 1, duration: 1.8, ease: 'power2.out' }, 19.6)
        .to(
          cam,
          {
            x: 0.6, y: 42.1, z: 5.6, lookAtX: -1.1, lookAtY: 41.15, lookAtZ: 0.1, fov: 36,
            duration: 2.8, ease: 'power1.inOut',
          },
          19.4,
        )
        .to({}, { duration: 0.8 }) // hold on the published card
        .to(scene, { captionOpacity: 0, duration: 0.4 }, 22.4)
        .to(scene, { fadeBlack: 1, duration: 0.6, ease: 'power1.in' }, 22.6);

      // ====================================================================
      // PHASE F · GRADUATION (t 23.2 -> ~31) — back outdoors at the college
      // Om turns to face the camera, dons gown + cap + diploma; the graduate
      // crowd, tossed caps and golden fireworks appear; celebratory push-in.
      // ====================================================================
      tl.addLabel('grad', 23.2)
        // --- at black: teleport back to the college, restore the hero ---
        .set(scene, {
          interior: 0, paperVisible: 0, paperReveal: 0,
          collegeVisible: 1, characterOpacity: 1,
          characterX: 0, characterZ: -3, characterRotationY: Math.PI,
          gradVisible: 0, signGlow: 1, beat: 3,
        }, 23.2)
        .set(cam, {
          x: 3.2, y: 1.9, z: 1.0, lookAtX: 0.2, lookAtY: 1.2, lookAtZ: -4.5, fov: 40,
        }, 23.2)
        .to(scene, { fadeBlack: 0, duration: 0.8, ease: 'power1.out' }, 23.2)
        // turn Om to face the camera + don the graduation kit
        .to(scene, { characterRotationY: 0, duration: 1.2, ease: 'power2.inOut' }, 24)
        .to(scene, { gradVisible: 1, duration: 1.0 }, 24.3)
        // swing round to a celebratory front view, elevated over the crowd
        .to(
          cam,
          {
            x: 0, y: 5.0, z: 14, lookAtX: 0, lookAtY: 2.4, lookAtZ: -3, fov: 50,
            duration: 2.4, ease: 'power2.inOut',
          },
          24,
        )
        // slow push-in on grad-Om holding the diploma aloft
        .to(
          cam,
          { y: 3.6, z: 9, lookAtY: 2.2, fov: 44, duration: 3, ease: 'power1.inOut' },
          26.6,
        )
        // the held degree FLIPS up and fills the screen (Mumbai University · BSc IT)
        .to(scene, { degreeFlip: 1, duration: 1.1, ease: 'power2.out' }, 27.0)
        // hold on the moment (caps + fireworks animate via useFrame)
        .to({}, { duration: 1.8 })
        .to(scene, { degreeFlip: 0, duration: 0.6, ease: 'power1.in' }, 30.6);

      // ====================================================================
      // PHASE G · JOINING DELOITTE (t 31.5 -> 37) — bright-day glass tower
      // Fade to black, cut to the plaza; Om (now in a blue lanyard) steps out
      // of the revolving door toward camera. Sky shifts to bright blue day.
      // ====================================================================
      tl.addLabel('deloitte', 31.5)
        .to(scene, { captionOpacity: 0, duration: 0.4 }, 31.0)
        .to(scene, { fadeBlack: 1, duration: 0.6, ease: 'power1.in' }, 31.2)
        .set(scene, {
          gradVisible: 0, collegeVisible: 0, cityVisible: 0, cloudsVisible: 0,
          interior: 0, dayBlue: 0, skyWarmth: 1,
          deloitteVisible: 1, badgeVisible: 0, characterOpacity: 1,
          characterX: 0, characterZ: -2.6, characterRotationY: 0, omWalkPhase: 0, beat: 4,
        }, 31.8)
        .set(cam, { x: 0, y: 3.4, z: 11, lookAtX: 0, lookAtY: 2.3, lookAtZ: -6, fov: 52 }, 31.8)
        .to(scene, { fadeBlack: 0, duration: 0.8, ease: 'power1.out' }, 31.8)
        .to(scene, { captionOpacity: 1, duration: 0.5 }, 32.6)
        // Om walks out toward camera (ends close = hero close-up)
        .to(scene, { omWalkPhase: 4, duration: 3, ease: 'none' }, 32.8)
        .to(scene, { characterZ: -0.2, duration: 3, ease: 'power1.inOut' }, 32.8)
        .to(cam, { y: 1.75, z: 4.6, lookAtY: 1.7, lookAtZ: -3, fov: 42, duration: 3.2, ease: 'power2.inOut' }, 32.8)
        .to({}, { duration: 0.9 });

      // ====================================================================
      // PHASE H · DELOITTE OFFICE MONTAGE (t 37 -> ~64)
      // One evolving office; the monitor content, captions, hero cards, trophy,
      // waveform and confetti change per career beat. Interior lives at y≈60.
      // ====================================================================
      const OY = 60; // office world-Y offset
      tl.addLabel('office', 37)
        .to(scene, { captionOpacity: 0, duration: 0.4 }, 36.4)
        .to(scene, { fadeBlack: 1, duration: 0.6, ease: 'power1.in' }, 36.5)
        .set(scene, {
          deloitteVisible: 0, trainingVisible: 1, officeVisible: 0, officeScreen: 1, characterOpacity: 0,
          trophyReveal: 0, waveLevel: 0, confetti: 0, beat: 5,
        }, 37.1)
        .set(cam, { x: 1.5, y: OY + 3.4, z: 5.5, lookAtX: -1.0, lookAtY: OY + 2.3, lookAtZ: -6.5, fov: 52 }, 37.1)
        .to(scene, { fadeBlack: 0, duration: 0.8, ease: 'power1.out' }, 37.1)

        // --- Beat 5 · Training (Feb 2024) · SHOT 11 React-basics training room ---
        .to(scene, { captionOpacity: 1, duration: 0.5 }, 37.9)
        .to(cam, { x: 0.6, y: OY + 3.0, z: 3.6, lookAtX: -1.4, lookAtY: OY + 2.1, lookAtZ: -7.0, fov: 50, duration: 2.4, ease: 'power2.inOut' }, 38)
        .to({}, { duration: 1.2 })

        // --- OUTRO · "more coming soon" — ship the journey up to Training; the
        //     rest of the career arc (award → voice AI → promotion) is WIP. ---
        .to(scene, { captionOpacity: 0, duration: 0.4 }, 40.8)
        .to(scene, { fadeBlack: 1, duration: 1.0, ease: 'power1.in' }, 41.2)
        .set(scene, { trainingVisible: 0 }, 42.3)
        .to(scene, { comingSoonOpacity: 1, duration: 0.9, ease: 'power1.out' }, 42.5)
        .to({}, { duration: 2.4 });

      return () => {
        cleanupScroll();
      };
    },
    { scope: scopeRef, dependencies: [showMarkers] },
  );
}
