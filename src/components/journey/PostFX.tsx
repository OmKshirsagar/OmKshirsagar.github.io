import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing';

/**
 * Cinematic post-processing for /journey:
 *  - Bloom    : makes the lit windows, street lamps, the JAI HIND sign and the
 *               Mumbai pin glow; lifts the golden-hour highlights
 *  - DoF      : gentle depth-of-field so distant skyline/mountains soften while
 *               the hero (near/mid) stays sharp — the "render" look
 *  - Vignette : subtle frame darkening to focus the eye
 *
 * Tuned conservatively; bokeh is small so the walking hero never goes soft.
 */
export default function PostFX() {
  return (
    <EffectComposer multisampling={4}>
      <DepthOfField focusDistance={0.018} focalLength={0.05} bokehScale={1.6} height={480} />
      <Bloom intensity={0.65} luminanceThreshold={0.68} luminanceSmoothing={0.28} mipmapBlur />
      <Vignette offset={0.3} darkness={0.6} eskil={false} />
    </EffectComposer>
  );
}
