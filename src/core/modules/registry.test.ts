import { describe, expect, it } from "vitest";

import type { LifeOSModuleDefinition } from "./module-definition";
import { createModuleRegistry, moduleRegistry } from "./registry";

const exampleModule = {
  id: "example",
  name: "Example",
  description: "An example module.",
  href: "/example",
  status: "coming-soon",
} satisfies LifeOSModuleDefinition;

describe("moduleRegistry", () => {
  it("registers the Phase 0 modules in a deterministic order", () => {
    expect(moduleRegistry.map(({ id }) => id)).toEqual(["find-it", "buy-later"]);
  });

  it("contains unique module IDs and routes", () => {
    const ids = moduleRegistry.map(({ id }) => id);
    const routes = moduleRegistry.map(({ href }) => href);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("rejects a duplicate module ID", () => {
    expect(() =>
      createModuleRegistry([
        exampleModule,
        { ...exampleModule, href: "/another-example" },
      ]),
    ).toThrow("Duplicate module ID: example");
  });

  it("rejects a duplicate module route", () => {
    expect(() =>
      createModuleRegistry([
        exampleModule,
        { ...exampleModule, id: "another-example" },
      ]),
    ).toThrow("Duplicate module route: /example");
  });
});
