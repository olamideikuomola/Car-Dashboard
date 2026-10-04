import { motion, useTransform } from "motion/react";
import { M_PER_UNIT, ROUTE_D, START_S, pointAt } from "../sim/route";
import { live } from "../sim/useVehicleSim";

/**
 * Map layer from Figma node 4:46, rebuilt with colour tokens so it recolours in place on theme
 * change. Coordinates are the Navigation panel's (780 by 560). The Figma blocks stay exactly
 * where they were; the grid continues beyond them so the map can pan with the car.
 */

const RX = 10;
const RY = 13.205; // the Figma map is scaled 1.32 vertically, so block corners are elliptical

function block(x0: number, x1: number, y0: number, y1: number) {
  const k = 0.4477;
  return `M${x1 - RX} ${y0}H${x0 + RX}C${x0 + RX * k} ${y0} ${x0} ${y0 + RY * k} ${x0} ${y0 + RY}V${y1 - RY}C${x0} ${y1 - RY * k} ${x0 + RX * k} ${y1} ${x0 + RX} ${y1}H${x1 - RX}C${x1 - RX * k} ${y1} ${x1} ${y1 - RY * k} ${x1} ${y1 - RY}V${y0 + RY}C${x1} ${y0 + RY * k} ${x1 - RX * k} ${y0} ${x1 - RX} ${y0}Z`;
}

// Figma's blocks: three columns and three rows, with roads at x 270, 500 and y 174.359, 412.051.
// The grid continues right and up (the directions the route travels) so the map can pan; the extra
// roads sit just outside the panel at rest so the resting frame still matches Figma.
const COLS: [number, number][] = [[30, 250], [290, 480], [520, 770], [830, 1060], [1100, 1330]];
const ROAD_X = [270, 500, 800, 1080];
const ROAD_Y = [-327.4, -76.54, 174.359, 412.051, 649.744, 887.4];
const GAP_Y = 26.41; // block edge to road centre, from Figma (147.949 to 174.359)

const BLOCKS = COLS.flatMap(([x0, x1]) =>
  ROAD_Y.slice(0, -1).map((y, j) => ({
    d: block(x0, x1, y + GAP_Y, ROAD_Y[j + 1] - GAP_Y),
    park: x0 === 290 && y === 174.359,
  })),
);
const ROADS_D = [
  ...ROAD_X.map((x) => `M${x} ${ROAD_Y[0] - 40}V${ROAD_Y[ROAD_Y.length - 1] + 40}`),
  ...ROAD_Y.map((y) => `M-10 ${y}H${COLS[COLS.length - 1][1] + 40}`),
].join("");

/**
 * Where the car sits on screen. Figma parks the puck at (270, 531), which is under the trip card,
 * so the resting frame keeps that and the anchor eases into the open map between the two cards
 * over the first 80 m of travel. Both are panel coordinates.
 */
const REST = pointAt(START_S);
const VIEW = { x: REST.x, y: 330 }; // same x, so the map's left edge never comes into view
const BLEND_M = 80;
const smooth = (t: number) => t * t * (3 - 2 * t);

export function anchorAt(s: number) {
  const k = smooth(Math.min(1, Math.max(0, ((s - START_S) * M_PER_UNIT) / BLEND_M)));
  return { x: REST.x + (VIEW.x - REST.x) * k, y: REST.y + (VIEW.y - REST.y) * k };
}

export function MapView() {
  const worldTransform = useTransform(live.routeS, (s) => {
    const p = pointAt(s);
    const a = anchorAt(s);
    return `translate(${a.x - p.x}px, ${a.y - p.y}px)`;
  });
  const puckTransform = useTransform(live.routeS, (s) => {
    const a = anchorAt(s);
    return `translate(${a.x}px, ${a.y}px) rotate(${pointAt(s).heading}deg)`;
  });

  return (
    <svg className="map" width="780" height="560" viewBox="0 0 780 560" aria-hidden="true">
      <motion.g className="map__world" style={{ transform: worldTransform }}>
        {BLOCKS.map((b, i) => (
          <path key={i} d={b.d} fill={b.park ? "var(--map-park)" : "var(--map-block)"} />
        ))}
        <path d={ROADS_D} stroke="var(--map-road)" strokeWidth={34.8615} fill="none" />
        <path
          className="map__route"
          d={ROUTE_D}
          stroke="var(--accent-default)"
          strokeWidth={15.8462}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </motion.g>
      <motion.g className="map__puck" style={{ transform: puckTransform }}>
        <ellipse cx="0" cy="0" rx="18" ry="23.769" fill="var(--accent-default)" opacity={0.25} />
        {/* Outline added (not in Figma): the arrow is accent on an accent route and disappears without it. */}
        <path
          d="M0 -18.487L11 15.847L0 7.924L-11 15.847L0 -18.487Z"
          fill="var(--accent-default)"
          stroke="var(--surface-panel)"
          strokeWidth={3}
          strokeLinejoin="round"
          paintOrder="stroke"
        />
      </motion.g>
    </svg>
  );
}
