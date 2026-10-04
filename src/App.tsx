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
          // Drive stays mounted under Vehicle health (no rebuild on Back); Health mounts on top.
          <>
            <DriveLayer shown={screen === "drive"}>
              <Drive key={wakeKey} />
            </DriveLayer>
            <AnimatePresence initial={false}>{screen === "health" && <VehicleHealth key="health" />}</AnimatePresence>
          </>
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

/**
 * Drive fades out under the expanding card and back in under the shrinking one. While hidden it
 * stays mounted but is invisible and inert: no paint, no focus, nothing to rebuild on Back.
 */
function DriveLayer({ shown, children }: { shown: boolean; children: ReactNode }) {
  return (
    <motion.div
      className="screen-layer screen-layer--drive"
      initial={false}
      animate={shown ? { opacity: 1, visibility: "visible" } : { opacity: 0, transitionEnd: { visibility: "hidden" } }}
      transition={tween("normal")}
      inert={!shown}
    >
      {children}
    </motion.div>
  );
}
