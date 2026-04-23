import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

export const ChevronDownIcon = ({ title, ...props }: IconProps) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden={!title}
    {...props}
  >
    {title ? <title>{title}</title> : null}
    <path d="M5 8l5 5 5-5" />
  </svg>
);
