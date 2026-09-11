import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ usePathname: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname: mocks.usePathname }));

import { ModuleNavigation } from "./module-navigation";
import { moduleRegistry } from "@/core/modules/registry";

function renderNavigation(pathname: string) {
  mocks.usePathname.mockReturnValue(pathname);
  return renderToStaticMarkup(<ModuleNavigation modules={moduleRegistry} />);
}

describe("ModuleNavigation", () => {
  beforeEach(() => vi.resetAllMocks());

  it.each(["/find-it", "/find-it/items/item-id", "/find-it/locations"])
  ("marks Find It active for %s", (pathname) => {
    const html = renderNavigation(pathname);

    expect(html).toContain('aria-current="page" href="/find-it"');
    expect(html).not.toContain('aria-current="page" href="/buy-later"');
  });

  it.each(["/buy-later", "/buy-later/items/item-id", "/buy-later/import", "/buy-later/history"])
  ("marks Buy Later active for %s", (pathname) => {
    const html = renderNavigation(pathname);

    expect(html).toContain('aria-current="page" href="/buy-later"');
    expect(html).not.toContain('aria-current="page" href="/find-it"');
  });

  it.each(["/", "/auth/sign-in", "/auth/sign-up"])("leaves module navigation neutral for %s", (pathname) => {
    expect(renderNavigation(pathname)).not.toContain("aria-current");
  });
});
