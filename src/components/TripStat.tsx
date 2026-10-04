import type { ReactNode } from "react";

/** Data/Trip stat (Figma 3:83). */
export function TripStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="trip-stat">
      <span className="trip-stat__label">{label}</span>
      <span className="trip-stat__value">{value}</span>
    </div>
  );
}
