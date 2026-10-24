// The wheel's shape as numbers, so it can be tested. Each category is a sector of equal angle;
// its radius grows with its score from 0 to 1.
export const SIZE = 340;
export const CENTRE = SIZE / 2;
export const RADIUS = 116;
export const HUB = 44;

// The start and end angle of sector i of n, in degrees, from the top, clockwise
export const sectorAngles = (i: number, n: number): { start: number; end: number; middle: number } => {
  const step = 360 / n;
  const start = i * step;
  return { start, end: start + step, middle: start + step / 2 };
};

const polar = (angle: number, radius: number) => {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: CENTRE + radius * Math.cos(rad), y: CENTRE + radius * Math.sin(rad) };
};

// The sector as a path at full radius. The wheel scales the path from the centre to show the score.
export const sectorPath = (i: number, n: number): string => {
  const { start, end } = sectorAngles(i, n);
  const a = polar(start, RADIUS);
  const b = polar(end, RADIUS);
  const large = end - start > 180 ? 1 : 0;
  return `M ${CENTRE} ${CENTRE} L ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)} Z`;
};

// Where a label sits, just outside the sector
export const labelPosition = (i: number, n: number) => {
  const { middle } = sectorAngles(i, n);
  return polar(middle, RADIUS + 22);
};

// The radius of a score, between the hub and the rim
export const scoreRadius = (score: number): number => HUB + (RADIUS - HUB) * Math.min(1, Math.max(0, score));
