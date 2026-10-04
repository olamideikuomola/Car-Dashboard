import { useEffect, useState } from "react";
import { MotionProfileProvider, type MotionProfile } from "./motion/MotionProfileProvider";
import { Stage } from "./Stage";
import { TokenCheck } from "./scratch/TokenCheck";
import { Drive } from "./screens/Drive";
import { VehicleHealth } from "./screens/VehicleHealth";
import { figmaState, type Screen, type Theme } from "./sim/types";

const params = new URLSearchParams(window.location.search);

export function App() {
  const [theme, setTheme] = useState<Theme>(params.get("theme") === "day" ? "day" : "night");
  const [profile, setProfile] = useState<MotionProfile>("expressive");
  const [screen, setScreen] = useState<Screen>(params.get("screen") === "health" ? "health" : "drive");
  const scratch = params.get("scratch");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <MotionProfileProvider profile={profile}>
      <Stage>
        {scratch === "tokens" ? (
          <TokenCheck
            theme={theme}
            profile={profile}
            onTheme={() => setTheme((t) => (t === "night" ? "day" : "night"))}
            onProfile={() => setProfile((p) => (p === "expressive" ? "calm" : "expressive"))}
          />
        ) : screen === "drive" ? (
          <Drive s={figmaState} onOpenHealth={() => setScreen("health")} />
        ) : (
          <VehicleHealth s={figmaState} onBack={() => setScreen("drive")} />
        )}
      </Stage>
    </MotionProfileProvider>
  );
}
