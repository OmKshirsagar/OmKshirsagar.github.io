import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

/**
 * Cinematic post-processing for /journey — kept light so the voxels stay CRISP.
 *  - Bloom: only the brightest highlights glow (high threshold)
 *  - Vignette: subtle frame darkening (desktop only)
 *
 * `low` (mobile/weak GPUs): drop MSAA to 0 and the vignette, soften bloom — the
 * 8x multisampling fullscreen pass is one of the biggest mobile costs.
 */
export default function PostFX({ low = false }: { low?: boolean }) {
  return (
    <EffectComposer multisampling={low ? 0 : 4}>
      <Bloom intensity={low ? 0.38 : 0.5} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur />
      {low ? <></> : <Vignette offset={0.3} darkness={0.55} eskil={false} />}
    </EffectComposer>
  );
}
