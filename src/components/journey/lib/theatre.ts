// Theatre.js setup for the /journey cinematic — DEV-ONLY authoring.
//
// In development we initialize Theatre Studio (the visual editor) + the R3F
// extension, so we can drag/position scene objects with gizmos and keyframe
// animation. The edited values persist to Theatre's project state, which we can
// later export to a `state.json` and load in production (without Studio).
//
// The existing GSAP + Lenis scroll camera is left untouched — Theatre is used
// here for OBJECT PLACEMENT (the thing we keep hand-tuning), not the camera.
import { getProject, type ISheet } from '@theatre/core';

let _sheet: ISheet | undefined;

/** The single sheet that holds all journey editable objects. */
export function journeySheet(): ISheet {
  if (!_sheet) {
    _sheet = getProject('Journey').sheet('Journey');
  }
  return _sheet;
}

let _studioStarted = false;

/** Initialize Theatre Studio + the R3F gizmo extension (dev only, browser only). */
export async function initJourneyStudio(): Promise<void> {
  if (_studioStarted) return;
  if (typeof window === 'undefined') return;
  if (!import.meta.env.DEV) return; // never ship the editor to production
  _studioStarted = true;
  const studio = (await import('@theatre/studio')).default;
  const extension = (await import('@theatre/r3f/dist/extension')).default;
  studio.initialize();
  studio.extend(extension);
}
