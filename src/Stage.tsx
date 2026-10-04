import { useLayoutEffect, useState, type ReactNode } from "react";

export const STAGE_W = 1920;
export const STAGE_H = 720;

/** The 1920 by 720 canvas, scaled to fit the window while keeping its aspect ratio. */
export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
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
