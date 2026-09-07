import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "RX LifeOS",
    short_name: "RX LifeOS",
    description:
      "Your everyday operating system for remembering what matters and making deliberate decisions.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#07061a",
    theme_color: "#07061a",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
