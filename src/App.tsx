import { useEffect } from "react";
import { MotionProfileProvider } from "./motion/MotionProfileProvider";
import { Stage } from "./Stage";
import { TokenCheck } from "./scratch/TokenCheck";
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <MotionProfileProvider profile={profile}>
      <Stage>{scratch === "tokens" ? <TokenCheckBound /> : screen === "drive" ? <Drive /> : <VehicleHealth />}</Stage>
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
