import { Children, isValidElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { reconsiderationPresets } from "../domain/dates";
import { ReconsiderationDateControl, ReconsiderationPresetButtons } from "./date-preset-buttons";

const presets = reconsiderationPresets("2026-09-08");

function renderPresets(value: string): string {
  return renderToStaticMarkup(
    <ReconsiderationPresetButtons onChange={() => undefined} presets={presets} value={value} />,
  );
}

function expectOnlyPressed(html: string, label?: string) {
  expect(html.match(/aria-pressed="true"/g) ?? []).toHaveLength(label ? 1 : 0);
  if (label) expect(html).toContain(`aria-pressed="true" type="button">${label}</button>`);
}

function renderControl(value: string, onChange: (value: string) => void): string {
  return renderToStaticMarkup(
    <ReconsiderationDateControl
      label="Custom date"
      onChange={onChange}
      presets={presets}
      value={value}
    />,
  );
}

describe("ReconsiderationPresetButtons", () => {
  it.each([
    ["Tomorrow", "2026-09-09"],
    ["In 3 days", "2026-09-11"],
    ["In 1 week", "2026-09-15"],
    ["In 2 weeks", "2026-09-22"],
    ["In 1 month", "2026-10-08"],
  ])("selects only %s when its calendar date is current", (label, value) => {
    expectOnlyPressed(renderPresets(value), label);
  });

  it("selects no preset for a non-matching custom date", () => {
    expectOnlyPressed(renderPresets("2026-09-12"));
  });

  it.each([
    ["Tomorrow", "2026-09-09", 0],
    ["In 3 days", "2026-09-11", 1],
    ["In 1 week", "2026-09-15", 2],
    ["In 2 weeks", "2026-09-22", 3],
    ["In 1 month", "2026-10-08", 4],
  ])("updates the submitted date and pressed state when %s is activated", (label, expectedDate, index) => {
    let currentDate = "2026-09-15";
    const onChange = vi.fn((value: string) => { currentDate = value; });
    const group = ReconsiderationPresetButtons({ presets, value: currentDate, onChange });
    const buttons = Children.toArray(group.props.children).filter(isValidElement) as ReactElement<{
      onClick: () => void;
      type: string;
    }>[];

    expect(buttons[index].props.type).toBe("button");
    buttons[index].props.onClick();
    expect(onChange).toHaveBeenCalledWith(expectedDate);

    const html = renderControl(currentDate, onChange);
    expect(html).toContain(`type="date"`);
    expect(html).toContain(`name="reconsiderAt" value="${expectedDate}"`);
    expectOnlyPressed(html, label);
  });
});
