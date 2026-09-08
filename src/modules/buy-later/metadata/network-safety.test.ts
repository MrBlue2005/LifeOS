import { describe, expect, it, vi } from "vitest";
import { isPublicNetworkAddress, validateMetadataUrl, type ResolveHostname } from "./network-safety";

const publicDns: ResolveHostname = async () => [{ address: "93.184.216.34", family: 4 }];

describe("Buy Later metadata network safety", () => {
  it.each([
    "http://localhost/product",
    "http://service.local/product",
    "http://127.0.0.1/product",
    "http://10.0.0.4/product",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/product",
    "https://user:password@example.com/product",
    "file:///etc/passwd",
  ])("rejects internal or unsafe target %s", async (value) => {
    expect(await validateMetadataUrl(value, publicDns)).toBeNull();
  });

  it("rejects a hostname when any resolved address is private", async () => {
    const mixedDns: ResolveHostname = async () => [
      { address: "93.184.216.34", family: 4 },
      { address: "192.168.1.20", family: 4 },
    ];
    expect(await validateMetadataUrl("https://example.com/product", mixedDns)).toBeNull();
  });

  it("accepts a public HTTPS target resolved only to public addresses", async () => {
    expect((await validateMetadataUrl("https://example.com/product", publicDns))?.toString()).toBe(
      "https://example.com/product",
    );
  });

  it("does not resolve hostnames already known to be unsafe", async () => {
    const resolve = vi.fn<ResolveHostname>();
    await expect(validateMetadataUrl("http://127.0.0.1", resolve)).resolves.toBeNull();
    expect(resolve).not.toHaveBeenCalled();
  });

  it("classifies representative reserved and public network addresses", () => {
    expect(isPublicNetworkAddress("192.168.1.1")).toBe(false);
    expect(isPublicNetworkAddress("::ffff:127.0.0.1")).toBe(false);
    expect(isPublicNetworkAddress("fe80::1")).toBe(false);
    expect(isPublicNetworkAddress("2606:2800:220:1:248:1893:25c8:1946")).toBe(true);
  });
});
