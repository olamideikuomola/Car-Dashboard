import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./icons/Icon";

type Variant = "tile" | "accent" | "ghost" | "solid";

/**
 * Control/Icon button (Figma 3:65). Square 64px touch control for climate and shortcuts.
 * tile: panel-2 fill. accent: active climate. ghost: media skip. solid: media play.
 */
export function IconButton({
  icon,
  label,
  variant = "tile",
  size = 64,
  round = false,
  className = "",
  children,
  ...rest
}: {
  icon: IconName;
  label: string;
  variant?: Variant;
  size?: 56 | 64;
  round?: boolean;
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`icon-btn icon-btn--${variant} ${round ? "icon-btn--round" : ""} ${className}`}
      style={{ width: size, height: size }}
      {...rest}
    >
      <Icon name={icon} />
      {children}
    </button>
  );
}
