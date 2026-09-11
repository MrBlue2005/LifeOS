import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");
const appShell = readFileSync(
  join(process.cwd(), "src", "core", "components", "app-shell.tsx"),
  "utf8",
);
const reminderSettings = readFileSync(
  join(process.cwd(), "src", "modules", "buy-later", "components", "reminder-settings.tsx"),
  "utf8",
);

describe("mobile compact controls", () => {
  it("keeps navigation, account, and reminder controls on the shared touch-target rule", () => {
    expect(styles).toContain("@media (hover: none) and (pointer: coarse)");
    expect(styles).toContain(".module-nav a,");
    expect(styles).toContain(".quiet-button,");
    expect(styles).toContain(".account-create-link,");
    expect(styles).toContain(".reminder-privacy {");
    expect(styles).toContain("min-height: 2.75rem;");
  });

  it("retains semantic navigation and reminder actions", () => {
    expect(appShell).toContain('<nav className="module-nav" aria-label="RX LifeOS modules">');
    expect(appShell).toContain('className="quiet-button"');
    expect(appShell).toContain('className="account-create-link"');
    expect(reminderSettings).toContain('className="reminder-privacy"');
    expect(reminderSettings).toContain('className="quiet-button"');
    expect(reminderSettings).toContain('className="secondary-button"');
  });
});
