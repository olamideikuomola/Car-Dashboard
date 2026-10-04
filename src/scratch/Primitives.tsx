import { useRef, useState } from "react";
import { motionValue } from "motion/react";
import { Icon } from "../components/icons/Icon";
import { RollingNumber } from "../primitives/RollingNumber";
import { SpringBar } from "../primitives/SpringBar";
import { SharedIndicator } from "../primitives/SharedIndicator";
import { PressScale } from "../primitives/PressScale";
import { MorphIcon } from "../primitives/MorphIcon";
import { DrawPath } from "../primitives/DrawPath";
import { live, useVehicle } from "../sim/useVehicleSim";
import { useMotionPrefs } from "../motion/MotionProfileProvider";
import "./primitives-scratch.css";

const GEARS = ["P", "R", "N", "D"] as const;
const MODES = ["Eco", "Comfort", "Sport"] as const;
const ROUTE = "M40 190V125H200V40H380";
const RING = "M42 4A38 38 0 1 1 41.99 4";

/** Phase 4 scratch route (?scratch=primitives): each primitive working in isolation. */
export function Primitives() {
  const s = useVehicle();
  const { reduced } = useMotionPrefs();
  return (
    <div className="prim">
      <header className="prim__head">
        <h1>Motion primitives</h1>
        <div className="prim__row">
          <Btn onClick={() => s.setProfile(s.profile === "expressive" ? "calm" : "expressive")}>Profile: {s.profile}</Btn>
          <Btn onClick={s.toggleTheme}>Theme: {s.theme}</Btn>
          <span className="prim__note">reduced: {String(reduced)}</span>
        </div>
      </header>
      <div className="prim__grid">
        <RollingCard />
        <BarCard />
        <IndicatorCard />
        <PressCard />
        <MorphCard />
        <DrawCard />
      </div>
    </div>
  );
}

function Card({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="prim__card">
      <h2>{title}</h2>
      <p className="prim__note">{note}</p>
      {children}
    </section>
  );
}

function Btn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className="prim__btn" {...props} />;
}

function RollingCard() {
  const [n, setN] = useState(64);
  const [rollKey, setRollKey] = useState(0);
  const timer = useRef<number[]>([]);
  const burst = () => {
    timer.current.forEach(clearTimeout);
    timer.current = Array.from({ length: 10 }, (_, i) => window.setTimeout(() => setN((v) => v + 1), i * 40));
  };
  return (
    <Card title="RollingNumber" note="Digits roll in the direction of change. Roll-up and live speed smooth the value on spring-value.">
      <div className="prim__row prim__row--end">
        <RollingNumber className="prim__speed" value={n} />
        <RollingNumber key={rollKey} className="prim__mid" value={88} from={0} smooth="value" />
        <div className="prim__live">
          <RollingNumber className="prim__mid" value={live.speed} smooth="value" />
          <span className="prim__note">live km/h</span>
        </div>
      </div>
      <div className="prim__row">
        <Btn onClick={() => setN((v) => v + 1)}>+1</Btn>
        <Btn onClick={() => setN((v) => Math.max(0, v - 1))}>-1</Btn>
        <Btn onClick={() => setN((v) => v + 9)}>+9</Btn>
        <Btn onClick={() => setN(Math.round(Math.random() * 140))}>Random</Btn>
        <Btn onClick={burst}>10 fast +1</Btn>
        <Btn onClick={() => setRollKey((k) => k + 1)}>Roll up 0 to 88</Btn>
      </div>
    </Card>
  );
}

const trackLevel = live.trackProgress;

function BarCard() {
  const [v, setV] = useState(0.78);
  const [key, setKey] = useState(0);
  return (
    <Card title="SpringBar" note="translateX inside a clipped track, spring-value. Fill turns amber under 20% over duration-slow.">
      <div className="prim__stack">
        <SpringBar key={key} from={0} value={v} className="prim__bar" fillClassName={v < 0.2 ? "prim__fill prim__fill--low" : "prim__fill"} />
        <SpringBar value={trackLevel} className="prim__bar prim__bar--thin" fillClassName="prim__fill prim__fill--media" />
      </div>
      <div className="prim__row">
        {[0.15, 0.5, 0.78, 1].map((x) => (
          <Btn key={x} onClick={() => setV(x)}>
            {Math.round(x * 100)}%
          </Btn>
        ))}
        <Btn onClick={() => setKey((k) => k + 1)}>Fill from 0</Btn>
      </div>
    </Card>
  );
}

function IndicatorCard() {
  const [gear, setGear] = useState<(typeof GEARS)[number]>("P");
  const [mode, setMode] = useState<(typeof MODES)[number]>("Comfort");
  const [dramatic, setDramatic] = useState(false);
  return (
    <Card title="SharedIndicator" note="Overshoot solved per move: 3% of travel, max 8px. Into D uses dramatic (6%, max 16px). Labels recolour under the thumb.">
      <SharedIndicator
        items={GEARS}
        active={gear}
        mode={dramatic ? "dramatic" : "expressive"}
        className="gears"
        pillClassName="prim__gear-pill"
        renderItem={(g, sel, bind) => (
          <button key={g} {...bind} type="button" className={`gear hit-56 prim__gear ${sel ? "is-sel" : ""}`} onClick={() => { setDramatic(g === "D"); setGear(g); }}>
            {g}
          </button>
        )}
      />
      <SharedIndicator
        items={MODES}
        active={mode}
        className="mode-track"
        pillClassName="prim__thumb"
        radius={13}
        renderItem={(m, sel, bind) => (
          <button key={m} {...bind} type="button" role="radio" aria-checked={sel} className="mode-seg prim__seg" onClick={() => setMode(m)}>
            {m}
          </button>
        )}
        renderActiveLabel={(m) => (
          <span key={m} className="mode-seg prim__seg prim__seg--active">
            {m}
          </span>
        )}
      />
    </Card>
  );
}

function PressCard() {
  const [taps, setTaps] = useState(0);
  return (
    <Card title="PressScale" note="spring-press, lands inside 160ms, releases instantly. Tiles 0.96, temperature 0.94, dock 0.92.">
      <div className="prim__row">
        <PressScale className="temp-btn" strength="press" onClick={() => setTaps((t) => t + 1)} aria-label="Tile">
          <Icon name="defrost" />
        </PressScale>
        <PressScale className="temp-btn" strength="strong" onClick={() => setTaps((t) => t + 1)} aria-label="Plus">
          <Icon name="plus" />
        </PressScale>
        <PressScale className="dock__item prim__dock" strength="dock" onClick={() => setTaps((t) => t + 1)} aria-label="Media">
          <Icon name="media" />
        </PressScale>
        <span className="prim__mid">
          <RollingNumber value={taps} />
        </span>
      </div>
    </Card>
  );
}

function MorphCard() {
  const [playing, setPlaying] = useState(true);
  const [added, setAdded] = useState(false);
  return (
    <Card title="MorphIcon" note="Play and pause: a quarter turn at duration-short. Add stop: 2px blur crossfade.">
      <div className="prim__row">
        <PressScale className="icon-btn icon-btn--solid icon-btn--round" style={{ width: 64, height: 64 }} onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"}>
          <MorphIcon name={playing ? "pause" : "play"} />
        </PressScale>
        <PressScale className="pill-btn tip__action prim__add" onClick={() => setAdded((a) => !a)}>
          {added && <MorphIcon name="check" look="blur" size={20} />}
          <span>{added ? "Added" : "Add stop"}</span>
        </PressScale>
      </div>
    </Card>
  );
}

const manual = motionValue(0.4);

function DrawCard() {
  const [k, setK] = useState(0);
  const [p, setP] = useState(0.4);
  return (
    <Card title="DrawPath" note="One-shot draw (route, limit ring) or tied to a live value (route ahead of the car).">
      <div className="prim__row prim__row--top">
        <svg width="420" height="210" viewBox="0 0 420 210" className="prim__svg" aria-hidden="true">
          <path d={ROUTE} stroke="var(--map-road)" strokeWidth={14} fill="none" strokeLinejoin="round" />
          <DrawPath d={ROUTE} draw={{ duration: "slow", key: k }} stroke="var(--accent-default)" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <DrawPath d={ROUTE} start={manual} stroke="var(--text-primary)" strokeWidth={3} fill="none" strokeLinecap="round" transform="translate(0 0)" />
        </svg>
        <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
          <circle cx="42" cy="42" r="38" fill="var(--sign-bg)" />
          <DrawPath d={RING} draw={{ duration: "normal", key: k }} stroke="var(--sign-ring)" strokeWidth={8} fill="none" />
        </svg>
      </div>
      <div className="prim__row">
        <Btn onClick={() => setK((x) => x + 1)}>Replay draw</Btn>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={p}
          aria-label="Car position along route"
          onChange={(e) => {
            setP(+e.target.value);
            manual.set(+e.target.value);
          }}
        />
        <span className="prim__note">white line: route ahead of position {Math.round(p * 100)}%</span>
      </div>
    </Card>
  );
}
