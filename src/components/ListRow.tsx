import type { ReactNode } from "react";

export type RowTone = "ok" | "warning" | "accent" | "none";

/** Data/List row (Figma 3:86). The dot and the state text share a tone so colour never carries state alone. */
export function ListRow({ name, state, tone = "none", dot = true }: { name: string; state: ReactNode; tone?: RowTone; dot?: boolean }) {
  return (
    <div className={`list-row list-row--${tone}`}>
      <div className="list-row__left">
        {dot && <span className="status-dot" aria-hidden="true" />}
        <span className="list-row__name">{name}</span>
      </div>
      <span className="list-row__state">{state}</span>
    </div>
  );
}
