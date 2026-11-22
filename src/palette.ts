// The colours the app gives the plugin. When the app is older, the plugin uses its own light and dark values.
export type Palette = { page: string; card: string; text: string; textSecondary: string; separator: string; fill: string; tint: string; onTint: string; tintSoft: string; good: string; goodSoft: string; danger: string; onDanger: string };

const LIGHT: Palette = { page: '#F2F2F7', card: '#FFFFFF', text: '#000000', textSecondary: '#636368', separator: '#D8D8DC', fill: '#E5E5EA', tint: '#0A6CC9', onTint: '#FFFFFF', tintSoft: '#EBF4FD', good: '#1E7A34', goodSoft: '#DDF3E2', danger: '#D70015', onDanger: '#FFFFFF' };
const DARK: Palette = { page: '#000000', card: '#1C1C1E', text: '#FFFFFF', textSecondary: '#AEAEB2', separator: '#48484A', fill: '#3A3A3C', tint: '#4DB3FF', onTint: '#000000', tintSoft: '#0B2236', good: '#30D158', goodSoft: '#123620', danger: '#FF6961', onDanger: '#000000' };

export const paletteFrom = (prefs: any): Palette => {
  const colours = prefs?.colours;
  if (colours?.current) return colours.current as Palette;
  return prefs?.theme === 'dark' ? DARK : LIGHT;
};

// Liquid Glass (D-glass): the same values as the app's --glass-liquid-* and --glass-blur tokens in main.css.
// They are not part of the app's colour palette, so the plugin picks them by the theme the app sends.
export type Glass = { fill: string; edge: string; blur: string; shadow: string };
const GLASS_LIGHT: Glass = { fill: 'rgba(255,255,255,0.5)', edge: 'rgba(255,255,255,0.7)', blur: 'blur(16px) saturate(180%)', shadow: '0 8px 24px rgba(0,0,0,0.12)' };
const GLASS_DARK: Glass = { fill: 'rgba(40,40,44,0.45)', edge: 'rgba(255,255,255,0.22)', blur: 'blur(16px) saturate(180%)', shadow: '0 8px 24px rgba(0,0,0,0.5)' };

// The glass the app sends (prefs.colours.glass); an older app does not send it, so the values above are used.
export const glassFrom = (prefs: any): Glass => prefs?.colours?.glass ?? (prefs?.theme === 'dark' ? GLASS_DARK : GLASS_LIGHT);

// The app's warm tones, for the palette in use (prefs.colours.warmTones). Only set when the app's warm palette is on.
let colourPrefs: any = undefined
export const setColourPrefs = (prefs: any) => {
  colourPrefs = prefs
}

// A configured colour as it is shown: the same colour with the warm palette off. With it on, the warm tone of the
// colour's hue (the app's rule: greys are stone, reds rose, oranges clay, yellows sand, greens sage, teal, blue, lavender).
// The stored colour is never changed here.
export const displayColour = (colour: string): string => {
  const tones = colourPrefs?.colours?.warmTones
  const match = /^#?([0-9a-f]{6})$/i.exec(colour || '')
  if (!tones || !match) return colour
  const n = parseInt(match[1], 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const l = (max + min) / 2
  if (d === 0) return tones.stone
  const sat = d / (1 - Math.abs(2 * l - 1))
  if (sat < 0.12) return tones.stone
  let hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  hue *= 60
  if (hue < 0) hue += 360
  if (hue < 20 || hue >= 330) return tones.rose
  if (hue < 45) return tones.clay
  if (hue < 70) return tones.sand
  if (hue < 165) return tones.sage
  if (hue < 200) return tones.teal
  if (hue < 255) return tones.blue
  return tones.lavender
}

// Danger as text (a delete or a warning on a grey fill): the app's red is 4.29:1 on #E5E5EA in light mode, so the text uses a darker red
// in light mode and a lighter red in dark mode. Both reach 4.5:1 on the fill. Buttons keep the palette's danger.
export const dangerTextFrom = (prefs: any): string => (prefs?.theme === 'dark' ? '#FF8A84' : '#B0001A');
