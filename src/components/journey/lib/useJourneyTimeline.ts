import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { type MutableRefObject, type RefObject } from 'react';
import type { CameraState, SceneState } from './state';

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
 * Plan 3 slice: a single voxel scene — the Jai Hind College approach.
 * Camera establishes high+far, descends and pushes in, then tracks voxel-Om
 * as he walks the path toward the arched entrance; golden-hour hold on the arch.
 *
 * The timeline only mutates plain JS refs (cameraRef.current / sceneRef.current);
 * all 3D reads happen in useFrame loops so React never re-renders during scroll.
 */
export function useJourneyTimeline(args: Args): void {
  const { scopeRef, stageRef, cameraRef, sceneRef, showMarkers = false } = args;

  useGSAP(
    () => {
      // 1. Lenis smooth scroll
      const lenis = new Lenis({ smoothWheel: true, duration: 0.9 });
      const lenisRafCallback = (time: number): void => lenis.raf(time * 1000);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(lenisRafCallback);
      gsap.ticker.lagSmoothing(0);

      // 2. Master timeline pinned to .movie-stage
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut', duration: 1 },
        scrollTrigger: {
          trigger: stageRef.current,
          start: 'top top',
          end: '+=5500',
          scrub: 0.4,
          pin: true,
          pinType: 'transform',
          anticipatePin: 1,
          markers: showMarkers,
          onUpdate: (self) => {
            sceneRef.current.progress = self.progress;
            sceneRef.current.beat = 1; // single Jai Hind scene -> caption/HUD index 1
          },
        },
      });

      const cam = cameraRef.current;
      const scene = sceneRef.current;

      // ====================================================================
      // SCENE · Jai Hind College approach (voxel)
      // World units: ground spans X[-10,10] Z[-12.8,12.8]; facade at z=-9
      // (front faces +Z). Om walks the path from z=+9 (far, near camera) to
      // z=-3 (near the entrance). Camera follows from behind/side.
      // CameraState fields: x,y,z,lookAtX,lookAtY,lookAtZ,fov
      // ====================================================================

      // Initial state (also set so reverse-scroll to 0 is correct)
      gsap.set(cam, { x: 0, y: 4.5, z: 12, lookAtX: 0, lookAtY: 1.5, lookAtZ: -4, fov: 50 });
      scene.characterX = 0;
      scene.characterZ = 9;
      scene.characterRotationY = Math.PI; // face -Z (his walking direction)
      scene.characterOpacity = 1;
      scene.collegeVisible = 1;
      scene.crowdVisible = 1;
      scene.omWalkPhase = 0;
      scene.signGlow = 1;
      scene.captionOpacity = 0;

      tl.addLabel('jh-start', 0)
        // Establishing descent + push-in toward the building
        .to(cam, { y: 2.2, z: 8, lookAtY: 1.4, fov: 45, duration: 2, ease: 'power2.inOut' }, 0)
        // Caption fades up
        .to(scene, { captionOpacity: 1, duration: 0.6 }, 0.4)
        // Om walks: drive walk-cycle (8 strides) + advance position z9 -> z-3
        .to(scene, { omWalkPhase: 8, duration: 6, ease: 'none' }, 0)
        .to(scene, { characterZ: -3, duration: 6, ease: 'power1.inOut' }, 0)
        // Camera tracks Om to a 3/4 hero framing (move to his side)
        .to(
          cam,
          { x: 4, z: 2, y: 1.8, lookAtX: 0, lookAtY: 1.2, lookAtZ: -6, duration: 4, ease: 'power1.inOut' },
          2,
        )
        // Sign glow pulse near arrival
        .to(scene, { signGlow: 1.4, duration: 1, yoyo: true, repeat: 1 }, 5)
        // Settle into a 3/4 hero of Om arriving, facade + arch behind him
        // (do NOT dive through Om — he ends at z=-3, arch is at z~-8.4).
        .to(
          cam,
          {
            x: 3.2,
            z: 1.0,
            y: 1.9,
            lookAtX: 0.2,
            lookAtY: 1.2,
            lookAtZ: -4.5,
            fov: 40,
            duration: 2,
            ease: 'power2.inOut',
          },
          6,
        );

      // Cleanup runs on unmount via useGSAP
      return () => {
        gsap.ticker.remove(lenisRafCallback);
        lenis.destroy();
      };
    },
    { scope: scopeRef, dependencies: [showMarkers] },
  );
}
