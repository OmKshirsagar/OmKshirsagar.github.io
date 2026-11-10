import { expect, test } from 'vitest';
import { boundSparkleAlpha } from '../../src/components/journey/Sparkles';

test('particle centers remain finite and alpha stays within blending range', () => {
  const shader = { fragmentShader: 'float strength = 0.05 / distanceToCenter - 0.1;' };
  boundSparkleAlpha(shader);
  const expression = shader.fragmentShader.match(/float strength = (.*);/)![1];
  const strength = new Function('distanceToCenter', 'max', 'clamp', `return ${expression}`);
  for (const distance of [0, 0.00001, 0.01, 0.1, 0.5, 0.71]) {
    const alpha = strength(distance, Math.max, (n: number, min: number, max: number) => Math.min(max, Math.max(min, n)));
    expect(Number.isFinite(alpha)).toBe(true);
    expect(alpha).toBeGreaterThanOrEqual(0);
    expect(alpha).toBeLessThanOrEqual(1);
  }
});
