import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AliasManager } from "./alias-manager";

const itemId = "20000000-0000-4000-8000-000000000001";

describe("AliasManager", () => {
  it("renders a labelled, mobile-safe empty add flow", () => {
    const html = renderToStaticMarkup(<AliasManager aliases={[]} itemId={itemId} />);

    expect(html).toContain("No aliases yet.");
    expect(html).toContain('for="item-alias-input"');
    expect(html).toContain("Add another name");
    expect(html).toContain("Add alias");
    expect(html).toContain('class="add-alias-form"');
  });

  it("renders each saved alias with a contextual remove label", () => {
    const html = renderToStaticMarkup(
      <AliasManager
        aliases={[
          {
            id: "40000000-0000-4000-8000-000000000001",
            itemId,
            alias: "A very long alias that can safely wrap on a narrow phone screen",
            createdAt: "2026-09-10T00:00:00.000Z",
          },
        ]}
        itemId={itemId}
      />,
    );

    expect(html).toContain("A very long alias that can safely wrap on a narrow phone screen");
    expect(html).toContain('aria-label="Remove alias A very long alias that can safely wrap on a narrow phone screen"');
    expect(html).toContain('class="item-alias-list"');
  });
});
