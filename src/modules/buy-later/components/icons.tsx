import type { ReactNode, SVGProps } from "react";

type Props = Readonly<SVGProps<SVGSVGElement>>;

function Icon({ children, ...props }: Props & Readonly<{ children: ReactNode }>) {
  return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>{children}</svg>;
}

export function PauseIcon(props: Props) {
  return <Icon {...props}><path d="M8 5v14M16 5v14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></Icon>;
}

export function BagIcon(props: Props) {
  return <Icon {...props}><path d="M6 8h12l-1 11H7L6 8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /><path d="M9 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></Icon>;
}

export function ClockIcon(props: Props) {
  return <Icon {...props}><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" /><path d="M12 8v4l3 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></Icon>;
}

export function ArrowIcon(props: Props) {
  return <Icon {...props}><path d="m9 5 7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></Icon>;
}
