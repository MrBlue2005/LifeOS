import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

const description =
  "RX LifeOS brings focused tools for everyday life into one calm, connected home.";

export const metadata: Metadata = {
  title: {
    default: "RX LifeOS",
    template: "%s · RX LifeOS",
  },
  description,
  applicationName: "RX LifeOS",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#0c1013",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
