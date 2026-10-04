import { Icon } from "../components/icons/Icon";
import { ListRow } from "../components/ListRow";
import type { Tyres, VehicleState } from "../sim/types";
import { CarTopView, isLow } from "./CarTopView";
import "./health.css";

type Corner = keyof Tyres;
const LABEL: Record<Corner, string> = { fl: "FRONT LEFT", fr: "FRONT RIGHT", rl: "REAR LEFT", rr: "REAR RIGHT" };

function TyreReadout({ corner, bar, align }: { corner: Corner; bar: number; align: "end" | "start" }) {
  const low = isLow(bar);
  const front = corner === "fl" || corner === "fr";
  return (
    <div className={`tyre tyre--${align} ${low ? "is-low" : ""}`}>
      {front &&
        (low ? (
          <span className="tyre-chip">
            <span className="tyre-chip__dot" aria-hidden="true" />
            Low
          </span>
        ) : (
          <span className="tyre-chip-spacer" aria-hidden="true" />
        ))}
      <span className="tyre__value">{bar.toFixed(1)}</span>
      <span className="tyre__label">{LABEL[corner]} · BAR</span>
    </div>
  );
}

/** Vehicle health, Figma 5:186. */
export function VehicleHealth({ s, onBack }: { s: VehicleState; onBack?: () => void }) {
  const lowCount = (Object.values(s.tyres) as number[]).filter(isLow).length;
  const attention = lowCount;
  return (
    <div className="health">
      <section className="panel health__main" aria-label="Tyres and status">
        <header className="health__header">
          <button type="button" className="icon-btn icon-btn--tile health__back" style={{ width: 56, height: 56 }} aria-label="Back to Drive" onClick={onBack}>
            <Icon name="chevron-left" />
          </button>
          <div className="health__titles">
            <h1 className="health__title">Vehicle health</h1>
            <p className="health__sub">
              {attention === 0 ? "Nothing needs attention" : attention === 1 ? "1 item needs attention" : `${attention} items need attention`} · checked 2 min ago
            </p>
          </div>
        </header>

        <div className="tyres">
          <div className="tyres__col tyres__col--left">
            <TyreReadout corner="fl" bar={s.tyres.fl} align="end" />
            <TyreReadout corner="rl" bar={s.tyres.rl} align="end" />
          </div>
          <CarTopView tyres={s.tyres} />
          <div className="tyres__col tyres__col--right">
            <TyreReadout corner="fr" bar={s.tyres.fr} align="start" />
            <TyreReadout corner="rr" bar={s.tyres.rr} align="start" />
          </div>
        </div>

        <div className="tip">
          <Icon name="sparkle" className="tip__icon" />
          <p className="tip__text">Pressure dropped 0.4 bar since yesterday. There is a tyre service 2.3 km ahead on your route.</p>
          <button type="button" className="pill-btn tip__action hit-56">
            Add stop
          </button>
        </div>
      </section>

      <div className="health__side">
        <section className="panel side-card" aria-label="Systems">
          <h2 className="side-card__title">Systems</h2>
          <ListRow name="Tyres" state={lowCount ? `${lowCount} LOW` : "OK"} tone={lowCount ? "warning" : "ok"} />
          <ListRow name="Battery" state="98% HEALTH" tone="ok" />
          <ListRow name="Brakes" state="OK" tone="ok" />
          <ListRow name="Lights" state="OK" tone="ok" />
          <ListRow name="Software" state="UPDATE READY" tone="accent" />
        </section>
        <section className="panel side-card side-card--grow" aria-label="Maintenance">
          <h2 className="side-card__title">Maintenance</h2>
          <ListRow name="Tyre rotation" state={`IN ${s.serviceKm.toLocaleString("en-GB")} KM`} dot={false} />
          <ListRow name="Cabin air filter" state="NOV 2026" dot={false} />
          <ListRow name="Brake fluid" state="MAR 2027" dot={false} />
          <div className="side-card__spacer" />
          <div className="side-card__actions">
            <button type="button" className="pill-btn pill-btn--solid">Book service</button>
            <button type="button" className="pill-btn pill-btn--outline">Remind me later</button>
          </div>
        </section>
      </div>
    </div>
  );
}
