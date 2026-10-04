import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { tween } from "./motion/tokens";
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
        {scratch === "tokens" ? (
          <TokenCheckBound />
        ) : scratch === "primitives" ? (
          <Primitives />
        ) : (
          // Both screens overlap during the shared-card transition; Health always stacks above Drive.
          <AnimatePresence initial={false}>
            {screen === "drive" ? (
              <DriveLayer key="drive">
                <Drive key={wakeKey} />
              </DriveLayer>
            ) : (
              <VehicleHealth key="health" />
            )}
          </AnimatePresence>
        )}
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

/** Drive fades out under the expanding card, and back in under the shrinking one. */
function DriveLayer({ children }: { children: ReactNode }) {
  return (
    <motion.div className="screen-layer screen-layer--drive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={tween("normal")}>
      {children}
    </motion.div>
  );
}
