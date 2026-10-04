import { createContext, useContext, useEffect, type ReactNode } from "react";
import { MotionConfig, useReducedMotion } from "motion/react";

export type MotionProfile = "expressive" | "calm";

type MotionPrefs = {
  profile: MotionProfile;
  /** True when the OS asks for reduced motion or the calm profile is on. Treat both the same. */
  reduced: boolean;
};

const MotionPrefsContext = createContext<MotionPrefs>({ profile: "expressive", reduced: false });

/**
 * Wraps the app in MotionConfig. `reducedMotion="user"` follows the OS setting; the calm profile
 * forces "always" so it behaves exactly like reduced motion. It also writes data-motion on <html>
 * so CSS transitions collapse to fades through the --move-* variables.
 */
export function MotionProfileProvider({ profile, children }: { profile: MotionProfile; children: ReactNode }) {
  const osReduced = useReducedMotion() ?? false;
  const reduced = osReduced || profile === "calm";

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
  }, [reduced]);

  return (
    <MotionPrefsContext.Provider value={{ profile, reduced }}>
      <MotionConfig reducedMotion={profile === "calm" ? "always" : "user"}>{children}</MotionConfig>
    </MotionPrefsContext.Provider>
  );
}

export function useMotionPrefs() {
  return useContext(MotionPrefsContext);
}
