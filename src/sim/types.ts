import type { DriveMode } from "../components/ModeSegment";
import type { MotionProfile } from "../motion/MotionProfileProvider";

export type Gear = "P" | "R" | "N" | "D";
export type Theme = "night" | "day";
export type Screen = "drive" | "health";
export type Dock = "nav" | "media" | "phone" | "car";
export type { DriveMode, MotionProfile };

export type Track = { id: number; title: string; subtitle: string; art: string };

export type Turn = { direction: "right" | "left"; road: string };

export type Tyres = { fl: number; fr: number; rl: number; rr: number };

/**
 * Discrete state: React renders from this. It only changes when a displayed value changes.
 * Anything that moves at tick rate (speed, distances, positions, progress) lives in `live`
 * motion values instead (see useVehicleSim.ts).
 */
export type VehicleState = {
  limit: number;
  gear: Gear;
  mode: DriveMode;
  battery: number;
  range: number;
  clock: string;
  outsideTemp: number;
  turn: Turn;
  /** Increments each time the car passes a turn, so the nav card can key its instruction. */
  turnIndex: number;
  arrive: string;
  minutesLeft: number;
  kmLeft: number;
  arrivalBattery: number;
  tyreAlert: boolean;
  serviceKm: number;
  track: Track;
  /** -1 previous, 1 next: which way the last track change went. */
  trackDir: 1 | -1;
  playing: boolean;
  tempDriver: number;
  tempPassenger: number;
  ac: boolean;
  fan: number;
  defrost: boolean;
  seatHeat: boolean;
  dock: Dock;
  tyres: Tyres;
  theme: Theme;
  screen: Screen;
  profile: MotionProfile;
  paused: boolean;
  /** Bumped by the demo panel to replay the wake-up sequence. */
  wakeKey: number;
};
