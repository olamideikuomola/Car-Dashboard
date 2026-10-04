import { useState } from "react";
import { DRIVE_MODES } from "../components/ModeSegment";
import { useVehicle } from "../sim/useVehicleSim";
import type { Gear } from "../sim/types";
import "./demo.css";

const GEARS: Gear[] = ["P", "R", "N", "D"];

/**
 * Hidden demo controls, outside the scaled stage. Opens from the small corner button.
 * It is a tool, opened often while reviewing, so it opens and closes without animation.
 */
export function DemoPanel() {
  const [open, setOpen] = useState(false);
  const s = useVehicle();

  return (
    <>
      <button type="button" className="demo-toggle" aria-expanded={open} aria-controls="demo-panel" onClick={() => setOpen((o) => !o)}>
        {open ? "Close" : "Demo"}
      </button>
      {open && (
        <aside id="demo-panel" className="demo" aria-label="Demo controls">
          <Group title="Moments">
            <Btn onClick={s.wake}>Wake (replay)</Btn>
            <Btn onClick={s.toggleTheme}>Theme: {s.theme}</Btn>
            <Btn onClick={() => s.setScreen(s.screen === "drive" ? "health" : "drive")}>Screen: {s.screen}</Btn>
          </Group>
          <Group title="Gear">
            {GEARS.map((g) => (
              <Btn key={g} active={s.gear === g} onClick={() => s.setGear(g)}>
                {g}
              </Btn>
            ))}
          </Group>
          <Group title="Drive mode">
            {DRIVE_MODES.map((m) => (
              <Btn key={m} active={s.mode === m} onClick={() => s.setMode(m)}>
                {m}
              </Btn>
            ))}
          </Group>
          <Group title="Road">
            <Btn onClick={s.newLimit}>New limit ({s.limit})</Btn>
            <Btn onClick={s.overLimit}>Over limit</Btn>
            <Btn onClick={s.approachTurn}>Turn</Btn>
          </Group>
          <Group title="Vehicle and media">
            <Btn active={s.tyreAlert} onClick={() => s.setTyreAlert(!s.tyreAlert)}>
              Tyre alert {s.tyreAlert ? "on" : "off"}
            </Btn>
            <Btn onClick={() => s.changeTrack(1)}>Track change</Btn>
            <Btn active={s.battery < 20} onClick={s.toggleLowBattery}>
              Low battery
            </Btn>
          </Group>
          <Group title="Motion and sim">
            <Btn active={s.profile === "calm"} onClick={() => s.setProfile(s.profile === "expressive" ? "calm" : "expressive")}>
              Profile: {s.profile}
            </Btn>
            <Btn active={s.paused} onClick={s.togglePaused}>
              {s.paused ? "Resume sim" : "Pause sim"}
            </Btn>
          </Group>
        </aside>
      )}
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="demo__group">
      <h3 className="demo__title">{title}</h3>
      <div className="demo__row">{children}</div>
    </section>
  );
}

function Btn({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`demo__btn ${active ? "is-active" : ""}`} aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}
