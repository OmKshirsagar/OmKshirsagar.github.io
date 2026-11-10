import { Sparkles as DreiSparkles } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { ComponentProps } from 'react';

export function boundSparkleAlpha(shader: { fragmentShader: string }): void {
  // Drei 9's center singularity produces NaN colors when blended into HDR bloom.
  shader.fragmentShader = shader.fragmentShader.replace(
    '0.05 / distanceToCenter - 0.1',
    'clamp(0.05 / max(distanceToCenter, 0.001) - 0.1, 0.0, 1.0)',
  );
}

export function Sparkles(props: ComponentProps<typeof DreiSparkles>) {
  const dpr = useThree((state) => state.viewport.dpr);
  return (
    <DreiSparkles {...props}>
      <sparklesImplMaterial transparent depthWrite={false} pixelRatio={dpr} onBeforeCompile={boundSparkleAlpha} />
    </DreiSparkles>
  );
}
