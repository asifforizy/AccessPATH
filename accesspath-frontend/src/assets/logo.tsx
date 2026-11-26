// components/Logo.tsx
import type { SVGProps } from "react";

export interface LogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
  title?: string;
}

const ASPECT_RATIO = 78 / 32;

export default function Logo({
  size = 32,
  title = "Logo",
  ...props
}: LogoProps) {
  const decorative = title === "";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size * ASPECT_RATIO}
      height={size}
      viewBox="0 0 78 32"
      fill="none"
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
      {...props}
    >
      {!decorative && <title>{title}</title>}
      <g id="logomark">
        <path d="M55.5 0H77.5L58.5 32H36.5L55.5 0Z" fill="#FF7A00" />
        <g id="monovar">
          <path d="M35.5 0H51.5L32.5 32H16.5L35.5 0Z" fill="#FF9736" />
        </g>
        <g id="monovar_2">
          <path d="M19.5 0H31.5L12.5 32H0.5L19.5 0Z" fill="#FFBC7D" />
        </g>
      </g>
    </svg>
  );
}
