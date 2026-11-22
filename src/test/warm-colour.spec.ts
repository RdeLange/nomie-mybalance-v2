import { describe, expect, it } from 'vitest';
import { displayColour, glassFrom, setColourPrefs } from '../palette';

// The warm tones the app passes (the same values as the app's WARM_TONE_HEX, light)
const TONES = {
  sage: '#bfd3b5', teal: '#afd3ce', blue: '#b9cbe8', lavender: '#d5cae8',
  rose: '#ebc6c6', clay: '#edc6ae', sand: '#eadfc2', stone: '#d9d3c8',
};

describe('a configured colour as it is shown', () => {
  it('is the stored colour when the app sends no warm tones', () => {
    setColourPrefs({ colours: { current: {} } });
    expect(displayColour('#FF9500')).toBe('#FF9500');
  });

  it('is the warm tone of its hue when the app sends warm tones', () => {
    setColourPrefs({ colours: { warmTones: TONES } });
    expect(displayColour('#FF9500')).toBe(TONES.clay); // orange
    expect(displayColour('#0000FF')).toBe(TONES.blue);
    expect(displayColour('#FF0000')).toBe(TONES.rose);
    expect(displayColour('#00FF00')).toBe(TONES.sage);
    expect(displayColour('#800080')).toBe(TONES.lavender);
    expect(displayColour('#FFFF00')).toBe(TONES.sand);
    expect(displayColour('#808080')).toBe(TONES.stone);
  });

  it('leaves a value it cannot read as it is', () => {
    setColourPrefs({ colours: { warmTones: TONES } });
    expect(displayColour('tomato')).toBe('tomato');
  });
});

describe('the glass the app sends', () => {
  it('is used when the app sends it, and the built-in values otherwise', () => {
    const glass = { fill: 'rgba(250, 250, 248, 0.6)', edge: 'rgba(255, 255, 255, 0.8)', blur: 'blur(16px) saturate(180%)', shadow: '0 8px 24px rgba(0, 0, 0, 0.12)' };
    expect(glassFrom({ theme: 'light', colours: { glass } })).toEqual(glass);
    expect(glassFrom({ theme: 'dark' }).fill).toBe('rgba(40,40,44,0.45)');
  });
});
