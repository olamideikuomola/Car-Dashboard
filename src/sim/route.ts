/**
 * Route geometry shared by the simulator and the map. Coordinates are the map's
 * (Navigation panel space, 780 by 560 at rest), taken from the Figma route path
 * "M270 649.744V412.051H500V174.359H790".
 */

export type Pt = { x: number; y: number };

export const ROUTE_POINTS: Pt[] = [
  { x: 270, y: 649.744 },
  { x: 270, y: 412.051 },
  { x: 500, y: 412.051 },
  { x: 500, y: 174.359 },
  { x: 790, y: 174.359 },
  { x: 1080, y: 174.359 },
];

const segLen = ROUTE_POINTS.slice(1).map((p, i) => Math.hypot(p.x - ROUTE_POINTS[i].x, p.y - ROUTE_POINTS[i].y));
const cum = segLen.reduce<number[]>((acc, l) => [...acc, acc[acc.length - 1] + l], [0]);

export const ROUTE_LENGTH = cum[cum.length - 1];

/** Where the car puck sits in Figma (270, 530.897): this is distance 0 of the scripted drive. */
export const START_S = ROUTE_POINTS[0].y - 530.897;

/** The Figma frame says 400 m to the first turn from the puck, which fixes the map scale. */
export const M_PER_UNIT = 400 / (cum[1] - START_S);

/** Turns sit on the route's corners. Direction is relative to the heading before the corner. */
export const TURNS = [
  { s: cum[1], direction: "right" as const, road: "Harbour Road", limit: 70 },
  { s: cum[2], direction: "left" as const, road: "Quay Street", limit: 50 },
  { s: cum[3], direction: "right" as const, road: "Marina Way", limit: 50 },
];

/** Point and heading (degrees, 0 = north, clockwise) at distance s along the route. */
export function pointAt(s: number): Pt & { heading: number } {
  const clamped = Math.max(0, Math.min(ROUTE_LENGTH, s));
  let i = 0;
  while (i < segLen.length - 1 && clamped > cum[i + 1]) i++;
  const a = ROUTE_POINTS[i];
  const b = ROUTE_POINTS[i + 1];
  const t = segLen[i] === 0 ? 0 : (clamped - cum[i]) / segLen[i];
  const heading = (Math.atan2(b.x - a.x, a.y - b.y) * 180) / Math.PI;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, heading };
}

export const ROUTE_D = `M${ROUTE_POINTS.map((p) => `${p.x} ${p.y}`).join("L")}`;
