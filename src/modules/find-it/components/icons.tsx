import type { ReactNode } from "react";

type IconProps = Readonly<{ className?: string }>;

function IconFrame({
  children,
  className,
}: IconProps & Readonly<{ children: ReactNode }>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </IconFrame>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </IconFrame>
  );
}

export function LocationIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path
        d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </IconFrame>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </IconFrame>
  );
}

export function MoreIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <circle cx="5" cy="12" fill="currentColor" r="1.35" />
      <circle cx="12" cy="12" fill="currentColor" r="1.35" />
      <circle cx="19" cy="12" fill="currentColor" r="1.35" />
    </IconFrame>
  );
}

export function ItemIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path
        d="m4.5 7.5 7.5-4 7.5 4v9L12 20.5l-7.5-4v-9Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="m4.8 7.7 7.2 4 7.2-4M12 11.7v8.4"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </IconFrame>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path
        d="m5 12.5 4.2 4L19 6.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </IconFrame>
  );
}
