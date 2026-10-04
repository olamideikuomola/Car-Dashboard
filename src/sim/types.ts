import type { DriveMode } from "../components/ModeSegment";

export type Gear = "P" | "R" | "N" | "D";
export type Theme = "night" | "day";
export type Screen = "drive" | "health";
export type Dock = "nav" | "media" | "phone" | "car";

export type Track = { title: string; subtitle: string; art: string };

export type Turn = { direction: "right" | "left"; road: string };

export type Tyres = { fl: number; fr: number; rl: number; rr: number };

/** Everything the Drive and Vehicle health screens render. */
export type VehicleState = {
  speed: number;
  limit: number;
  gear: Gear;
  mode: DriveMode;
  battery: number;
  range: number;
  clock: string;
  outsideTemp: number;
  turnDistance: number;
  turn: Turn;
  arrive: string;
  minutesLeft: number;
  kmLeft: number;
  arrivalBattery: number;
  routeProgress: number;
  tyreAlert: boolean;
  serviceKm: number;
  track: Track;
  trackProgress: number;
  playing: boolean;
  tempDriver: number;
  tempPassenger: number;
  ac: boolean;
  fan: number;
  defrost: boolean;
  seatHeat: boolean;
  dock: Dock;
  tyres: Tyres;
};

/** The exact state drawn in the Figma frames Drive / Night (4:2) and Vehicle health (5:186). */
export const figmaState: VehicleState = {
  speed: 64,
  limit: 70,
  gear: "D",
  mode: "Comfort",
  battery: 78,
  range: 312,
  clock: "08:24",
  outsideTemp: 14,
  turnDistance: 400,
  turn: { direction: "right", road: "Harbour Road" },
  arrive: "08:42",
  minutesLeft: 18,
  kmLeft: 12.4,
  arrivalBattery: 74,
  routeProgress: 1,
  tyreAlert: true,
  serviceKm: 1200,
  track: { title: "Night Drive", subtitle: "Coastline FM · Radio", art: "var(--art-gradient)" },
  trackProgress: 165 / 392,
  playing: true,
  tempDriver: 21.5,
  tempPassenger: 22,
  ac: true,
  fan: 2,
  defrost: false,
  seatHeat: false,
  dock: "nav",
  tyres: { fl: 2.1, fr: 2.6, rl: 2.6, rr: 2.6 },
};
