import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

export const BrandIcon = ({ title, ...props }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden={!title}
    {...props}
  >
    {title ? <title>{title}</title> : null}
    <path d="M12 3c-3.866 0-7 3.134-7 7 0 4.25 1.562 6 2.3 7.16.876 1.319 1.523 1.84 1.523 1.84-.142 1.35-.153 2.195.2 2.72.3.46 1.269.28 2.227-.07.955.35 1.926.53 2.228.07.352-.525.342-1.37.2-2.72 0 0 .647-.52 1.522-1.839C17.438 16 19 14.25 19 10c0-3.866-3.134-7-7-7z" />
    <path d="M9.5 10.5c0 .828-.672 1.5-1.5 1.5S6.5 11.328 6.5 10.5 7.172 9 8 9s1.5.672 1.5 1.5zM18 10.5c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5.672-1.5 1.5-1.5 1.5.672 1.5 1.5z" />
    <path d="M8 15c1.333 1.334 3.333 1.334 4 1.334s2.667 0 4-1.334" />
  </svg>
);
