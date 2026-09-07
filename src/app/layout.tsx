import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/core/components/app-shell";

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
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RX LifeOS",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#07061a",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
