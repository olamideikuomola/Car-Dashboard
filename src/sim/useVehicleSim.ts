import { useEffect } from "react";
import { motionValue } from "motion/react";
import { create } from "zustand";
import type { DriveMode } from "../components/ModeSegment";
import { M_PER_UNIT, START_S, TURNS, pointAt } from "./route";
import type { Dock, Gear, MotionProfile, Screen, Theme, Track, Tyres, VehicleState } from "./types";
import { startWake } from "../motion/wake";
import { switchTheme } from "../motion/themeSwitch";

/* ------------------------------------------------------------------ */
/* Script                                                              */
/* ------------------------------------------------------------------ */

/** One loop of the scripted drive, in seconds. */
export const LOOP_S = 90;
/** Sim tick. Values are retargeted at this rate; springs in the UI fill the frames between. */
export const TICK_MS = 100;

const TRIP_KM = 12.4;
const TRIP_TOTAL_KM = 17.7;
const AVG_KMH = 41.3;
const KM_PER_BATTERY_PCT = 4;
const DRAIN_PCT_PER_M = 1 / 600;
const TRACK_S = 180;
const START_CLOCK_MIN = 8 * 60 + 24;
const LIMIT_START = 50;
const LIMIT_CYCLE = [30, 50, 70, 90];

const ACCEL = 2.2 * 3.6; // km/h per second
const BRAKE = 3 * 3.6;
const PARK_BRAKE = 6 * 3.6;
const COAST = 0.5 * 3.6;

export const MODE_RANGE: Record<DriveMode, number> = { Eco: 1.08, Comfort: 1, Sport: 0.88 };

export const TRACKS: Track[] = [
  { id: 0, title: "Night Drive", subtitle: "Coastline FM · Radio", art: "var(--art-gradient)" },
  { id: 1, title: "Harbour Lights", subtitle: "Mara Quinn · Low Tide", art: "linear-gradient(130deg, #5bc98a 10%, #1f6fd1 60%, #141518 100%)" },
  { id: 2, title: "Slow Signal", subtitle: "The Ferrymen · Northbound", art: "linear-gradient(130deg, #7db7f0 10%, #6c5bd9 55%, #e46a4e 100%)" },
];

/** Target speed for the scripted cruise, before turn caps and the gear are applied. */
function cruiseTarget(t: number, limit: number) {
  if (sim.fromRest && t < 1.5) return 0;
  if (t >= 80) return 0; // stopping at the lights before the loop restarts
  if (t >= 50 && t < 58) return 79; // the stretch over the limit
  return limit >= 70 ? 66 : 48;
}

/** Slow for the next turn: 22 km/h at the corner, opening up over the last 150 m. */
const turnCap = (m: number) => (m < 150 ? 22 + m * 0.35 : Infinity);

const fmtClock = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/* ------------------------------------------------------------------ */
/* Live values (60Hz consumers read these, never React state)          */
/* ------------------------------------------------------------------ */

export const live = {
  /** km/h, raw sim value. The UI smooths it with spring-value. */
  speed: motionValue(48),
  /** Metres to the next turn. */
  turnDistance: motionValue((TURNS[0].s - START_S) * M_PER_UNIT),
  /** Distance along the route, in map units. */
  routeS: motionValue(START_S),
  /** NOW to HOME, 0 to 1. */
  tripProgress: motionValue(1 - TRIP_KM / TRIP_TOTAL_KM),
  /** Current track, 0 to 1. */
  trackProgress: motionValue(165 / 392),
};

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

type Internal = {
  t: number;
  elapsed: number;
  speed: number;
  s: number;
  battery: number;
  kmLeft: number;
  turnIdx: number;
  overUntil: number;
  trackClock: number;
  /** False on the session's first pass (already cruising, as in Figma); true after each stop and loop. */
  fromRest: boolean;
  savedBattery: number;
};

const sim: Internal = {
  t: 0,
  elapsed: 0,
  speed: 48,
  s: START_S,
  battery: 78,
  kmLeft: TRIP_KM,
  turnIdx: 0,
  overUntil: -1,
  trackClock: (165 / 392) * TRACK_S,
  fromRest: false,
  savedBattery: 78,
};

type Actions = {
  setGear: (g: Gear) => void;
  setMode: (m: DriveMode) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setScreen: (s: Screen) => void;
  setProfile: (p: MotionProfile) => void;
  togglePaused: () => void;
  toggleLowBattery: () => void;
  addStop: () => void;
  bookService: () => void;
  remindLater: () => void;
  wake: () => void;
  newLimit: () => void;
  overLimit: () => void;
  approachTurn: () => void;
  setTyreAlert: (on: boolean) => void;
  changeTrack: (dir: 1 | -1) => void;
  togglePlaying: () => void;
  stepTemp: (side: "driver" | "passenger", delta: number) => void;
  toggleAc: () => void;
  cycleFan: () => void;
  toggleDefrost: () => void;
  toggleSeatHeat: () => void;
  setDock: (d: Dock) => void;
};

const params = new URLSearchParams(window.location.search);

const derived = (battery: number, mode: DriveMode, kmLeft: number, elapsed: number) => {
  const minutesLeft = Math.max(0, Math.round((kmLeft / AVG_KMH) * 60));
  const clockMin = START_CLOCK_MIN + Math.floor(elapsed / 60);
  return {
    battery: Math.round(battery),
    range: Math.round(battery * KM_PER_BATTERY_PCT * MODE_RANGE[mode]),
    kmLeft: Math.round(kmLeft * 10) / 10,
    minutesLeft,
    clock: fmtClock(clockMin),
    arrive: fmtClock(clockMin + minutesLeft),
    arrivalBattery: Math.max(0, Math.round(battery - kmLeft * 0.32)),
  };
};

const healthyTyres: Tyres = { fl: 2.6, fr: 2.6, rl: 2.6, rr: 2.6 };

export const useVehicle = create<VehicleState & Actions>()((set, get) => ({
  limit: LIMIT_START,
  gear: "D",
  mode: "Comfort",
  ...derived(sim.battery, "Comfort", sim.kmLeft, 0),
  outsideTemp: 14,
  turn: { direction: TURNS[0].direction, road: TURNS[0].road },
  turnIndex: 0,
  tyreAlert: true,
  serviceKm: 1200,
  track: TRACKS[0],
  trackDir: 1,
  playing: true,
  tempDriver: 21.5,
  tempPassenger: 22,
  ac: true,
  fan: 2,
  defrost: false,
  seatHeat: false,
  dock: "nav",
  tyres: { ...healthyTyres, fl: 2.1 },
  theme: params.get("theme") === "day" ? "day" : "night",
  screen: params.get("screen") === "health" ? "health" : "drive",
  profile: "expressive",
  paused: false,
  wakeKey: 0,
  stopAdded: false,
  serviceBooked: null,
  reminded: false,

  setGear: (gear) => set({ gear }),
  setMode: (mode) => set({ mode, range: Math.round(sim.battery * KM_PER_BATTERY_PCT * MODE_RANGE[mode]) }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => {
    const next = get().theme === "night" ? "day" : "night";
    switchTheme(next, get().profile === "calm", () => set({ theme: next }));
  },
  setScreen: (screen) => set({ screen }),
  setProfile: (profile) => set({ profile }),
  togglePaused: () => set({ paused: !get().paused }),
  toggleLowBattery: () => {
    if (sim.battery >= 20) {
      sim.savedBattery = sim.battery;
      sim.battery = 18;
    } else {
      sim.battery = sim.savedBattery;
    }
    const st = get();
    set({ battery: Math.round(sim.battery), range: Math.round(sim.battery * KM_PER_BATTERY_PCT * MODE_RANGE[st.mode]) });
  },
  addStop: () => set({ stopAdded: !get().stopAdded }),
  bookService: () => set({ serviceBooked: "Thu 9 Oct, 09:30" }),
  remindLater: () => set({ reminded: true }),
  wake: () => {
    startWake();
    set({ wakeKey: get().wakeKey + 1 });
  },
  newLimit: () => {
    const i = LIMIT_CYCLE.indexOf(get().limit);
    set({ limit: LIMIT_CYCLE[(i + 1) % LIMIT_CYCLE.length] });
  },
  overLimit: () => {
    if (get().gear !== "D") set({ gear: "D" });
    sim.overUntil = sim.elapsed + 6;
  },
  approachTurn: () => {
    // Put the car 140 m before the next turn so the countdown runs through 100 m.
    sim.s = TURNS[sim.turnIdx].s - 140 / M_PER_UNIT;
    if (get().gear !== "D") set({ gear: "D" });
    sim.speed = Math.max(sim.speed, 40);
  },
  setTyreAlert: (on) => set({ tyreAlert: on, tyres: on ? { ...healthyTyres, fl: 2.1 } : healthyTyres }),
  changeTrack: (dir) => {
    const n = TRACKS.length;
    sim.trackClock = 0;
    live.trackProgress.set(0);
    set({ track: TRACKS[(get().track.id + dir + n) % n], trackDir: dir });
  },
  togglePlaying: () => set({ playing: !get().playing }),
  stepTemp: (side, delta) => {
    const key = side === "driver" ? "tempDriver" : "tempPassenger";
    const next = Math.min(28, Math.max(16, get()[key] + delta));
    set({ [key]: next } as Pick<VehicleState, typeof key>);
  },
  toggleAc: () => set({ ac: !get().ac }),
  cycleFan: () => set({ fan: (get().fan % 5) + 1 }),
  toggleDefrost: () => set({ defrost: !get().defrost }),
  toggleSeatHeat: () => set({ seatHeat: !get().seatHeat }),
  setDock: (dock) => set({ dock }),
}));

/* ------------------------------------------------------------------ */
/* Tick                                                                */
/* ------------------------------------------------------------------ */

function approach(v: number, target: number, up: number, down: number, dt: number) {
  return v < target ? Math.min(target, v + up * dt) : Math.max(target, v - down * dt);
}

function resetLoop() {
  sim.t = 0;
  sim.fromRest = true;
  sim.s = START_S;
  sim.kmLeft = TRIP_KM;
  sim.turnIdx = 0;
  sim.overUntil = -1;
  live.routeS.jump(START_S);
  const st = useVehicle.getState();
  useVehicle.setState({
    limit: LIMIT_START,
    turn: { direction: TURNS[0].direction, road: TURNS[0].road },
    turnIndex: st.turnIndex + 1,
  });
}

function tick(dt: number) {
  const st = useVehicle.getState();
  sim.elapsed += dt;

  // Speed target from gear and script.
  let target: number;
  let down = BRAKE;
  const toTurn = (TURNS[sim.turnIdx].s - sim.s) * M_PER_UNIT;
  if (st.gear === "D") {
    sim.t += dt;
    const cruise = sim.elapsed < sim.overUntil ? st.limit + 12 : cruiseTarget(sim.t, st.limit);
    target = Math.min(cruise, turnCap(toTurn));
  } else if (st.gear === "R") {
    target = 6;
  } else if (st.gear === "P") {
    target = 0;
    down = PARK_BRAKE;
  } else {
    target = 0;
    down = COAST;
  }
  sim.speed = approach(sim.speed, target, ACCEL, down, dt);

  // Position. Reverse moves the car back along the route.
  const metres = (sim.speed / 3.6) * dt;
  const dir = st.gear === "R" ? -1 : 1;
  sim.s = Math.max(START_S - 40, sim.s + (dir * metres) / M_PER_UNIT);
  if (dir > 0) {
    sim.kmLeft = Math.max(0, sim.kmLeft - metres / 1000);
    sim.battery = Math.max(5, sim.battery - metres * DRAIN_PCT_PER_M);
  }

  // Passing a turn: next instruction, and the new road's limit.
  const patch: Partial<VehicleState> = {};
  if (sim.turnIdx < TURNS.length - 1 && sim.s >= TURNS[sim.turnIdx].s) {
    patch.limit = TURNS[sim.turnIdx].limit;
    sim.turnIdx += 1;
    patch.turn = { direction: TURNS[sim.turnIdx].direction, road: TURNS[sim.turnIdx].road };
    patch.turnIndex = st.turnIndex + 1;
  }

  // Media.
  if (st.playing) {
    sim.trackClock += dt;
    if (sim.trackClock >= TRACK_S) st.changeTrack(1);
    else live.trackProgress.set(sim.trackClock / TRACK_S);
  }
  const prevT = sim.t - (st.gear === "D" ? dt : 0);
  if (prevT < 60 && sim.t >= 60) st.changeTrack(1);

  // Live values.
  live.speed.set(sim.speed);
  live.routeS.set(sim.s);
  live.turnDistance.set(Math.max(0, (TURNS[sim.turnIdx].s - sim.s) * M_PER_UNIT));
  live.tripProgress.set(1 - sim.kmLeft / TRIP_TOTAL_KM);

  // Discrete values: only write the store when something displayed changed.
  const d = derived(sim.battery, st.mode, sim.kmLeft, sim.elapsed);
  for (const k of Object.keys(d) as (keyof typeof d)[]) {
    if (d[k] !== st[k]) (patch as Record<string, unknown>)[k] = d[k];
  }
  if (Object.keys(patch).length) useVehicle.setState(patch);

  if (sim.t >= LOOP_S) resetLoop();
}

/** Mount once, at the app root. Runs the scripted drive while not paused. */
export function useVehicleSim() {
  const paused = useVehicle((s) => s.paused);
  useEffect(() => {
    if (paused) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      // Clamp so a backgrounded tab doesn't teleport the car when it returns.
      tick(Math.min(0.5, (now - last) / 1000));
      last = now;
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [paused]);
}

/** Point and heading of the car right now, for one-off reads. */
export const carPose = () => pointAt(live.routeS.get());
