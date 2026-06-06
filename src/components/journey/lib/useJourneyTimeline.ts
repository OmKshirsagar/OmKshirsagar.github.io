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
      const lenis = new Lenis({ smoothWheel: true, duration: 0.9 });
      const lenisRafCallback = (time: number): void => lenis.raf(time * 1000);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(lenisRafCallback);
      gsap.ticker.lagSmoothing(0);

      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut', duration: 1 },
        scrollTrigger: {
          trigger: stageRef.current,
          start: 'top top',
          end: '+=9000',
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

      return () => {
        gsap.ticker.remove(lenisRafCallback);
        lenis.destroy();
      };
    },
    { scope: scopeRef, dependencies: [showMarkers] },
  );
}
