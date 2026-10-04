import type { SVGProps } from "react";

/**
 * The 16 icons from the Figma Components page (3:6 to 3:64), exported as SVG through the Plugin API.
 * Strokes use currentColor so each instance takes its colour token from its parent, as in Figma.
 */
const paths = {
  "turn-right": (
    <>
      <path d="M7 20V11C7 10.2044 7.31607 9.44129 7.87868 8.87868C8.44129 8.31607 9.20435 8 10 8H19" />
      <path d="M15 4L19 8L15 12" />
    </>
  ),
  navigation: <path d="M3 11L21 3L13 21L11 13L3 11Z" />,
  media: (
    <>
      <path d="M9 18V5L21 3V16" />
      <path d="M6 21C7.65685 21 9 19.6569 9 18C9 16.3431 7.65685 15 6 15C4.34315 15 3 16.3431 3 18C3 19.6569 4.34315 21 6 21Z" />
      <path d="M18 19C19.6569 19 21 17.6569 21 16C21 14.3431 19.6569 13 18 13C16.3431 13 15 14.3431 15 16C15 17.6569 16.3431 19 18 19Z" />
    </>
  ),
  phone: (
    <path d="M9 4H5C4.46957 4 3.96086 4.21071 3.58579 4.58579C3.21071 4.96086 3 5.46957 3 6C3.23705 9.90074 4.8935 13.5798 7.65683 16.3432C10.4202 19.1065 14.0993 20.763 18 21C18.5304 21 19.0391 20.7893 19.4142 20.4142C19.7893 20.0391 20 19.5304 20 19V15L15 13L13.5 15.5C11.3285 14.429 9.57096 12.6715 8.5 10.5L11 9L9 4Z" />
  ),
  car: (
    <>
      <path d="M5 17H19V13L17 8H7L5 13V17Z" />
      <path d="M8 19C9.10457 19 10 18.1046 10 17C10 15.8954 9.10457 15 8 15C6.89543 15 6 15.8954 6 17C6 18.1046 6.89543 19 8 19Z" />
      <path d="M16 19C17.1046 19 18 18.1046 18 17C18 15.8954 17.1046 15 16 15C14.8954 15 14 15.8954 14 17C14 18.1046 14.8954 19 16 19Z" />
    </>
  ),
  defrost: (
    <>
      <path d="M18 5H6C4.34315 5 3 6.34315 3 8V16C3 17.6569 4.34315 19 6 19H18C19.6569 19 21 17.6569 21 16V8C21 6.34315 19.6569 5 18 5Z" />
      <path data-heat d="M8 9C9 10 9 11 8 12C7 13 7 14 8 15M12 9C13 10 13 11 12 12C11 13 11 14 12 15M16 9C17 10 17 11 16 12C15 13 15 14 16 15" />
    </>
  ),
  "seat-heat": (
    <>
      <path d="M7 3V12C7 12.7956 7.31607 13.5587 7.87868 14.1213C8.44129 14.6839 9.20435 15 10 15H17L19 21" />
      <path d="M6 21H15" />
      <path data-heat d="M13 3C14 4 14 5 13 6M17 3C18 4 18 5 17 6" />
    </>
  ),
  fan: (
    <>
      <path d="M12 12C12 8 13 4 16 4C19 4 19 8 12 12Z" />
      <path d="M12 12C16 12 20 13 20 16C20 19 16 19 12 12Z" />
      <path d="M12 12C12 16 11 20 7.99999 20C4.99999 20 4.99999 16 12 12Z" />
      <path d="M12 12C8 12 4 11 4 8C4 5 8 5 12 12Z" />
    </>
  ),
  snowflake: <path d="M12 2V22M4.89999 6L19.1 18M19.1 6L4.89999 18" />,
  "skip-back": (
    <>
      <path d="M19 20L9 12L19 4V20Z" />
      <path d="M5 19V5" />
    </>
  ),
  "skip-forward": (
    <>
      <path d="M5 4L15 12L5 20V4Z" />
      <path d="M19 5V19" />
    </>
  ),
  pause: (
    <g fill="currentColor" stroke="none">
      <path d="M9 5H7C6.44772 5 6 5.44772 6 6V18C6 18.5523 6.44772 19 7 19H9C9.55228 19 10 18.5523 10 18V6C10 5.44772 9.55228 5 9 5Z" />
      <path d="M17 5H15C14.4477 5 14 5.44772 14 6V18C14 18.5523 14.4477 19 15 19H17C17.5523 19 18 18.5523 18 18V6C18 5.44772 17.5523 5 17 5Z" />
    </g>
  ),
  /** Not in the Figma set: drawn to pair with pause for the play and pause change. */
  play: (
    <g fill="currentColor" stroke="none">
      <path d="M8 5.14V18.86C8 19.65 8.87 20.13 9.54 19.7L20.33 12.85C20.95 12.46 20.95 11.54 20.33 11.15L9.54 4.3C8.87 3.87 8 4.35 8 5.14Z" />
    </g>
  ),
  "chevron-left": <path d="M15 5L8 12L15 19" />,
  sparkle: <path d="M12 3L13.8 7.7L18.5 9.5L13.8 11.3L12 16L10.2 11.3L5.5 9.5L10.2 7.7L12 3Z" />,
  minus: <path d="M5 12H19" />,
  plus: <path d="M12 5V19M5 12H19" />,
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 24, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
