import type { ReactNode } from "react";
import type { HTMLMotionProps } from "motion/react";
import { Icon, type IconName } from "./icons/Icon";
import { PressScale } from "../primitives/PressScale";

type Variant = "tile" | "accent" | "ghost" | "solid";

/**
 * Control/Icon button (Figma 3:65). Square 64px touch control for climate and shortcuts.
 * tile: panel-2 fill. accent: active climate. ghost: media skip. solid: media play.
 * Press feedback on spring-press.
 */
export function IconButton({
  icon,
  label,
  variant = "tile",
  size = 64,
  round = false,
  className = "",
  children,
  style,
  ...rest
}: {
  icon?: IconName;
  label: string;
  variant?: Variant;
  size?: 56 | 64;
  round?: boolean;
  children?: ReactNode;
} & Omit<HTMLMotionProps<"button">, "children">) {
  return (
    <PressScale
      aria-label={label}
      className={`icon-btn icon-btn--${variant} ${round ? "icon-btn--round" : ""} ${className}`}
      style={{ width: size, height: size, ...style }}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {children}
    </PressScale>
  );
}
