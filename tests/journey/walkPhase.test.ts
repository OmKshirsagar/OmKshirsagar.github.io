import { describe, it, expect } from 'vitest';
import { walkPose } from '../../src/components/journey/voxel/walkPose';

describe('walkPose', () => {
  it('phase 0: limbs neutral (near zero swing)', () => {
    const p = walkPose(0);
    expect(Math.abs(p.thighL)).toBeLessThan(0.05);
    expect(Math.abs(p.thighR)).toBeLessThan(0.05);
  });
  it('legs are in counter-phase (opposite signs at quarter stride)', () => {
    const p = walkPose(0.25);
    expect(Math.sign(p.thighL)).toBe(-Math.sign(p.thighR));
  });
  it('arms counter-swing to legs (armL opposes thighL)', () => {
    const p = walkPose(0.25);
    expect(Math.sign(p.armL)).toBe(-Math.sign(p.thighL));
  });
  it('bob is non-negative and small', () => {
    for (const t of [0, 0.25, 0.5, 0.75]) {
      const p = walkPose(t);
      expect(p.bob).toBeGreaterThanOrEqual(0);
      expect(p.bob).toBeLessThan(0.2);
    }
  });
});
