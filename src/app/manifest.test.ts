import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import manifest from "./manifest";

function readPngSize(fileName: string) {
  const content = readFileSync(join(process.cwd(), "public", fileName));

  return {
    width: content.readUInt32BE(16),
    height: content.readUInt32BE(20),
  };
}

describe("RX LifeOS manifest", () => {
  it("declares the required standalone install metadata", () => {
    expect(manifest()).toMatchObject({
      name: "RX LifeOS",
      short_name: "RX LifeOS",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#0c1013",
      theme_color: "#0c1013",
      icons: expect.arrayContaining([
        expect.objectContaining({ src: "/icon-192x192.png", sizes: "192x192" }),
        expect.objectContaining({ src: "/icon-512x512.png", sizes: "512x512" }),
        expect.objectContaining({ purpose: "maskable" }),
      ]),
    });
  });

  it.each([
    ["icon-192x192.png", 192],
    ["icon-512x512.png", 512],
    ["apple-touch-icon.png", 180],
  ])("ships %s at its declared dimensions", (fileName, size) => {
    expect(readPngSize(fileName)).toEqual({ width: size, height: size });
  });
});
