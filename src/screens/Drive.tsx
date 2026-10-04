import { motion, useTransform, type MotionValue } from "motion/react";
import { Icon, type IconName } from "../components/icons/Icon";
import { IconButton } from "../components/IconButton";
import { ModeSegment } from "../components/ModeSegment";
import { TempStepper } from "../components/TempStepper";
import { TripStat } from "../components/TripStat";
import { LiveText } from "../primitives/LiveText";
import { live, useVehicle } from "../sim/useVehicleSim";
import type { Dock, Gear } from "../sim/types";
import { MapView } from "./MapView";
import "./drive.css";

const GEARS: Gear[] = ["P", "R", "N", "D"];
const DOCK: { id: Dock; icon: IconName; label: string }[] = [
  { id: "nav", icon: "navigation", label: "Navigation" },
  { id: "media", icon: "media", label: "Media" },
  { id: "phone", icon: "phone", label: "Phone" },
  { id: "car", icon: "car", label: "Car" },
];

const km = (n: number) => n.toLocaleString("en-GB");
const fmtDistance = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m >= 100 ? Math.round(m / 10) * 10 : Math.round(m)} m`);

/** Drive screen, Figma 4:2 (Night) and 5:66 (Day). One structure, theme switches the tokens. */
export function Drive() {
  const s = useVehicle();
  const onOpenHealth = () => s.setScreen("health");
  return (
    <div className="drive">
      <div className="drive__main">
        {/* Driving */}
        <section className="panel driving" aria-label="Driving">
          <header className="driving__header">
            <div className="gears" role="radiogroup" aria-label="Gear">
              {GEARS.map((g) => (
                <button key={g} type="button" role="radio" aria-checked={g === s.gear} className={`gear hit-56 ${g === s.gear ? "is-active" : ""}`} onClick={() => s.setGear(g)}>
                  {g}
                </button>
              ))}
            </div>
            <div className="clock">
              <span>{s.clock}</span>
              <span className="clock__rule" aria-hidden="true" />
              <span>{s.outsideTemp}°C</span>
            </div>
          </header>

          <div className="speed">
            <div className="speed__readout">
              <LiveText className="speed__value" value={live.speed} format={(v) => String(Math.round(v))} />
              <span className="speed__unit">KM/H</span>
            </div>
            <div className="limit">
              <div className="limit__sign">{s.limit}</div>
              <span className="limit__label">Limit</span>
            </div>
          </div>

          <div className="mode-battery">
            <ModeSegment value={s.mode} onChange={s.setMode} />
            <div className="battery">
              <div className="battery__row">
                <div className="battery__pct">
                  <span className="battery__value">{s.battery}%</span>
                  <span className="battery__label">Battery</span>
                </div>
                <div className="battery__range">
                  <span className="battery__range-value">{s.range}</span>
                  <span className="battery__label">km range</span>
                </div>
              </div>
              <div className="battery__bar">
                <div className="battery__fill" style={{ transform: `translateX(${s.battery - 100}%)` }} />
              </div>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="navigation" aria-label="Navigation">
          <MapView />
          <div className="next-turn">
            <div className="next-turn__icon">
              <Icon name="turn-right" style={s.turn.direction === "left" ? { transform: "scaleX(-1)" } : undefined} />
            </div>
            <div className="next-turn__text">
              <LiveText className="next-turn__distance" value={live.turnDistance} format={fmtDistance} />
              <span className="next-turn__road">
                Turn {s.turn.direction} onto {s.turn.road}
              </span>
            </div>
          </div>
          <div className="trip">
            <div className="trip__arrive">
              <span className="trip__arrive-label">Arrive</span>
              <span className="trip__arrive-time">{s.arrive}</span>
            </div>
            <div className="trip__route">
              <span>NOW</span>
              <div className="trip__track">
                <LiveBar className="trip__fill" value={live.tripProgress} />
              </div>
              <span>HOME</span>
            </div>
            <div className="trip__stats">
              <TripStat label="Time" value={`${s.minutesLeft} min`} />
              <TripStat label="Distance" value={`${s.kmLeft.toFixed(1)} km`} />
              <TripStat label="On arrival" value={`${s.arrivalBattery}%`} />
            </div>
          </div>
        </section>

        {/* Status and media */}
        <div className="status-media">
          <section className="panel vehicle" aria-label="Vehicle">
            <div className="vehicle__head">
              <h2 className="vehicle__title">Vehicle</h2>
              <button type="button" className="vehicle__link hit-56" onClick={onOpenHealth}>
                View all
              </button>
            </div>
            {s.tyreAlert && (
              <button type="button" className="alert pressable" onClick={onOpenHealth}>
                <span className="alert__dot" aria-hidden="true" />
                <span className="alert__text">
                  <span className="alert__title">Front left tyre low</span>
                  <span className="alert__sub">
                    <span className="mono">{s.tyres.fl.toFixed(1)} BAR</span>
                    <span>· check at your next stop</span>
                  </span>
                </span>
              </button>
            )}
            <div className="service">
              <div className="service__left">
                <span className="service__dot" aria-hidden="true" />
                <span>Service due</span>
              </div>
              <span className="service__km">IN {km(s.serviceKm)} KM</span>
            </div>
          </section>

          <section className="panel media" aria-label="Media">
            <div className="media__now">
              <div className="media__art" style={{ background: s.track.art }} />
              <div className="media__meta">
                <span className="media__title">{s.track.title}</span>
                <span className="media__sub">{s.track.subtitle}</span>
              </div>
            </div>
            <div className="media__progress">
              <LiveBar className="media__progress-fill" value={live.trackProgress} />
            </div>
            <div className="media__transport">
              <IconButton icon="skip-back" label="Previous track" variant="ghost" size={56} round onClick={() => s.changeTrack(-1)} />
              <IconButton icon={s.playing ? "pause" : "play"} label={s.playing ? "Pause" : "Play"} variant="solid" round onClick={s.togglePlaying} />
              <IconButton icon="skip-forward" label="Next track" variant="ghost" size={56} round onClick={() => s.changeTrack(1)} />
            </div>
          </section>
        </div>
      </div>

      {/* Controls */}
      <footer className="panel controls" aria-label="Climate and shortcuts">
        <TempStepper label="Driver" value={s.tempDriver} onStep={(d) => s.stepTemp("driver", d)} />
        <div className="climate">
          <button type="button" className={`climate__pill pressable ${s.ac ? "is-on" : ""}`} aria-pressed={s.ac} onClick={s.toggleAc}>
            <Icon name="snowflake" />
            <span>A/C</span>
          </button>
          <button type="button" className="climate__pill climate__fan pressable" aria-label={`Fan level ${s.fan}`} onClick={s.cycleFan}>
            <Icon name="fan" />
            <span className="mono">{s.fan}</span>
          </button>
          <IconButton icon="defrost" label="Rear defrost" variant={s.defrost ? "accent" : "tile"} aria-pressed={s.defrost} onClick={s.toggleDefrost} />
          <IconButton icon="seat-heat" label="Seat heating" variant={s.seatHeat ? "accent" : "tile"} aria-pressed={s.seatHeat} onClick={s.toggleSeatHeat} />
        </div>
        <nav className="dock" aria-label="Shortcuts">
          {DOCK.map((d) => (
            <button key={d.id} type="button" className={`dock__item pressable ${d.id === s.dock ? "is-active" : ""}`} aria-label={d.label} aria-current={d.id === s.dock ? "page" : undefined} onClick={() => s.setDock(d.id)}>
              <Icon name={d.icon} />
            </button>
          ))}
        </nav>
        <TempStepper label="Passenger" value={s.tempPassenger} onStep={(d) => s.stepTemp("passenger", d)} />
      </footer>
    </div>
  );
}

function LiveBar({ value, className }: { value: MotionValue<number>; className: string }) {
  const transform = useTransform(value, (p) => `translateX(${(Math.min(1, Math.max(0, p)) - 1) * 100}%)`);
  return <motion.div className={className} style={{ transform }} />;
}
