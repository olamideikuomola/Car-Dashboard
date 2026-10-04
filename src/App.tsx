import { useEffect } from "react";
import { MotionProfileProvider } from "./motion/MotionProfileProvider";
import { Stage } from "./Stage";
import { TokenCheck } from "./scratch/TokenCheck";
import { Primitives } from "./scratch/Primitives";
import { Drive } from "./screens/Drive";
import { VehicleHealth } from "./screens/VehicleHealth";
import { DemoPanel } from "./demo/DemoPanel";
import { useVehicle, useVehicleSim } from "./sim/useVehicleSim";

const scratch = new URLSearchParams(window.location.search).get("scratch");

export function App() {
  useVehicleSim();
  const theme = useVehicle((s) => s.theme);
  const profile = useVehicle((s) => s.profile);
  const screen = useVehicle((s) => s.screen);
  const wakeKey = useVehicle((s) => s.wakeKey);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <MotionProfileProvider profile={profile}>
      <Stage>
        {scratch === "tokens" ? <TokenCheckBound /> : scratch === "primitives" ? <Primitives /> : screen === "drive" ? <Drive key={wakeKey} /> : <VehicleHealth />}
      </Stage>
      <DemoPanel />
    </MotionProfileProvider>
  );
}

function TokenCheckBound() {
  const s = useVehicle();
  return (
    <TokenCheck
      theme={s.theme}
      profile={s.profile}
      onTheme={s.toggleTheme}
      onProfile={() => s.setProfile(s.profile === "expressive" ? "calm" : "expressive")}
    />
  );
}
