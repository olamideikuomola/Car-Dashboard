/**
 * Theme change. A soft horizontal wipe crosses the screen (View Transitions: the new theme is
 * revealed behind a moving mask edge), so every colour swaps through the theme tokens behind it
 * and the map recolours in place. Calm or reduced motion: a plain crossfade at duration-short.
 * Without View Transitions support the theme swaps instantly.
 */
export function switchTheme(next: "night" | "day", calm: boolean, commit: () => void) {
  const root = document.documentElement;
  const reduced = calm || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const apply = () => {
    root.dataset.carTheme = next;
    commit();
  };
  if (!("startViewTransition" in document)) {
    apply();
    return;
  }
  root.dataset.themeFx = reduced ? "fade" : "wipe";
  const vt = document.startViewTransition(apply);
  vt.finished.finally(() => {
    delete root.dataset.themeFx;
  });
}
