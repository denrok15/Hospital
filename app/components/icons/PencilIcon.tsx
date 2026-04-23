import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

export const PencilIcon = ({ title, ...props }: IconProps) => (
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
    <path d="M16 3l5 5L8 21H3v-5L16 3z" />
    <path d="M15 4l5 5" />
  </svg>
);
