import { describe, expect, it } from 'vitest';
import { glassFrom, paletteFrom } from '../palette';

describe('Liquid Glass tokens', () => {
  // the same values as the app's main.css (--glass-liquid-*, --glass-blur)
  it('uses the app values for light and dark', () => {
    expect(glassFrom({ theme: 'light' })).toEqual({ fill: 'rgba(255,255,255,0.5)', edge: 'rgba(255,255,255,0.7)', blur: 'blur(16px) saturate(180%)', shadow: '0 8px 24px rgba(0,0,0,0.12)' });
    expect(glassFrom({ theme: 'dark' })).toEqual({ fill: 'rgba(40,40,44,0.45)', edge: 'rgba(255,255,255,0.22)', blur: 'blur(16px) saturate(180%)', shadow: '0 8px 24px rgba(0,0,0,0.5)' });
  });
});

describe('danger colour', () => {
  it('is in the fallback palette, so no screen needs a fixed red', () => {
    expect(paletteFrom({ theme: 'light' }).danger).toBe('#D70015');
    expect(paletteFrom({ theme: 'dark' }).danger).toBe('#FF6961');
  });
});
