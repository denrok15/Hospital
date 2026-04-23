import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

export const UserAddIcon = ({ title, ...props }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden={!title}
    {...props}
  >
    {title ? <title>{title}</title> : null}
    <path d="M15 20v-1a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v1" />
    <circle cx="8" cy="7" r="4" />
    <path d="M19 8v6" />
    <path d="M22 11h-6" />
  </svg>
);
