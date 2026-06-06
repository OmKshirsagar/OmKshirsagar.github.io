import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

/**
 * Cinematic post-processing for /journey — kept light so the voxels stay CRISP.
 *  - Bloom: only the brightest highlights (lit windows / lamps / sign / Mumbai
 *    pin / sun) glow — high threshold so the pale dusk scene doesn't haze over
 *  - Vignette: subtle frame darkening
 *
 * (Depth-of-field was removed — its bokeh pass softened the whole image and
 *  made the hard-edged voxel look read as low-res/blurry.)
 */
export default function PostFX() {
  return (
    <EffectComposer multisampling={8}>
      <Bloom intensity={0.5} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur />
      <Vignette offset={0.3} darkness={0.55} eskil={false} />
    </EffectComposer>
  );
}
