import { useLayoutEffect, useState, type ReactNode } from "react";

export const STAGE_W = 1920;
export const STAGE_H = 720;
/** Breathing room either side of the stage, so it never hugs the window edge. Matches .stage-viewport. */
export const STAGE_GUTTER_X = 40;

/** The 1920 by 720 canvas, scaled to fit the window (less a 40px gutter each side) while keeping its aspect ratio. */
export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const fit = () => setScale(Math.min((window.innerWidth - STAGE_GUTTER_X * 2) / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="stage-viewport">
      <div className="stage-frame" style={{ width: STAGE_W * scale, height: STAGE_H * scale }}>
        <div className="stage" style={{ transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
