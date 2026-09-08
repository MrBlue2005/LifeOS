import { describe, expect, it, vi } from "vitest";
import { fetchProductMetadata } from "./fetch-product-metadata";
import type { ResolveHostname } from "./network-safety";

const publicDns: ResolveHostname = async () => [{ address: "93.184.216.34", family: 4 }];

describe("Buy Later product metadata fetch", () => {
  it("extracts only a title from a small HTML response", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('<meta property="og:title" content="Desk lamp"><meta property="og:price" content="99">', {
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );
    await expect(
      fetchProductMetadata("https://example.com/product", { fetch: request, resolveHostname: publicDns }),
    ).resolves.toEqual({ title: "Desk lamp" });
    expect(request).toHaveBeenCalledWith(
      new URL("https://example.com/product"),
      expect.objectContaining({ credentials: "omit", redirect: "manual", cache: "no-store" }),
    );
  });

  it("rejects a redirect to a private address before requesting it", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 302, headers: { location: "http://127.0.0.1/private" } }),
    );
    await expect(
      fetchProductMetadata("https://example.com/product", { fetch: request, resolveHostname: publicDns }),
    ).resolves.toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("follows at most three safe redirects and revalidates every hostname", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: "https://one.example/item" } }))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: "https://two.example/item" } }))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: "https://three.example/item" } }))
      .mockResolvedValueOnce(new Response("<title>Final title</title>", { headers: { "content-type": "text/html" } }));
    const resolve = vi.fn<ResolveHostname>(publicDns);
    await expect(
      fetchProductMetadata("https://example.com/product", { fetch: request, resolveHostname: resolve }),
    ).resolves.toEqual({ title: "Final title" });
    expect(request).toHaveBeenCalledTimes(4);
    expect(resolve).toHaveBeenCalledTimes(4);
  });

  it("fails quietly for non-HTML and oversized responses", async () => {
    const nonHtml = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("{}", { headers: { "content-type": "application/json" } }),
    );
    await expect(
      fetchProductMetadata("https://example.com/product", { fetch: nonHtml, resolveHostname: publicDns }),
    ).resolves.toBeNull();

    const oversized = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("ignored", { headers: { "content-type": "text/html", "content-length": "300000" } }),
    );
    await expect(
      fetchProductMetadata("https://example.com/product", { fetch: oversized, resolveHostname: publicDns }),
    ).resolves.toBeNull();

    const streamedOversize = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(256 * 1024));
            controller.enqueue(new Uint8Array(1));
            controller.close();
          },
        }),
        { headers: { "content-type": "text/html" } },
      ),
    );
    await expect(
      fetchProductMetadata("https://example.com/product", { fetch: streamedOversize, resolveHostname: publicDns }),
    ).resolves.toBeNull();
  });

  it("fails quietly when the network request rejects", async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValue(new Error("blocked"));
    await expect(
      fetchProductMetadata("https://example.com/product", { fetch: request, resolveHostname: publicDns }),
    ).resolves.toBeNull();
  });
});
