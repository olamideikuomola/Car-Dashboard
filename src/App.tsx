import { useEffect, useState } from "react";
import { MotionProfileProvider, type MotionProfile } from "./motion/MotionProfileProvider";
import { Stage } from "./Stage";
import { TokenCheck } from "./scratch/TokenCheck";

export type Theme = "night" | "day";

export function App() {
  const [theme, setTheme] = useState<Theme>("night");
  const [profile, setProfile] = useState<MotionProfile>("expressive");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <MotionProfileProvider profile={profile}>
      <Stage>
        <TokenCheck
          theme={theme}
          profile={profile}
          onTheme={() => setTheme((t) => (t === "night" ? "day" : "night"))}
          onProfile={() => setProfile((p) => (p === "expressive" ? "calm" : "expressive"))}
        />
      </Stage>
    </MotionProfileProvider>
  );
}
