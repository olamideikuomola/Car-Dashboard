/**
 * Shared element between the Drive vehicle card and the Vehicle health panel. The stage is
 * scaled to fit the window, so rects are kept in stage pixels (unscaled), which is what the
 * clip-path morph in VehicleHealth animates in.
 */
export type StageRect = { x: number; y: number; w: number; h: number };

/** The card's resting rect from Figma, used until the card has been measured. */
let cardRect: StageRect = { x: 1456, y: 24, w: 440, h: 204 };

/** The control that opened Vehicle health, so Back can return focus to it. */
let opener: "alert" | "link" | null = null;
export const setOpener = (o: "alert" | "link") => void (opener = o);
export function takeOpener() {
  const o = opener;
  opener = null;
  return o;
}

export function rememberCardRect(el: Element) {
  const stage = el.closest(".stage");
  if (!stage) return;
  const s = stage.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const k = s.width / 1920;
  cardRect = { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k };
}

export const getCardRect = () => cardRect;
