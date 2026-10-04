/**
 * Map layer from Figma node 4:46, exported as SVG and rebuilt with colour tokens so it recolours
 * in place on theme change. Coordinates are the Navigation panel's (780 by 560).
 * Layers are kept apart (blocks, roads, route, puck) so later phases can pan, draw and rotate them.
 */

const BLOCK = (x: number, y0: number, w: number, y1: number) => {
  // Rounded blocks as exported: 10px radius across, about 13px down (the map is scaled 1.32 vertically).
  const rx = 10;
  const ry = 13.205;
  return `M${x + w - rx} ${y0}H${x + rx}C${x + rx - 5.5228} ${y0} ${x} ${y0 + ry * 0.4477} ${x} ${y0 + ry}V${y1 - ry}C${x} ${y1 - ry * 0.4477} ${x + rx - 5.5228} ${y1} ${x + rx} ${y1}H${x + w - rx}C${x + w - rx + 5.5228} ${y1} ${x + w} ${y1 - ry * 0.4477} ${x + w} ${y1 - ry}V${y0 + ry}C${x + w} ${y0 + ry * 0.4477} ${x + w - rx + 5.5228} ${y0} ${x + w - rx} ${y0}Z`;
};

const ROWS: [number, number][] = [
  [-50.1282, 147.949],
  [200.769, 385.641],
  [438.462, 623.333],
];
const COLS: [number, number][] = [
  [30, 220],
  [290, 190],
  [520, 250],
];

export const ROUTE_D = "M270 649.744V412.051H500V174.359H790";
export const ROADS_D = "M-10 174.359H790M-10 412.051H790M270 -89.7436V649.744M500 -89.7436V649.744";

export function MapView() {
  return (
    <svg className="map" width="780" height="560" viewBox="0 0 780 560" aria-hidden="true">
      <g className="map__world">
        {ROWS.map(([y0, y1], r) =>
          COLS.map(([x, w], c) => (
            <path
              key={`${r}-${c}`}
              d={BLOCK(x, y0, w, y1)}
              fill={r === 1 && c === 1 ? "var(--map-park)" : "var(--map-block)"}
            />
          )),
        )}
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
      </g>
      <g className="map__puck">
        <ellipse cx="270" cy="530.897" rx="18" ry="23.769" fill="var(--accent-default)" opacity={0.25} />
        <path d="M270 512.41L281 546.744L270 538.821L259 546.744L270 512.41Z" fill="var(--accent-default)" />
      </g>
    </svg>
  );
}
